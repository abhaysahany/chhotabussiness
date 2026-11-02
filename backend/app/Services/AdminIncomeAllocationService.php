<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SalePayment;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AdminIncomeAllocationService
{
    /**
     * Fixed distribution percentages for Admin Income Allocation.
     * Direct Income: 40%, Level Income: 40%, Reward Income: 20%. Total = 100%.
     */
    public const DIRECT_PERCENT = 40.0;
    public const LEVEL_PERCENT = 40.0;
    public const REWARD_PERCENT = 20.0;

    /**
     * Calculate and return income allocation details for a specific payment receipt without persisting.
     *
     * @param SalePayment $payment
     * @return array
     */
    public function getPaymentAllocationDetails(SalePayment $payment): array
    {
        $order = $payment->order ?: Order::find($payment->sales_record_id);

        // 1. Authoritative Admin Cut snapshot for THIS specific payment receipt
        $paymentAdminCut = (float) ($payment->admin_commission_cut ?? 0);

        // 2. Previously allocated amount for THIS specific payment
        $previouslyAllocated = (float) ($payment->distributed_admin_cut_amount ?? 0);

        // 3. Eligible Admin Cut for THIS payment
        $status = $payment->income_distribution_status ?? 'pending';
        $eligibleAdminCut = in_array($status, ['completed', 'legacy_completed'])
            ? 0.0
            : max(0.0, round($paymentAdminCut - $previouslyAllocated, 2));

        // 4. Calculate live 40/40/20 preview using integer paise arithmetic
        $allocationBreakdown = $this->calculateSplit($eligibleAdminCut > 0 ? $eligibleAdminCut : $paymentAdminCut);

        // 5. Order cumulative totals
        $orderGross = (float) ($order?->gross_amount ?? 0);
        $orderDump = (float) ($order?->dump_amount ?? 0);
        $orderExpectedCut = (float) ($order?->admin_commission_cut ?? 0);
        $orderPayments = $order ? $order->payments()->get() : collect();
        $orderCollectedCut = (float) $orderPayments->sum('admin_commission_cut');
        $orderRemainingCut = max(0.0, round($orderExpectedCut - $orderCollectedCut, 2));
        $orderDistributedCut = (float) ($order?->distributed_admin_cut_amount ?? 0);
        $orderUnallocatedCut = max(0.0, round($orderCollectedCut - $orderDistributedCut, 2));

        return [
            'payment_id' => $payment->id,
            'sales_record_id' => $payment->sales_record_id,
            'invoice_number' => $payment->invoice_number,
            'reference_no' => $payment->reference_no,
            'payment_type' => $payment->payment_type ?: 'advance',
            'payment_date' => $payment->payment_date instanceof \DateTimeInterface
                ? $payment->payment_date->toIso8601String()
                : ($payment->payment_date ? (string) $payment->payment_date : null),
            'payment_amount' => (float) $payment->amount,
            'admin_commission_percent' => (float) $payment->admin_commission_percent,
            'payment_admin_cut' => $paymentAdminCut,
            'previously_allocated' => $previouslyAllocated,
            'eligible_admin_cut' => $eligibleAdminCut,
            'direct_income_amount' => in_array($status, ['completed', 'legacy_completed'])
                ? (float) ($payment->direct_income_amount ?? $allocationBreakdown['direct_amount'])
                : $allocationBreakdown['direct_amount'],
            'level_income_amount' => in_array($status, ['completed', 'legacy_completed'])
                ? (float) ($payment->level_income_amount ?? $allocationBreakdown['level_amount'])
                : $allocationBreakdown['level_amount'],
            'reward_income_amount' => in_array($status, ['completed', 'legacy_completed'])
                ? (float) ($payment->reward_income_amount ?? $allocationBreakdown['reward_amount'])
                : $allocationBreakdown['reward_amount'],
            'total_allocation' => in_array($status, ['completed', 'legacy_completed'])
                ? (float) ($payment->distributed_admin_cut_amount ?? $allocationBreakdown['total_amount'])
                : $allocationBreakdown['total_amount'],
            'income_distribution_status' => $status,
            'income_distributed_at' => $payment->income_distributed_at instanceof \DateTimeInterface
                ? $payment->income_distributed_at->toIso8601String()
                : ($payment->income_distributed_at ? (string) $payment->income_distributed_at : null),
            'income_distributed_by' => $payment->income_distributed_by,
            'can_allocate' => ($status === 'pending' && $eligibleAdminCut > 0),
            'order' => $order ? [
                'id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'entity_name' => $order->entity_name,
                'customer_name' => $order->customer_name,
                'customer_user_code' => $order->customer_user_code,
                'gross_amount' => $orderGross,
                'dump_amount' => $orderDump,
                'total_admin_cut' => $orderExpectedCut,
                'expected_admin_cut' => $orderExpectedCut,
                'total_payment_received' => (float) ($order->advance_payment ?? 0),
                'balance_due' => (float) ($order->balance_due ?? 0),
                'admin_commission_collected' => $orderCollectedCut,
                'remaining_admin_commission' => $orderRemainingCut,
                'total_distributed_cut' => $orderDistributedCut,
                'total_unallocated_cut' => $orderUnallocatedCut,
                'cumulative_direct_income' => (float) ($order->direct_income_amount ?? 0),
                'cumulative_level_income' => (float) ($order->level_income_amount ?? 0),
                'cumulative_reward_income' => (float) ($order->reward_income_amount ?? 0),
                'income_distribution_status' => $order->income_distribution_status ?? 'pending',
            ] : null,
        ];
    }

    /**
     * Confirm and persist income allocation for a single specific payment receipt.
     * Uses row-level locking on both the payment and the parent order.
     *
     * @param int $paymentId
     * @param int|null $adminId
     * @return array
     * @throws InvalidArgumentException
     */
    public function allocatePaymentIncome(int $paymentId, ?int $adminId = null): array
    {
        return DB::transaction(function () use ($paymentId, $adminId) {
            // 1. Lock payment row for update
            $payment = SalePayment::lockForUpdate()->findOrFail($paymentId);

            // 2. Lock parent order row for update
            $order = Order::lockForUpdate()->findOrFail($payment->sales_record_id);

            // 3. Validation and idempotency checks
            $currentStatus = $payment->income_distribution_status ?? 'pending';
            if (in_array($currentStatus, ['completed', 'legacy_completed'])) {
                throw new InvalidArgumentException(
                    "Payment #{$payment->id} (Invoice: {$payment->invoice_number}) has already been allocated (Status: {$currentStatus})."
                );
            }

            if ((float) ($payment->distributed_admin_cut_amount ?? 0) > 0) {
                throw new InvalidArgumentException(
                    "Payment #{$payment->id} has already been allocated."
                );
            }

            $paymentAdminCut = (float) ($payment->admin_commission_cut ?? 0);
            if ($paymentAdminCut <= 0) {
                throw new InvalidArgumentException(
                    "Payment #{$payment->id} has no Admin Cut available for allocation (Admin Cut is ₹0)."
                );
            }

            // 4. Calculate decimal-safe split using integer paise
            $split = $this->calculateSplit($paymentAdminCut);

            // 5. Update the payment receipt row with its allocation amounts and completed status
            $payment->update([
                'direct_income_amount' => $split['direct_amount'],
                'level_income_amount' => $split['level_amount'],
                'reward_income_amount' => $split['reward_amount'],
                'distributed_admin_cut_amount' => $paymentAdminCut,
                'income_distribution_status' => 'completed',
                'income_distributed_at' => now(),
                'income_distributed_by' => $adminId,
            ]);

            // 6. Atomically accumulate on parent order cumulative totals
            $newOrderDirect = round((float) ($order->direct_income_amount ?? 0) + $split['direct_amount'], 2);
            $newOrderLevel = round((float) ($order->level_income_amount ?? 0) + $split['level_amount'], 2);
            $newOrderReward = round((float) ($order->reward_income_amount ?? 0) + $split['reward_amount'], 2);
            $newOrderDistributedCut = round((float) ($order->distributed_admin_cut_amount ?? 0) + $paymentAdminCut, 2);

            $order->update([
                'direct_income_amount' => $newOrderDirect,
                'level_income_amount' => $newOrderLevel,
                'reward_income_amount' => $newOrderReward,
                'distributed_admin_cut_amount' => $newOrderDistributedCut,
                'income_distributed_at' => now(),
            ]);

            // 7. Recompute parent order's aggregate distribution status
            $this->syncOrderIncomeDistributionStatus($order);

            return [
                'payment' => $payment->fresh(),
                'order' => $order->fresh(['payments']),
                'allocated' => [
                    'payment_id' => $payment->id,
                    'eligible_admin_cut' => $paymentAdminCut,
                    'direct_income_amount' => $split['direct_amount'],
                    'level_income_amount' => $split['level_amount'],
                    'reward_income_amount' => $split['reward_amount'],
                    'total_allocated' => $split['total_amount'],
                ],
                'order_cumulative' => [
                    'direct_income_amount' => (float) $order->direct_income_amount,
                    'level_income_amount' => (float) $order->level_income_amount,
                    'reward_income_amount' => (float) $order->reward_income_amount,
                    'distributed_admin_cut_amount' => (float) $order->distributed_admin_cut_amount,
                    'income_distribution_status' => $order->income_distribution_status,
                ],
            ];
        });
    }

    /**
     * Synchronize and update the aggregate income distribution status for an Order
     * based on the status of all its associated payment receipts.
     *
     * Rules:
     * - 'pending': at least one payment with positive Admin Cut is pending, and no payment allocated yet.
     * - 'partial': at least one payment allocated and at least one payment pending.
     * - 'completed': every recorded eligible payment has been allocated (completed or legacy_completed).
     *
     * @param Order $order
     * @return string
     */
    public function syncOrderIncomeDistributionStatus(Order $order): string
    {
        $payments = $order->payments()->get();
        $eligiblePayments = $payments->filter(fn($p) => (float) ($p->admin_commission_cut ?? 0) > 0);

        if ($eligiblePayments->isEmpty()) {
            $status = 'pending';
        } else {
            $pendingCount = $eligiblePayments->filter(fn($p) => in_array($p->income_distribution_status, ['pending', null]))->count();
            $completedCount = $eligiblePayments->filter(fn($p) => in_array($p->income_distribution_status, ['completed', 'legacy_completed']))->count();

            if ($completedCount === 0) {
                $status = 'pending';
            } elseif ($pendingCount > 0) {
                $status = 'partial';
            } else {
                $status = 'completed';
            }
        }

        $order->update(['income_distribution_status' => $status]);
        return $status;
    }

    /**
     * Calculate and return income allocation details for an entire order (backward compatibility).
     *
     * @param Order $order
     * @return array
     */
    public function getOrderAllocationDetails(Order $order): array
    {
        $payments = $order->payments()->get();
        $paymentsSum = (float) round($payments->sum('admin_commission_cut'), 2);
        $expectedTotalCut = (float) ($order->admin_commission_cut > 0
            ? $order->admin_commission_cut
            : round(($order->gross_amount * ($order->admin_commission_percent ?: 15)) / 100, 2));
        $previouslyAllocated = (float) ($order->distributed_admin_cut_amount ?? 0);
        $eligibleAdminCut = max(0.0, round($paymentsSum - $previouslyAllocated, 2));
        $remainingAdminCommission = max(0.0, round($expectedTotalCut - $paymentsSum, 2));

        $allocationBreakdown = $this->calculateSplit($eligibleAdminCut);
        $status = $this->syncOrderIncomeDistributionStatus($order);

        return [
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer' => $order->customer,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'project_value' => (float) $order->gross_amount,
            'dump_amount' => (float) ($order->dump_amount ?? 0),
            'advance_payment' => (float) $order->advance_payment,
            'total_payment_received' => (float) $order->advance_payment,
            'balance_due' => (float) $order->balance_due,
            'remaining_project_balance' => (float) $order->balance_due,
            'admin_commission_percent' => (float) $order->admin_commission_percent,
            'expected_admin_cut' => $expectedTotalCut,
            'admin_commission_collected' => $paymentsSum,
            'remaining_admin_commission' => $remainingAdminCommission,
            'total_admin_cut' => $paymentsSum,
            'previously_allocated' => $previouslyAllocated,
            'eligible_admin_cut' => $eligibleAdminCut,
            'direct_income_amount' => $allocationBreakdown['direct_amount'],
            'level_income_amount' => $allocationBreakdown['level_amount'],
            'reward_income_amount' => $allocationBreakdown['reward_amount'],
            'total_allocation' => $allocationBreakdown['total_amount'],
            'distribution_status' => $status,
            'income_distributed_at' => $order->income_distributed_at instanceof \DateTimeInterface
                ? $order->income_distributed_at->toIso8601String()
                : ($order->income_distributed_at ? (string) $order->income_distributed_at : null),
            'cumulative_totals' => [
                'direct_income_amount' => (float) ($order->direct_income_amount ?? 0),
                'level_income_amount' => (float) ($order->level_income_amount ?? 0),
                'reward_income_amount' => (float) ($order->reward_income_amount ?? 0),
                'distributed_admin_cut_amount' => $previouslyAllocated,
            ],
            'can_allocate' => ($eligibleAdminCut > 0),
            'payments' => $payments->map(fn($p) => $this->getPaymentAllocationDetails($p)),
        ];
    }

    /**
     * Compute decimal-safe 40/40/20 split using integer paise arithmetic.
     * Guarantees that direct_amount + level_amount + reward_amount === eligible_admin_cut down to the paisa.
     * The reward allocation absorbs any odd-paisa remainder deterministically.
     *
     * @param float $eligibleAdminCut
     * @return array
     */
    public function calculateSplit(float $eligibleAdminCut): array
    {
        if ($eligibleAdminCut <= 0) {
            return [
                'direct_amount' => 0.0,
                'level_amount' => 0.0,
                'reward_amount' => 0.0,
                'total_amount' => 0.0,
            ];
        }

        $totalPaise = (int) round($eligibleAdminCut * 100);
        $directPaise = (int) round($totalPaise * 0.40);
        $levelPaise = (int) round($totalPaise * 0.40);
        $rewardPaise = $totalPaise - $directPaise - $levelPaise;

        return [
            'direct_amount' => round($directPaise / 100, 2),
            'level_amount' => round($levelPaise / 100, 2),
            'reward_amount' => round($rewardPaise / 100, 2),
            'total_amount' => round(($directPaise + $levelPaise + $rewardPaise) / 100, 2),
        ];
    }
}
