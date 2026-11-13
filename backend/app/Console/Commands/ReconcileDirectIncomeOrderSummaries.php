<?php

namespace App\Console\Commands;

use App\Models\CommissionSetting;
use App\Models\DirectIncome;
use App\Models\DirectIncomeOrderSummary;
use App\Models\Order;
use App\Models\OrderPaymentDump;
use App\Models\SalePayment;
use App\Models\User;
use App\Services\AdminIncomeAllocationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReconcileDirectIncomeOrderSummaries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'direct-income:reconcile-summaries
                            {--dry-run : Inspect and preview proposed backfill and summary changes without writing to database}
                            {--user= : Scope reconciliation to a specific beneficiary user_code or user ID}
                            {--order= : Scope reconciliation to a specific order ID or invoice number}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reconcile and backfill Order-wise Direct Income summaries from authoritative transaction ledgers';

    /**
     * Execute the console command.
     */
    public function handle(AdminIncomeAllocationService $allocationService): int
    {
        $isDryRun = (bool) $this->option('dry-run');
        $userFilter = $this->option('user');
        $orderFilter = $this->option('order');

        $modeLabel = $isDryRun ? 'DRY-RUN PREVIEW (No DB writes)' : 'LIVE EXECUTION (Database update)';
        $this->info("================================================================================");
        $this->info("  VYAPAR ADNET – DIRECT INCOME ORDER SUMMARY RECONCILIATION & BACKFILL");
        $this->info("  Mode: {$modeLabel}");
        $this->info("================================================================================");

        // 1. Load active commission settings snapshot
        $configSnapshot = CommissionSetting::getValidatedGlobalSnapshot();
        $directPercent = (float) $configSnapshot['direct_percent'];
        $this->line("Active Global Direct Income Rate: <comment>{$directPercent}%</comment>");

        // 2. Query eligible confirmed orders
        $orderQuery = Order::with(['payments', 'approvedDumps', 'directIncomeSummary'])
            ->where('approval_status', 'confirmed')
            ->orderBy('id', 'asc');

        if (!empty($orderFilter)) {
            $orderQuery->where(function ($q) use ($orderFilter) {
                $q->where('id', $orderFilter)
                  ->orWhere('invoice_number', $orderFilter);
            });
        }

        if (!empty($userFilter)) {
            $orderQuery->where(function ($q) use ($userFilter) {
                $q->where('sponsor', $userFilter)
                  ->orWhereHas('payments', function ($pq) use ($userFilter) {
                      $pq->where('sponsor', $userFilter);
                  });
            });
        }

        $orders = $orderQuery->get();
        if ($orders->isEmpty()) {
            $this->warn("No confirmed orders found matching the specified criteria.");
            return Command::SUCCESS;
        }

        $this->info("Found {$orders->count()} confirmed order(s) for audit.");

        $mappingPlan = [];
        $ledgerBackfillPlan = [];
        $discrepancies = [];

        $totalOrderGross = 0.0;
        $totalExpectedAll = 0.0;
        $totalDistributedAll = 0.0;
        $totalPendingAll = 0.0;
        $totalDumpAll = 0.0;

        foreach ($orders as $order) {
            $customer = $order->customer_user_code ? User::where('user_code', $order->customer_user_code)->first() : null;
            $sponsorCode = $customer ? $customer->sponsor_id : $order->sponsor;

            if (empty($sponsorCode) || strtolower(trim((string) $sponsorCode)) === 'root' || trim((string) $sponsorCode) === trim((string) $order->customer_user_code)) {
                $this->line("  Order #{$order->id} ({$order->invoice_number}): Skipped (Root / Self sponsor).");
                continue;
            }

            $sponsorUser = User::where('user_code', $sponsorCode)->orWhere('id', $sponsorCode)->first();
            if (!$sponsorUser) {
                $discrepancies[] = "Order #{$order->id}: Sponsor '{$sponsorCode}' not found in users table.";
                continue;
            }

            // Completed payment receipts for this order
            $completedPayments = $order->payments
                ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
                ->where('direct_income_amount', '>', 0);

            $orderGross = (float) $order->gross_amount;
            $orderCommissionRate = (float) ($order->admin_commission_percent ?: 15.0);
            $orderAdminCut = (float) ($order->admin_commission_cut > 0
                ? $order->admin_commission_cut
                : round(($orderGross * $orderCommissionRate) / 100, 2));

            $expectedDirect = round(($orderAdminCut * $directPercent) / 100, 2);
            $distributedDirect = round((float) $completedPayments->sum('direct_income_amount'), 2);

            // Approved Dump write-offs
            $approvedDumps = $order->approvedDumps;
            $dumpDirect = round((float) $approvedDumps->sum('direct_income_amount'), 2);
            if ($dumpDirect <= 0 && $approvedDumps->isNotEmpty()) {
                $dumpCut = (float) $approvedDumps->sum('admin_commission_cut');
                $dumpDirect = round(($dumpCut * $directPercent) / 100, 2);
            }

            $pendingDirect = max(0.0, round($expectedDirect - $distributedDirect - $dumpDirect, 2));
            $distributionCount = $completedPayments->count();

            $status = $distributedDirect <= 0 ? 'pending' : ($pendingDirect <= 0.00 ? 'completed' : 'partial');

            $totalOrderGross += $orderGross;
            $totalExpectedAll += $expectedDirect;
            $totalDistributedAll += $distributedDirect;
            $totalPendingAll += $pendingDirect;
            $totalDumpAll += $dumpDirect;

            // Trace and link each completed payment to direct_incomes
            $paymentMatches = [];
            foreach ($completedPayments as $payment) {
                $pAmount = (float) $payment->direct_income_amount;
                $pDistributedAt = $payment->income_distributed_at ? Carbon::parse($payment->income_distributed_at) : null;

                // 1. Direct link already present?
                $existingDirect = DirectIncome::where('sale_payment_id', $payment->id)->first();

                if (!$existingDirect) {
                    // 2. Exact match candidate by user_code and total_amount
                    $candidates = DirectIncome::where('user_code', $sponsorUser->user_code)
                        ->where('total_amount', $pAmount)
                        ->whereNull('sale_payment_id')
                        ->get();

                    if ($candidates->count() === 1) {
                        $matchedDirect = $candidates->first();
                        $existingDirect = $matchedDirect;
                        $ledgerBackfillPlan[] = [
                            'direct_id' => $matchedDirect->id,
                            'order_id' => $order->id,
                            'sale_payment_id' => $payment->id,
                            'source_user_code' => $order->customer_user_code,
                            'percentage' => $directPercent,
                            'amount' => $pAmount,
                        ];
                    } elseif ($candidates->count() > 1 && $pDistributedAt) {
                        // Disambiguate by timestamp match within 60 seconds
                        $timeMatched = $candidates->first(function ($c) use ($pDistributedAt) {
                            $cCreated = Carbon::parse($c->created_at);
                            return abs($cCreated->diffInSeconds($pDistributedAt)) <= 60;
                        });

                        if ($timeMatched) {
                            $existingDirect = $timeMatched;
                            $ledgerBackfillPlan[] = [
                                'direct_id' => $timeMatched->id,
                                'order_id' => $order->id,
                                'sale_payment_id' => $payment->id,
                                'source_user_code' => $order->customer_user_code,
                                'percentage' => $directPercent,
                                'amount' => $pAmount,
                            ];
                        } else {
                            $discrepancies[] = "Payment #{$payment->id} (₹{$pAmount}): Multiple unlinked direct_incomes candidates without exact timestamp match.";
                        }
                    } else {
                        $discrepancies[] = "Payment #{$payment->id} (₹{$pAmount}): No matching unlinked direct_incomes record found.";
                    }
                }

                $paymentMatches[] = [
                    'payment_id' => $payment->id,
                    'amount' => $pAmount,
                    'matched_direct_id' => $existingDirect?->id ?? 'MISSING',
                ];
            }

            $mappingPlan[] = [
                'order_id' => $order->id,
                'invoice' => $order->invoice_number,
                'sponsor' => $sponsorUser->user_code,
                'customer' => $order->customer_user_code,
                'gross' => $orderGross,
                'expected' => $expectedDirect,
                'distributed' => $distributedDirect,
                'pending' => $pendingDirect,
                'dump' => $dumpDirect,
                'count' => $distributionCount,
                'status' => $status,
                'has_summary' => (bool) $order->directIncomeSummary,
                'order_model' => $order,
            ];
        }

        // 3. Render Mapping Plan Table
        $this->newLine();
        $this->info("Proposed Order-Wise Summary Mapping:");
        $tableRows = [];
        foreach ($mappingPlan as $m) {
            $tableRows[] = [
                $m['order_id'],
                $m['invoice'],
                $m['sponsor'],
                $m['customer'],
                '₹' . number_format($m['gross'], 2),
                '₹' . number_format($m['expected'], 2),
                '₹' . number_format($m['distributed'], 2),
                '₹' . number_format($m['pending'], 2),
                '₹' . number_format($m['dump'], 2),
                $m['count'],
                $m['status'],
                $m['has_summary'] ? '<info>Exists (Sync)</info>' : '<comment>New (Insert)</comment>',
            ];
        }

        $this->table(
            ['Order ID', 'Invoice', 'Sponsor', 'Customer', 'Gross', 'Expected', 'Distributed', 'Pending', 'Dump', 'Installments', 'Status', 'Summary Action'],
            $tableRows
        );

        // 4. Render Direct Incomes Ledger Backfill Table
        $this->newLine();
        $this->info("Proposed Direct Incomes Ledger Linking (direct_incomes $\rightarrow$ sale_payments):");
        if (empty($ledgerBackfillPlan)) {
            $this->line("  No unlinked direct_incomes rows pending reference update.");
        } else {
            $ledgerTableRows = [];
            foreach ($ledgerBackfillPlan as $lb) {
                $ledgerTableRows[] = [
                    $lb['direct_id'],
                    $lb['order_id'],
                    $lb['sale_payment_id'],
                    $lb['source_user_code'],
                    $lb['percentage'] . '%',
                    '₹' . number_format($lb['amount'], 2),
                ];
            }
            $this->table(
                ['Direct Income ID', 'Order ID', 'Sale Payment ID', 'Source Customer', 'Rate %', 'Amount'],
                $ledgerTableRows
            );
        }

        // 5. Reconciliation Totals & Consistency Check
        $this->newLine();
        $this->info("Reconciliation Financial Balance Totals:");
        $ledgerSum = (float) DirectIncome::sum('total_amount');
        $paymentsSum = (float) SalePayment::whereIn('income_distribution_status', ['completed', 'legacy_completed'])->sum('direct_income_amount');
        $existingSummarySum = (float) DirectIncomeOrderSummary::sum('total_distributed_amount');

        $this->table(
            ['Metric', 'Amount', 'Reconciliation Assessment'],
            [
                ['Total Confirmed Orders Analyzed', count($mappingPlan), 'Audited Confirmed Orders'],
                ['Total Cumulative Project Gross', '₹' . number_format($totalOrderGross, 2), 'Total Contract Value'],
                ['Total Expected Direct Income', '₹' . number_format($totalExpectedAll, 2), 'Max Eligible (40% Admin Cut)'],
                ['Total Distributed (Sale Payments)', '₹' . number_format($paymentsSum, 2), 'Sum of completed payments'],
                ['Total Distributed (direct_incomes ledger)', '₹' . number_format($ledgerSum, 2), 'Authoritative wallet ledger credits'],
                ['Total Distributed (Calculated Summary)', '₹' . number_format($totalDistributedAll, 2), 'Matches payment & ledger totals'],
                ['Total Pending Direct Income', '₹' . number_format($totalPendingAll, 2), 'Collectible remaining'],
                ['Total Approved Dump Direct Income', '₹' . number_format($totalDumpAll, 2), 'Written-off non-cash portion'],
                ['Ledger vs Payment Difference', '₹' . number_format(abs($ledgerSum - $paymentsSum), 2), $ledgerSum == $paymentsSum ? '<info>0.00 (PERFECT BALANCE)</info>' : '<error>DISCREPANCY</error>'],
            ]
        );

        if (!empty($discrepancies)) {
            $this->newLine();
            $this->error("Noted Discrepancies / Warnings during reconciliation:");
            foreach ($discrepancies as $d) {
                $this->line("  • <fg=yellow>{$d}</>");
            }
        }

        // 6. Action Execution
        if ($isDryRun) {
            $this->newLine();
            $this->warn("[DRY-RUN COMPLETE] Zero database writes performed. Rerun without --dry-run to commit changes.");
            return Command::SUCCESS;
        }

        // Live execution inside DB transaction
        $this->newLine();
        $this->info("Executing Live Reconciliation and Backfill inside Database Transaction...");

        DB::beginTransaction();
        try {
            // A. Backfill Direct Incomes reference fields
            $updatedLedgerCount = 0;
            foreach ($ledgerBackfillPlan as $lb) {
                DirectIncome::where('id', $lb['direct_id'])->update([
                    'order_id' => $lb['order_id'],
                    'sale_payment_id' => $lb['sale_payment_id'],
                    'source_user_code' => $lb['source_user_code'],
                    'percentage' => $lb['percentage'],
                ]);
                $updatedLedgerCount++;
            }

            // B. Sync Direct Income Order Summaries
            $syncedSummaryCount = 0;
            foreach ($mappingPlan as $m) {
                $allocationService->syncOrderDirectIncomeSummary($m['order_model'], null, $configSnapshot);
                $syncedSummaryCount++;
            }

            DB::commit();

            $this->info("✓ SUCCESS: Database updated atomically.");
            $this->info("  • Updated {$updatedLedgerCount} direct_incomes ledger record(s) with Order and Payment references.");
            $this->info("  • Synchronized {$syncedSummaryCount} direct_income_order_summaries record(s).");

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error("Failed to commit reconciliation: " . $e->getMessage());
            $this->line($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
