<?php

namespace App\Services;

require_once app_path('Helpers/admin_function.php');

use App\Models\CommissionSetting;
use App\Models\DirectIncome;
use App\Models\DirectIncomeOrderSummary;
use App\Models\Order;
use App\Models\OrderPaymentDump;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AdminIncomeAllocationService
{
    /**
     * Legacy fallback constants retained only for informational completed-payment metadata;
     * live calculations always load validated percentages from CommissionSetting.
     */
    public const DIRECT_PERCENT = 40.0;
    public const LEVEL_PERCENT = 40.0;
    public const REWARD_PERCENT = 20.0;

    protected DiamondRewardService $diamondRewardService;

    public function __construct(?DiamondRewardService $diamondRewardService = null)
    {
        $this->diamondRewardService = $diamondRewardService ?? new DiamondRewardService();
    }

    /**
     * Calculate and return income allocation details for a specific payment receipt without persisting.
     *
     * @param SalePayment $payment
     * @return array
     */
    public function getPaymentAllocationDetails(SalePayment $payment): array
    {
        $order = $payment->order ?: Order::find($payment->sales_record_id);

        if (!$order || $order->approval_status !== 'confirmed') {
            $currentApproval = $order ? $order->approval_status : 'missing';
            throw new InvalidArgumentException(
                "Payment #{$payment->id} cannot be inspected for allocation because its parent Order " . ($order ? "#{$order->invoice_number} " : '') . "is not confirmed (Current Approval Status: '{$currentApproval}')."
            );
        }

        // 1. Authoritative Admin Cut snapshot for THIS specific payment receipt
        $paymentAdminCut = (float) ($payment->admin_commission_cut ?? 0);

        // 2. Previously allocated amount for THIS specific payment
        $previouslyAllocated = (float) ($payment->distributed_admin_cut_amount ?? 0);

        // 3. Eligible Admin Cut for THIS payment
        $status = $payment->income_distribution_status ?? 'pending';
        $isCompleted = in_array($status, ['completed', 'legacy_completed']);
        $eligibleAdminCut = $isCompleted
            ? 0.0
            : max(0.0, round($paymentAdminCut - $previouslyAllocated, 2));

        // 4. For pending payments, strictly load validated Global Commission Settings snapshot;
        //    for historical completed payments, preserve stored immutable amounts.
        $configSnapshot = null;
        $allocationBreakdown = [
            'direct_amount' => (float) ($payment->direct_income_amount ?? 0),
            'level_amount' => (float) ($payment->level_income_amount ?? 0),
            'reward_amount' => (float) ($payment->reward_income_amount ?? 0),
            'total_amount' => (float) ($payment->distributed_admin_cut_amount ?? 0),
        ];

        if (!$isCompleted) {
            $configSnapshot = CommissionSetting::getValidatedGlobalSnapshot();
            $allocationBreakdown = $this->calculateSplit($eligibleAdminCut, $configSnapshot);
        } else {
            try {
                $configSnapshot = CommissionSetting::getValidatedGlobalSnapshot();
            } catch (InvalidArgumentException $e) {
                $configSnapshot = null;
            }
        }

        // 5. Order cumulative totals
        $orderGross = (float) ($order?->gross_amount ?? 0);
        $orderDump = (float) ($order?->approved_dump_amount ?? $order?->dump_amount ?? 0);
        $orderDumpCut = (float) ($order?->approved_dump_admin_cut ?? ($order ? round(($orderDump * ($order->admin_commission_percent ?: 15)) / 100, 2) : 0));
        $orderExpectedCut = (float) ($order?->admin_commission_cut ?? 0);
        $orderPayments = $order ? $order->payments()->get() : collect();
        $orderCollectedCut = (float) $orderPayments->sum('admin_commission_cut');
        $orderRemainingCut = max(0.0, round($orderExpectedCut - $orderCollectedCut - $orderDumpCut, 2));
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
            'reward_level_1_amount' => !$isCompleted ? ($allocationBreakdown['reward_level_1_amount'] ?? 0.0) : null,
            'reward_level_2_amount' => !$isCompleted ? ($allocationBreakdown['reward_level_2_amount'] ?? 0.0) : null,
            'reward_level_1_diamonds' => !$isCompleted ? ($allocationBreakdown['reward_level_1_diamonds'] ?? 0.0) : null,
            'reward_level_2_diamonds' => !$isCompleted ? ($allocationBreakdown['reward_level_2_diamonds'] ?? 0.0) : null,
            'total_allocation' => in_array($status, ['completed', 'legacy_completed'])
                ? (float) ($payment->distributed_admin_cut_amount ?? $allocationBreakdown['total_amount'])
                : $allocationBreakdown['total_amount'],
            'income_distribution_status' => $status,
            'income_distributed_at' => $payment->income_distributed_at instanceof \DateTimeInterface
                ? $payment->income_distributed_at->toIso8601String()
                : ($payment->income_distributed_at ? (string) $payment->income_distributed_at : null),
            'income_distributed_by' => $payment->income_distributed_by,
            'can_allocate' => ($status === 'pending' && $eligibleAdminCut > 0),
            'rates' => $configSnapshot ? [
                'direct_percent' => $configSnapshot['direct_percent'],
                'level_total_percent' => $configSnapshot['level_total_percent'],
                'reward_level_1_percent' => $configSnapshot['reward_level_1_percent'],
                'reward_level_2_percent' => $configSnapshot['reward_level_2_percent'],
                'reward_total_percent' => $configSnapshot['reward_total_percent'],
                'reward_percent' => $configSnapshot['reward_percent'],
                'diamond_conversion_rate' => $configSnapshot['diamond_conversion_rate'],
                'levels' => $configSnapshot['levels'],
            ] : null,
            'order' => $order ? [
                'id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'entity_name' => $order->entity_name,
                'customer_name' => $order->customer_name,
                'customer_user_code' => $order->customer_user_code,
                'gross_amount' => $orderGross,
                'dump_amount' => $orderDump,
                'dump_admin_cut' => $orderDumpCut,
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
                'payment_settlement_status' => $order->payment_settlement_status,
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

            // Approval guard: parent order MUST be confirmed
            if ($order->approval_status !== 'confirmed') {
                throw new InvalidArgumentException(
                    "Payment #{$payment->id} cannot be allocated because its parent Order #{$order->invoice_number} is not confirmed (Current Approval Status: '{$order->approval_status}')."
                );
            }

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

            // 4. Load ONE consistent Global Commission Settings snapshot for the entire transaction
            $configSnapshot = CommissionSetting::getValidatedGlobalSnapshot(true);

            // 5. Calculate decimal-safe split using integer paise arithmetic
            $split = $this->calculateSplit($paymentAdminCut, $configSnapshot);

            // 6. Update the payment receipt row with its allocation amounts and completed status
            $payment->update([
                'direct_income_amount' => $split['direct_amount'],
                'level_income_amount' => $split['level_amount'],
                'reward_income_amount' => $split['reward_amount'],
                'distributed_admin_cut_amount' => $paymentAdminCut,
                'income_distribution_status' => 'completed',
                'income_distributed_at' => now(),
                'income_distributed_by' => $adminId,
            ]);

            // 7. Atomically accumulate on parent order cumulative totals
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

            // 8. Recompute parent order's aggregate distribution status
            $this->syncOrderIncomeDistributionStatus($order);

            // 9. Distribute Direct Income using helper (Direct Income only to customer's upline sponsor)
            $directRecord = null;
            if ($split['direct_amount'] > 0) {
                $customer = $order->customer_user_code ? User::where('user_code', $order->customer_user_code)->first() : null;
                $sponsorCode = $customer ? $customer->sponsor_id : $order->sponsor;

                if (!empty($sponsorCode) && strtolower(trim((string) $sponsorCode)) !== 'root' && trim((string) $sponsorCode) !== trim((string) $order->customer_user_code)) {
                    $directRecord = \directIncome(
                        $sponsorCode,
                        $order->customer_user_code,
                        $split['direct_amount'],
                        0.00, // Bug 2 Fix: Never propagate order dump_amount to direct income
                        $order->id,
                        $payment->id,
                        $order->customer_user_code,
                        (float) $configSnapshot['direct_percent']
                    );
                }
            }

            // 10. Distribute Level Income using dynamic per-level amounts from the same snapshot
            if ($split['level_amount'] > 0 && !empty($order->customer_user_code)) {
                \levelIncome(
                    $order->customer_user_code,
                    $split['level_amount'],
                    0.00, // Bug 2 Fix: Never propagate order dump_amount to level income
                    $split['level_breakdown']
                );
            }

            // 11. Distribute Two-Level Diamond Rewards (Reward Level 1 -> Direct Sponsor, Level 2 -> Sponsor's Sponsor)
            $diamondRewards = $this->diamondRewardService->distributePaymentRewards(
                $order,
                $payment,
                $split['reward_level_1_amount'],
                $split['reward_level_2_amount']
            );

            // 12. Synchronize consolidated Order-wise Direct Income Summary atomically inside the transaction
            $orderSummary = $this->syncOrderDirectIncomeSummary($order, $directRecord, $configSnapshot);

            return [
                'payment' => $payment->fresh(),
                'order' => $order->fresh(['payments']),
                'direct_income_summary' => $orderSummary,
                'allocated' => [
                    'payment_id' => $payment->id,
                    'eligible_admin_cut' => $paymentAdminCut,
                    'direct_income_amount' => $split['direct_amount'],
                    'level_income_amount' => $split['level_amount'],
                    'level_breakdown' => $split['level_breakdown'],
                    'reward_income_amount' => $split['reward_amount'],
                    'reward_level_1_amount' => $split['reward_level_1_amount'],
                    'reward_level_2_amount' => $split['reward_level_2_amount'],
                    'reward_level_1_diamonds' => $split['reward_level_1_diamonds'],
                    'reward_level_2_diamonds' => $split['reward_level_2_diamonds'],
                    'diamond_rewards' => $diamondRewards,
                    'total_allocated' => $split['total_amount'],
                    'rates' => $split['rates'],
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
     * Synchronize and persist the consolidated Order-wise Direct Income Summary
     * for the eligible beneficiary sponsor of an Order.
     *
     * @param Order $order
     * @param DirectIncome|null $newDirectRecord
     * @param array|null $configSnapshot
     * @return DirectIncomeOrderSummary|null
     */
    public function syncOrderDirectIncomeSummary(Order $order, ?DirectIncome $newDirectRecord = null, ?array $configSnapshot = null): ?DirectIncomeOrderSummary
    {
        // 1. Identify Sponsor Beneficiary
        $customer = $order->customer_user_code ? User::where('user_code', $order->customer_user_code)->first() : null;
        $sponsorCode = $customer ? $customer->sponsor_id : $order->sponsor;

        if (empty($sponsorCode) || strtolower(trim((string) $sponsorCode)) === 'root' || trim((string) $sponsorCode) === trim((string) $order->customer_user_code)) {
            return null;
        }

        $sponsor = User::where('user_code', $sponsorCode)->orWhere('id', $sponsorCode)->first();
        if (!$sponsor) {
            return null;
        }

        // 2. Resolve Active Commission Snapshot
        $config = $configSnapshot ?? CommissionSetting::getValidatedGlobalSnapshot();
        $directPercent = (float) ($config['direct_percent'] ?? 40.0);

        // 3. Financial Metrics
        $orderGross = (float) ($order->gross_amount ?? 0);
        $orderCommissionRate = (float) ($order->admin_commission_percent ?: 15.0);
        $expectedOrderAdminCut = (float) ($order->admin_commission_cut > 0
            ? $order->admin_commission_cut
            : round(($orderGross * $orderCommissionRate) / 100, 2));

        $totalExpectedDirect = round(($expectedOrderAdminCut * $directPercent) / 100, 2);

        // Actual distributed Direct Income for this order (sum of completed installments)
        $totalDistributedDirect = (float) round(
            SalePayment::where('sales_record_id', $order->id)
                ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
                ->sum('direct_income_amount'),
            2
        );

        // Approved Dump Direct Income write-off portion
        $approvedDumps = OrderPaymentDump::where('order_id', $order->id)
            ->where('status', 'approved')
            ->get();

        $totalApprovedDumpDirect = (float) round($approvedDumps->sum('direct_income_amount'), 2);
        if ($totalApprovedDumpDirect <= 0 && $approvedDumps->isNotEmpty()) {
            $dumpCutSum = (float) $approvedDumps->sum('admin_commission_cut');
            $totalApprovedDumpDirect = round(($dumpCutSum * $directPercent) / 100, 2);
        }

        // Total Pending Direct Income: Expected - Distributed - Approved Dump
        $totalPendingDirect = max(0.0, round($totalExpectedDirect - $totalDistributedDirect - $totalApprovedDumpDirect, 2));

        // Distribution count (count of completed payments that distributed direct income)
        $distributionCount = SalePayment::where('sales_record_id', $order->id)
            ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
            ->where('direct_income_amount', '>', 0)
            ->count();

        // Distribution status
        if ($totalDistributedDirect <= 0) {
            $distributionStatus = 'pending';
        } elseif ($totalPendingDirect <= 0.00) {
            $distributionStatus = 'completed';
        } else {
            $distributionStatus = 'partial';
        }

        // Last distribution timestamp
        $lastDistributionAt = SalePayment::where('sales_record_id', $order->id)
            ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
            ->max('income_distributed_at');

        if (!$lastDistributionAt && $totalDistributedDirect > 0) {
            $lastDistributionAt = now();
        }

        $sourceCustomerName = $order->customer_name;
        if (empty($sourceCustomerName) && $customer) {
            $sourceCustomerName = $customer->name;
        }

        // 4. Atomic Upsert with row-level lock
        $summary = DirectIncomeOrderSummary::lockForUpdate()
            ->where('user_id', $sponsor->id)
            ->where('order_id', $order->id)
            ->first();

        $data = [
            'user_id' => $sponsor->id,
            'user_code' => $sponsor->user_code,
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'source_user_code' => $order->customer_user_code ?: ($customer?->user_code ?? ''),
            'source_user_name' => $sourceCustomerName,
            'item_name' => $order->item,
            'order_gross_amount' => $orderGross,
            'total_expected_amount' => $totalExpectedDirect,
            'total_distributed_amount' => $totalDistributedDirect,
            'total_pending_amount' => $totalPendingDirect,
            'total_dump_amount' => $totalApprovedDumpDirect,
            'distribution_count' => $distributionCount,
            'distribution_status' => $distributionStatus,
            'last_distribution_at' => $lastDistributionAt,
        ];

        if ($summary) {
            $summary->update($data);
        } else {
            $summary = DirectIncomeOrderSummary::create($data);
        }

        return $summary->fresh();
    }

    /**
     * Calculate and return income allocation details for an entire order (backward compatibility).
     *
     * @param Order $order
     * @return array
     */
    public function getOrderAllocationDetails(Order $order): array
    {
        if ($order->approval_status !== 'confirmed') {
            throw new InvalidArgumentException(
                "Order #{$order->invoice_number} cannot be inspected for allocation because it is not confirmed (Current Approval Status: '{$order->approval_status}')."
            );
        }

        $payments = $order->payments()->get();
        $paymentsSum = (float) round($payments->sum('admin_commission_cut'), 2);
        $expectedTotalCut = (float) ($order->admin_commission_cut > 0
            ? $order->admin_commission_cut
            : round(($order->gross_amount * ($order->admin_commission_percent ?: 15)) / 100, 2));
        $previouslyAllocated = (float) ($order->distributed_admin_cut_amount ?? 0);
        $eligibleAdminCut = max(0.0, round($paymentsSum - $previouslyAllocated, 2));
        $orderDump = (float) ($order->approved_dump_amount ?? $order->dump_amount ?? 0);
        $orderDumpCut = (float) ($order->approved_dump_admin_cut ?? round(($orderDump * ($order->admin_commission_percent ?: 15)) / 100, 2));
        $remainingAdminCommission = max(0.0, round($expectedTotalCut - $paymentsSum - $orderDumpCut, 2));

        $configSnapshot = CommissionSetting::getValidatedGlobalSnapshot();
        $allocationBreakdown = $this->calculateSplit($eligibleAdminCut, $configSnapshot);
        $status = $this->syncOrderIncomeDistributionStatus($order);

        return [
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer' => $order->customer,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'project_value' => (float) $order->gross_amount,
            'dump_amount' => $orderDump,
            'dump_admin_cut' => $orderDumpCut,
            'advance_payment' => (float) $order->advance_payment,
            'total_payment_received' => (float) $order->advance_payment,
            'balance_due' => (float) $order->balance_due,
            'remaining_project_balance' => (float) $order->remaining_project_balance,
            'admin_commission_percent' => (float) $order->admin_commission_percent,
            'expected_admin_cut' => $expectedTotalCut,
            'admin_commission_collected' => $paymentsSum,
            'remaining_admin_commission' => $remainingAdminCommission,
            'payment_settlement_status' => $order->payment_settlement_status,
            'total_admin_cut' => $paymentsSum,
            'previously_allocated' => $previouslyAllocated,
            'eligible_admin_cut' => $eligibleAdminCut,
            'direct_income_amount' => $allocationBreakdown['direct_amount'],
            'level_income_amount' => $allocationBreakdown['level_amount'],
            'level_breakdown' => $allocationBreakdown['level_breakdown'],
            'reward_income_amount' => $allocationBreakdown['reward_amount'],
            'reward_level_1_amount' => $allocationBreakdown['reward_level_1_amount'],
            'reward_level_2_amount' => $allocationBreakdown['reward_level_2_amount'],
            'reward_level_1_diamonds' => $allocationBreakdown['reward_level_1_diamonds'],
            'reward_level_2_diamonds' => $allocationBreakdown['reward_level_2_diamonds'],
            'total_allocation' => $allocationBreakdown['total_amount'],
            'rates' => [
                'direct_percent' => $configSnapshot['direct_percent'],
                'level_total_percent' => $configSnapshot['level_total_percent'],
                'reward_level_1_percent' => $configSnapshot['reward_level_1_percent'],
                'reward_level_2_percent' => $configSnapshot['reward_level_2_percent'],
                'reward_total_percent' => $configSnapshot['reward_total_percent'],
                'reward_percent' => $configSnapshot['reward_percent'],
                'diamond_conversion_rate' => $configSnapshot['diamond_conversion_rate'],
                'levels' => $configSnapshot['levels'],
            ],
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
     * Compute decimal-safe split using the active Global Commission Settings snapshot
     * and integer paise arithmetic. Guarantees exact reconciliation down to the paisa.
     *
     * @param float $eligibleAdminCut
     * @param array|null $configSnapshot
     * @return array
     */
    public function calculateSplit(float $eligibleAdminCut, ?array $configSnapshot = null): array
    {
        $config = $configSnapshot ?? CommissionSetting::getValidatedGlobalSnapshot();
        $zeroLevels = [];
        foreach ($config['levels'] as $lvl) {
            $zeroLevels[(int) $lvl['level']] = 0.0;
        }

        $ratesMeta = [
            'direct_percent' => $config['direct_percent'],
            'level_total_percent' => $config['level_total_percent'],
            'reward_level_1_percent' => $config['reward_level_1_percent'],
            'reward_level_2_percent' => $config['reward_level_2_percent'],
            'reward_total_percent' => $config['reward_total_percent'],
            'reward_percent' => $config['reward_percent'],
            'diamond_conversion_rate' => $config['diamond_conversion_rate'],
            'levels' => $config['levels'],
        ];

        if ($eligibleAdminCut <= 0) {
            return [
                'direct_amount' => 0.0,
                'level_amount' => 0.0,
                'level_breakdown' => $zeroLevels,
                'reward_level_1_amount' => 0.0,
                'reward_level_2_amount' => 0.0,
                'reward_level_1_diamonds' => 0.0,
                'reward_level_2_diamonds' => 0.0,
                'reward_amount' => 0.0,
                'total_amount' => 0.0,
                'rates' => $ratesMeta,
            ];
        }

        $totalPaise = (int) round($eligibleAdminCut * 100);
        $directPercent = (float) $config['direct_percent'];
        $rewardL1Percent = (float) ($config['reward_level_1_percent'] ?? 0.0);
        $rewardL2Percent = (float) ($config['reward_level_2_percent'] ?? 0.0);

        $directPaise = (int) round(($totalPaise * $directPercent) / 100);
        $levelPaiseMap = [];
        foreach ($config['levels'] as $lvl) {
            $lvlNum = (int) $lvl['level'];
            $lvlPct = (float) $lvl['percent'];
            $levelPaiseMap[$lvlNum] = (int) round(($totalPaise * $lvlPct) / 100);
        }

        $levelTotalPaise = array_sum($levelPaiseMap);
        $rewardL1Paise = (int) round(($totalPaise * $rewardL1Percent) / 100);
        $rewardL2Paise = (int) round(($totalPaise * $rewardL2Percent) / 100);

        $diff = $totalPaise - $directPaise - $levelTotalPaise - $rewardL1Paise - $rewardL2Paise;
        if ($diff !== 0) {
            // Absorb odd-paisa rounding residual deterministically onto a positive active percentage bucket
            if ($rewardL2Percent > 0 && ($rewardL2Percent >= $rewardL1Percent || $rewardL1Percent <= 0) && $rewardL2Paise + $diff >= 0) {
                $rewardL2Paise += $diff;
            } elseif ($rewardL1Percent > 0 && $rewardL1Paise + $diff >= 0) {
                $rewardL1Paise += $diff;
            } else {
                $bestLevel = null;
                $bestVal = -1;
                foreach ($levelPaiseMap as $lvlNum => $val) {
                    if ($val > $bestVal && $val + $diff >= 0) {
                        $bestVal = $val;
                        $bestLevel = $lvlNum;
                    }
                }
                if ($directPercent > 0 && ($directPaise >= $bestVal || $bestLevel === null) && $directPaise + $diff >= 0) {
                    $directPaise += $diff;
                } elseif ($bestLevel !== null) {
                    $levelPaiseMap[$bestLevel] += $diff;
                    $levelTotalPaise = array_sum($levelPaiseMap);
                }
            }
        }

        $rewardPaise = $rewardL1Paise + $rewardL2Paise;
        $rewardL1Amount = round($rewardL1Paise / 100, 2);
        $rewardL2Amount = round($rewardL2Paise / 100, 2);

        $levelBreakdown = [];
        foreach ($levelPaiseMap as $lvlNum => $paise) {
            $levelBreakdown[$lvlNum] = round($paise / 100, 2);
        }

        return [
            'direct_amount' => round($directPaise / 100, 2),
            'level_amount' => round($levelTotalPaise / 100, 2),
            'level_breakdown' => $levelBreakdown,
            'reward_level_1_amount' => $rewardL1Amount,
            'reward_level_2_amount' => $rewardL2Amount,
            'reward_level_1_diamonds' => (float) $this->diamondRewardService->convertInrToDiamonds($rewardL1Amount),
            'reward_level_2_diamonds' => (float) $this->diamondRewardService->convertInrToDiamonds($rewardL2Amount),
            'reward_amount' => round($rewardPaise / 100, 2),
            'total_amount' => round(($directPaise + $levelTotalPaise + $rewardPaise) / 100, 2),
            'rates' => $ratesMeta,
        ];
    }
}
