<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CommissionSetting;
use App\Models\DirectIncome;
use App\Models\DirectIncomeOrderSummary;
use App\Models\Order;
use App\Models\OrderPaymentDump;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\WalletTransfer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class AdminIncomeReportController extends Controller
{
    /**
     * Enforce strict Admin authentication.
     * Rejects unauthenticated requests with 401.
     * Rejects authenticated non-Admin accounts (normal Users, Entities) with 403.
     *
     * @param Request $request
     * @return Admin|JsonResponse
     */
    protected function verifyAdminAccess(Request $request): Admin|JsonResponse
    {
        $user = $request->user();

        if (!$user && $request->bearerToken()) {
            if (class_exists(PersonalAccessToken::class)) {
                $token = PersonalAccessToken::findToken($request->bearerToken());
                if ($token && $token->tokenable) {
                    $user = $token->tokenable;
                }
            }
        }

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated. Please log in with admin credentials.',
            ], 401);
        }

        if (!($user instanceof Admin) && (!is_object($user) || get_class($user) !== 'App\Models\Admin')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden. Admin credentials required to access global Direct Income reporting.',
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden. Admin account is inactive.',
            ], 403);
        }

        return $user;
    }

    /**
     * API 1 – Global Direct Income Overview
     *
     * GET /api/admin/income/direct-overview
     * Returns consolidated financial statistics and four-way reconciliation health.
     */
    public function getDirectIncomeOverview(Request $request): JsonResponse
    {
        $admin = $this->verifyAdminAccess($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        // Single-pass SQL aggregation across direct_income_order_summaries table
        $summaryStats = DB::table('direct_income_order_summaries')
            ->selectRaw("
                COUNT(*) as total_orders,
                COALESCE(SUM(total_expected_amount), 0) as total_expected,
                COALESCE(SUM(total_distributed_amount), 0) as total_distributed,
                COALESCE(SUM(total_pending_amount), 0) as total_pending,
                COALESCE(SUM(total_dump_amount), 0) as total_dump,
                COALESCE(SUM(distribution_count), 0) as total_distributions,
                COUNT(DISTINCT user_id) as total_beneficiaries,
                COUNT(CASE WHEN distribution_status = 'partial' THEN 1 END) as partial_orders,
                COUNT(CASE WHEN distribution_status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN distribution_status = 'completed' THEN 1 END) as completed_orders
            ")
            ->first();

        $totalOrders = (int) ($summaryStats->total_orders ?? 0);
        $totalExpected = (float) round((float) ($summaryStats->total_expected ?? 0), 2);
        $totalDistributed = (float) round((float) ($summaryStats->total_distributed ?? 0), 2);
        $totalPending = (float) round((float) ($summaryStats->total_pending ?? 0), 2);
        $totalDump = (float) round((float) ($summaryStats->total_dump ?? 0), 2);
        $totalDistributionsCount = (int) ($summaryStats->total_distributions ?? 0);
        $totalBeneficiariesCount = (int) ($summaryStats->total_beneficiaries ?? 0);
        $partialOrders = (int) ($summaryStats->partial_orders ?? 0);
        $pendingOrders = (int) ($summaryStats->pending_orders ?? 0);
        $completedOrders = (int) ($summaryStats->completed_orders ?? 0);

        $completionPercentage = $totalExpected > 0
            ? round(($totalDistributed / $totalExpected) * 100, 2)
            : 0.0;

        // Authoritative cross-ledger totals for four-way financial reconciliation
        $salePaymentsDistributedTotal = (float) round(
            DB::table('sale_payments')
                ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
                ->sum('direct_income_amount'),
            2
        );

        $directIncomesLedgerTotal = (float) round(
            DB::table('direct_incomes')->sum('total_amount'),
            2
        );

        $walletTransfersCreditTotal = (float) round(
            DB::table('wallet_transfers')
                ->where('walletType', 'Direct Income')
                ->sum('credit'),
            2
        );

        // Reconciliation difference between summary, completed payment receipts, and direct ledger
        $reconciliationDiff = round(
            abs($totalDistributed - $salePaymentsDistributedTotal) +
            abs($totalDistributed - $directIncomesLedgerTotal),
            2
        );

        $isReconciled = ($reconciliationDiff === 0.0);
        $isWalletMatched = ($walletTransfersCreditTotal === $totalDistributed);

        if ($isReconciled && $isWalletMatched) {
            $reconciliationStatus = 'Reconciled';
            $reconciliationMessage = 'All platform Direct Income records match across summary, payments, direct ledger, and wallet transfers with 0.00 variance.';
        } elseif ($isReconciled && !$isWalletMatched) {
            $reconciliationStatus = 'Incomplete Wallet Trace';
            $reconciliationMessage = "Summary, payment receipts, and direct income ledger match perfectly (₹{$totalDistributed}); wallet credit total reflects ₹{$walletTransfersCreditTotal}.";
        } else {
            $reconciliationStatus = 'Mismatch';
            $reconciliationMessage = "Discrepancy detected between summary (₹{$totalDistributed}), payments (₹{$salePaymentsDistributedTotal}), or direct ledger (₹{$directIncomesLedgerTotal}).";
        }

        $metrics = [
            'total_eligible_orders' => $totalOrders,
            'totalEligibleOrders' => $totalOrders,
            'total_expected_direct_income' => $totalExpected,
            'totalExpectedDirectIncome' => $totalExpected,
            'total_distributed_direct_income' => $totalDistributed,
            'totalDistributedDirectIncome' => $totalDistributed,
            'total_pending_direct_income' => $totalPending,
            'totalPendingDirectIncome' => $totalPending,
            'total_dump_direct_income' => $totalDump,
            'totalDumpDirectIncome' => $totalDump,
            'total_distributions_count' => $totalDistributionsCount,
            'totalDistributionsCount' => $totalDistributionsCount,
            'total_beneficiaries_count' => $totalBeneficiariesCount,
            'totalBeneficiariesCount' => $totalBeneficiariesCount,
            'completion_percentage' => $completionPercentage,
            'completionPercentage' => $completionPercentage,
            'orders_by_status' => [
                'pending' => $pendingOrders,
                'partial' => $partialOrders,
                'completed' => $completedOrders,
            ],
            'reconciliation' => [
                'is_reconciled' => $isReconciled,
                'summary_distributed_total' => $totalDistributed,
                'sale_payments_distributed_total' => $salePaymentsDistributedTotal,
                'direct_incomes_ledger_total' => $directIncomesLedgerTotal,
                'wallet_transfers_credit_total' => $walletTransfersCreditTotal,
                'reconciliation_difference' => $reconciliationDiff,
                'status' => $reconciliationStatus,
                'message' => $reconciliationMessage,
            ],
        ];

        return response()->json([
            'status' => 'success',
            'metrics' => $metrics,
            'summary' => $metrics,
        ], 200);
    }

    /**
     * API 2 – Global Order-wise Direct Income List
     *
     * GET /api/admin/income/direct-orders
     * Supports search, filters, sorting, and server-side pagination.
     */
    public function getOrderDirectIncomeList(Request $request): JsonResponse
    {
        $admin = $this->verifyAdminAccess($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $query = DirectIncomeOrderSummary::query();

        // 1. Filter: Distribution Status (all, pending, partial, completed)
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $status = strtolower(trim((string) $request->input('status')));
            $query->where('distribution_status', $status);
        }

        // 2. Filter: Entity (entity_id or entity_name)
        if ($request->filled('entity_id')) {
            $entityId = $request->input('entity_id');
            $query->whereHas('order', function ($q) use ($entityId) {
                $q->where('entity_id', $entityId);
            });
        }
        if ($request->filled('entity_name')) {
            $entityName = trim((string) $request->input('entity_name'));
            $query->whereHas('order', function ($q) use ($entityName) {
                $q->where('entity_name', 'like', "%{$entityName}%");
            });
        }

        // 3. Filter: Sponsor (user_code or user_id)
        if ($request->filled('sponsor_id') || $request->filled('sponsor')) {
            $sponsorInput = trim((string) ($request->input('sponsor_id') ?? $request->input('sponsor')));
            $query->where(function ($q) use ($sponsorInput) {
                $q->where('user_code', $sponsorInput)
                  ->orWhere('user_id', $sponsorInput);
            });
        }

        // 4. Filter: Buyer (source_user_code)
        if ($request->filled('buyer_id') || $request->filled('buyer')) {
            $buyerInput = trim((string) ($request->input('buyer_id') ?? $request->input('buyer')));
            $query->where('source_user_code', $buyerInput);
        }

        // 5. Filter: Order Status (status on orders table)
        if ($request->filled('order_status')) {
            $orderStatus = trim((string) $request->input('order_status'));
            $query->whereHas('order', function ($q) use ($orderStatus) {
                $q->where('status', $orderStatus);
            });
        }

        // 6. Filter: Approved Dump Presence (has_dump = 1 or yes/true)
        if ($request->filled('has_dump')) {
            $hasDump = $request->input('has_dump');
            if (in_array($hasDump, [1, '1', 'true', 'yes'], true)) {
                $query->where('total_dump_amount', '>', 0);
            } elseif (in_array($hasDump, [0, '0', 'false', 'no'], true)) {
                $query->where('total_dump_amount', '<=', 0);
            }
        }

        // 7. Filter: Order Date Range
        if ($request->filled('start_date')) {
            $startDate = trim((string) $request->input('start_date'));
            $query->whereHas('order', function ($q) use ($startDate) {
                $q->where('date', '>=', $startDate)
                  ->orWhere('created_at', '>=', $startDate . ' 00:00:00');
            });
        }
        if ($request->filled('end_date')) {
            $endDate = trim((string) $request->input('end_date'));
            $query->whereHas('order', function ($q) use ($endDate) {
                $q->where('date', '<=', $endDate)
                  ->orWhere('created_at', '<=', $endDate . ' 23:59:59');
            });
        }

        // 8. Filter: Distribution Date Range
        if ($request->filled('distribution_start_date')) {
            $distStart = trim((string) $request->input('distribution_start_date'));
            $query->where('last_distribution_at', '>=', $distStart . ' 00:00:00');
        }
        if ($request->filled('distribution_end_date')) {
            $distEnd = trim((string) $request->input('distribution_end_date'));
            $query->where('last_distribution_at', '<=', $distEnd . ' 23:59:59');
        }

        // 9. Search: Multi-field across Order ID, Invoice Number, Buyer, Sponsor, Entity, and Offering
        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%")
                  ->orWhere('source_user_code', 'like', "%{$search}%")
                  ->orWhere('source_user_name', 'like', "%{$search}%")
                  ->orWhere('user_code', 'like', "%{$search}%")
                  ->orWhere('item_name', 'like', "%{$search}%")
                  ->orWhereHas('order', function ($oq) use ($search) {
                      $oq->where('entity_name', 'like', "%{$search}%")
                         ->orWhere('item', 'like', "%{$search}%")
                         ->orWhere('category', 'like', "%{$search}%");
                  })
                  ->orWhereHas('beneficiary', function ($bq) use ($search) {
                      $bq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // 10. Sorting
        $sortBy = strtolower(trim((string) ($request->input('sort_by') ?? 'last_distribution_at')));
        $sortOrder = strtolower(trim((string) ($request->input('sort_order') ?? 'desc'))) === 'asc' ? 'asc' : 'desc';

        match ($sortBy) {
            'latest_order', 'order_date', 'created_at' => $query->orderBy('created_at', $sortOrder)->orderBy('id', $sortOrder),
            'order_id' => $query->orderBy('order_id', $sortOrder),
            'highest_gross', 'order_gross_amount' => $query->orderBy('order_gross_amount', $sortOrder)->orderBy('id', 'desc'),
            'highest_expected', 'total_expected_amount' => $query->orderBy('total_expected_amount', $sortOrder)->orderBy('id', 'desc'),
            'highest_distributed', 'total_distributed_amount' => $query->orderBy('total_distributed_amount', $sortOrder)->orderBy('id', 'desc'),
            'highest_pending', 'total_pending_amount' => $query->orderBy('total_pending_amount', $sortOrder)->orderBy('id', 'desc'),
            default => $query->orderBy('last_distribution_at', $sortOrder)->orderBy('id', 'desc'),
        };

        // 11. Pagination: default 15, bounds [10..100]
        $perPage = max(10, min(100, (int) ($request->input('per_page') ?? 15)));

        // Eager load relationships to prevent N+1 queries
        $paginated = $query->with([
            'order:id,invoice_number,date,entity_id,entity_name,entity_type,category,item,item_type,status,approval_status,admin_commission_percent,admin_commission_cut',
            'beneficiary:id,user_code,name,status',
            'sourceUser:id,user_code,name',
        ])->paginate($perPage);

        // 12. Batch reconciliation calculation for current page items
        $orderIds = collect($paginated->items())->pluck('order_id')->filter()->unique()->all();

        $paymentsSums = SalePayment::whereIn('sales_record_id', $orderIds)
            ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
            ->groupBy('sales_record_id')
            ->selectRaw('sales_record_id, sum(direct_income_amount) as total')
            ->pluck('total', 'sales_record_id');

        $ledgerSums = DirectIncome::whereIn('order_id', $orderIds)
            ->groupBy('order_id')
            ->selectRaw('order_id, sum(total_amount) as total')
            ->pluck('total', 'order_id');

        $mappedData = collect($paginated->items())->map(function ($s) use ($paymentsSums, $ledgerSums) {
            $order = $s->order;
            $beneficiary = $s->beneficiary;

            $paymentsDistributed = (float) round((float) ($paymentsSums[$s->order_id] ?? 0.0), 2);
            $ledgerDistributed = (float) round((float) ($ledgerSums[$s->order_id] ?? 0.0), 2);
            $summaryDistributed = (float) $s->total_distributed_amount;

            $diff = round(abs($summaryDistributed - $paymentsDistributed) + abs($summaryDistributed - $ledgerDistributed), 2);
            $isMathConsistent = round($s->total_expected_amount, 2) === round($summaryDistributed + $s->total_pending_amount + $s->total_dump_amount, 2);

            if ($diff === 0.0 && $isMathConsistent) {
                $recStatus = 'Reconciled';
            } elseif ($paymentsDistributed > 0 && $ledgerDistributed === 0.0) {
                $recStatus = 'Missing Ledger Reference';
            } else {
                $recStatus = 'Mismatch';
            }

            return [
                'id' => $s->id,
                'order_id' => $s->order_id,
                'orderId' => $s->order_id,
                'invoice_number' => $s->invoice_number,
                'invoiceNumber' => $s->invoice_number,
                'order_date' => $order?->date ? (string) $order->date : ($s->created_at ? $s->created_at->format('Y-m-d') : null),
                'orderDate' => $order?->date ? (string) $order->date : ($s->created_at ? $s->created_at->format('Y-m-d') : null),
                'order_status' => $order?->status ?? 'completed',
                'orderStatus' => $order?->status ?? 'completed',
                'approval_status' => $order?->approval_status ?? 'confirmed',
                'approvalStatus' => $order?->approval_status ?? 'confirmed',
                'item_name' => $s->item_name,
                'itemName' => $s->item_name,
                'item_type' => $order?->item_type ?? 'service',
                'itemType' => $order?->item_type ?? 'service',
                'category' => $order?->category ?? 'General',
                'entity_id' => $order?->entity_id,
                'entityId' => $order?->entity_id,
                'entity_name' => $order?->entity_name ?? 'N/A',
                'entityName' => $order?->entity_name ?? 'N/A',
                'entity_type' => $order?->entity_type ?? 'business',
                'entityType' => $order?->entity_type ?? 'business',
                'buyer_name' => $s->source_user_name ?: ($s->sourceUser?->name ?? 'Customer'),
                'buyerName' => $s->source_user_name ?: ($s->sourceUser?->name ?? 'Customer'),
                'buyer_user_code' => $s->source_user_code,
                'buyerUserCode' => $s->source_user_code,
                'sponsor_name' => $beneficiary?->name ?? 'Sponsor',
                'sponsorName' => $beneficiary?->name ?? 'Sponsor',
                'sponsor_user_code' => $s->user_code,
                'sponsorUserCode' => $s->user_code,
                'beneficiary_user_id' => $s->user_id,
                'beneficiaryUserId' => $s->user_id,
                'order_gross_amount' => (float) $s->order_gross_amount,
                'orderGrossAmount' => (float) $s->order_gross_amount,
                'admin_commission_percent' => (float) ($order?->admin_commission_percent ?? 15.0),
                'adminCommissionPercent' => (float) ($order?->admin_commission_percent ?? 15.0),
                'admin_commission_cut' => (float) ($order?->admin_commission_cut ?? round(((float) $s->order_gross_amount * (float) ($order?->admin_commission_percent ?? 15.0)) / 100, 2)),
                'adminCommissionCut' => (float) ($order?->admin_commission_cut ?? round(((float) $s->order_gross_amount * (float) ($order?->admin_commission_percent ?? 15.0)) / 100, 2)),
                'total_expected_amount' => (float) $s->total_expected_amount,
                'totalExpectedAmount' => (float) $s->total_expected_amount,
                'total_distributed_amount' => (float) $s->total_distributed_amount,
                'totalDistributedAmount' => (float) $s->total_distributed_amount,
                'total_pending_amount' => (float) $s->total_pending_amount,
                'totalPendingAmount' => (float) $s->total_pending_amount,
                'total_dump_amount' => (float) $s->total_dump_amount,
                'totalDumpAmount' => (float) $s->total_dump_amount,
                'distribution_count' => (int) $s->distribution_count,
                'distributionCount' => (int) $s->distribution_count,
                'distribution_status' => $s->distribution_status,
                'distributionStatus' => $s->distribution_status,
                'last_distribution_at' => $s->last_distribution_at?->toIso8601String(),
                'lastDistributionAt' => $s->last_distribution_at?->toIso8601String(),
                'reconciliation_status' => $recStatus,
                'reconciliationStatus' => $recStatus,
                'reconciliation_difference' => $diff,
                'reconciliationDifference' => $diff,
                'created_at' => $s->created_at?->toIso8601String(),
                'updated_at' => $s->updated_at?->toIso8601String(),
            ];
        });

        // Optional post-filter: reconciliation_status filter
        if ($request->filled('reconciliation_status') && $request->input('reconciliation_status') !== 'all') {
            $targetRec = strtolower(trim((string) $request->input('reconciliation_status')));
            $mappedData = $mappedData->filter(function ($item) use ($targetRec) {
                return strtolower($item['reconciliation_status']) === $targetRec;
            })->values();
        }

        return response()->json([
            'status' => 'success',
            'data' => $mappedData,
            'orders' => $mappedData,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ], 200);
    }

    /**
     * API 3 – Global Order Direct Income Details Drill-Down
     *
     * GET /api/admin/income/direct-orders/{orderId}
     * Returns 6 detailed sections for comprehensive Admin audit.
     */
    public function getOrderDirectIncomeDetails(Request $request, $orderId): JsonResponse
    {
        $admin = $this->verifyAdminAccess($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        // 1. Resolve Order with relations
        $order = Order::with(['payments', 'dumpRequests', 'directIncomeSummary'])
            ->where('id', $orderId)
            ->orWhere('invoice_number', $orderId)
            ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => "Order #{$orderId} not found in database.",
            ], 404);
        }

        // 2. Resolve Beneficiary Sponsor & Customer
        $customer = $order->customer_user_code ? User::where('user_code', $order->customer_user_code)->first() : null;
        $sponsorCode = $customer ? $customer->sponsor_id : $order->sponsor;
        $sponsor = $sponsorCode ? User::where('user_code', $sponsorCode)->orWhere('id', $sponsorCode)->first() : null;

        // 3. Resolve Direct Income Order Summary (Read-only; calculate in-memory if summary row absent)
        $summary = $order->directIncomeSummary;
        if (!$summary) {
            $configSnapshot = CommissionSetting::getValidatedGlobalSnapshot();
            $directPercent = (float) ($configSnapshot['direct_percent'] ?? 40.0);
            $orderGross = (float) ($order->gross_amount ?? 0);
            $orderCommissionRate = (float) ($order->admin_commission_percent ?: 15.0);
            $expectedCut = (float) ($order->admin_commission_cut > 0
                ? $order->admin_commission_cut
                : round(($orderGross * $orderCommissionRate) / 100, 2));

            $expectedDirect = round(($expectedCut * $directPercent) / 100, 2);
            $distributedDirect = (float) round(
                SalePayment::where('sales_record_id', $order->id)
                    ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
                    ->sum('direct_income_amount'),
                2
            );
            $approvedDumpsDirect = (float) round(
                OrderPaymentDump::where('order_id', $order->id)
                    ->where('status', 'approved')
                    ->sum('direct_income_amount'),
                2
            );
            $pendingDirect = max(0.0, round($expectedDirect - $distributedDirect - $approvedDumpsDirect, 2));
            $distCount = SalePayment::where('sales_record_id', $order->id)
                ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
                ->where('direct_income_amount', '>', 0)
                ->count();
            $status = $distributedDirect <= 0 ? 'pending' : ($pendingDirect <= 0.00 ? 'completed' : 'partial');

            $summary = (object) [
                'order_gross_amount' => $orderGross,
                'total_expected_amount' => $expectedDirect,
                'total_distributed_amount' => $distributedDirect,
                'total_pending_amount' => $pendingDirect,
                'total_dump_amount' => $approvedDumpsDirect,
                'distribution_count' => $distCount,
                'distribution_status' => $status,
                'last_distribution_at' => null,
            ];
        }

        // 4. Completed installment payment distributions from sale_payments
        $completedPayments = $order->payments()
            ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
            ->where('direct_income_amount', '>', 0)
            ->orderBy('id', 'asc')
            ->get();

        $distributions = $completedPayments->map(function ($p, $idx) {
            $paymentTypeLabel = match ($p->payment_type) {
                'advance' => 'Initial Advance Payment',
                'full' => 'Full Payment Receipt',
                'balance' => 'Balance Installment #' . ($idx + 1),
                default => ucfirst($p->payment_type ?: 'Installment'),
            };

            return [
                'payment_id' => $p->id,
                'paymentId' => $p->id,
                'installment_number' => $idx + 1,
                'installmentNumber' => $idx + 1,
                'installment_type' => $p->payment_type ?: 'advance',
                'installmentType' => $p->payment_type ?: 'advance',
                'installment_label' => $paymentTypeLabel,
                'installmentLabel' => $paymentTypeLabel,
                'reference_no' => $p->reference_no ?: 'N/A',
                'referenceNo' => $p->reference_no ?: 'N/A',
                'payment_method' => $p->payment_method ?: 'UPI / Bank Transfer',
                'paymentMethod' => $p->payment_method ?: 'UPI / Bank Transfer',
                'payment_date' => $p->payment_date ? (string) $p->payment_date : ($p->created_at ? (string) $p->created_at : null),
                'paymentDate' => $p->payment_date ? (string) $p->payment_date : ($p->created_at ? (string) $p->created_at : null),
                'payment_amount' => (float) $p->amount,
                'paymentAmount' => (float) $p->amount,
                'admin_commission_percent' => (float) $p->admin_commission_percent,
                'adminCommissionPercent' => (float) $p->admin_commission_percent,
                'admin_commission_cut' => (float) $p->admin_commission_cut,
                'adminCommissionCut' => (float) $p->admin_commission_cut,
                'direct_income_percent' => 40.0,
                'directIncomePercent' => 40.0,
                'direct_income_amount' => (float) $p->direct_income_amount,
                'directIncomeAmount' => (float) $p->direct_income_amount,
                'beneficiary_sponsor' => $p->sponsor,
                'beneficiarySponsor' => $p->sponsor,
                'distribution_status' => $p->income_distribution_status,
                'distributionStatus' => $p->income_distribution_status,
                'distributed_by' => $p->income_distributed_by,
                'distributedBy' => $p->income_distributed_by,
                'distributed_at' => $p->income_distributed_at ? (string) $p->income_distributed_at : null,
                'distributedAt' => $p->income_distributed_at ? (string) $p->income_distributed_at : null,
            ];
        })->values()->all();

        // 5. Pending installment payments (awaiting admin allocation)
        $pendingPayments = $order->payments()
            ->where('income_distribution_status', 'pending')
            ->where('admin_commission_cut', '>', 0)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'payment_id' => $p->id,
                    'paymentId' => $p->id,
                    'installment_type' => $p->payment_type ?: 'balance',
                    'installmentType' => $p->payment_type ?: 'balance',
                    'reference_no' => $p->reference_no ?: 'N/A',
                    'referenceNo' => $p->reference_no ?: 'N/A',
                    'payment_date' => $p->payment_date ? (string) $p->payment_date : null,
                    'paymentDate' => $p->payment_date ? (string) $p->payment_date : null,
                    'payment_method' => $p->payment_method ?: 'UPI / Bank Transfer',
                    'paymentMethod' => $p->payment_method ?: 'UPI / Bank Transfer',
                    'payment_amount' => (float) $p->amount,
                    'paymentAmount' => (float) $p->amount,
                    'admin_commission_cut' => (float) $p->admin_commission_cut,
                    'adminCommissionCut' => (float) $p->admin_commission_cut,
                    'direct_income_expected' => round(((float) $p->admin_commission_cut * 40.0) / 100, 2),
                    'directIncomeExpected' => round(((float) $p->admin_commission_cut * 40.0) / 100, 2),
                    'distribution_status' => 'pending_admin_distribution',
                    'distributionStatus' => 'pending_admin_distribution',
                ];
            })->values()->all();

        // 6. Direct Income ledger and wallet trace
        $paymentIds = $completedPayments->pluck('id')->filter()->all();
        $ledgerRecords = DirectIncome::where('order_id', $order->id)
            ->orWhereIn('sale_payment_id', $paymentIds)
            ->orderBy('id', 'asc')
            ->get();

        $ledgerTrace = [];
        $verifiedWalletCredits = 0.0;

        foreach ($ledgerRecords as $d) {
            $wt = WalletTransfer::where('memberid', $d->user_code)
                ->where('walletType', 'Direct Income')
                ->where(function ($q) use ($d) {
                    $q->where('particular', 'like', "%#{$d->id}%")
                      ->orWhere('particular', 'like', "%Payment Record #{$d->id}%");
                })
                ->first();

            $traceStatus = $wt ? 'verified' : 'unresolved_wallet_trace';
            if ($wt) {
                $verifiedWalletCredits += (float) $d->total_amount;
            }

            $ledgerTrace[] = [
                'ledger_id' => $d->id,
                'ledgerId' => $d->id,
                'sale_payment_id' => $d->sale_payment_id,
                'salePaymentId' => $d->sale_payment_id,
                'order_id' => $d->order_id ?: $order->id,
                'orderId' => $d->order_id ?: $order->id,
                'beneficiary_user_code' => $d->user_code,
                'beneficiaryUserCode' => $d->user_code,
                'source_user_code' => $d->source_user_code,
                'sourceUserCode' => $d->source_user_code,
                'percentage' => (float) ($d->percentage ?? 40.0),
                'credited_amount' => (float) $d->total_amount,
                'creditedAmount' => (float) $d->total_amount,
                'wallet_transfer_ref' => $wt ? $wt->particular : ($d->sale_payment_id ? "Payment Record #{$d->sale_payment_id}" : 'Unresolved'),
                'walletTransferRef' => $wt ? $wt->particular : ($d->sale_payment_id ? "Payment Record #{$d->sale_payment_id}" : 'Unresolved'),
                'wallet_transfer_id' => $wt?->id,
                'walletTransferId' => $wt?->id,
                'wallet_balance_snapshot' => $wt ? (float) $wt->balance : null,
                'walletBalanceSnapshot' => $wt ? (float) $wt->balance : null,
                'trace_status' => $traceStatus,
                'traceStatus' => $traceStatus,
                'timestamp' => $d->created_at?->toIso8601String(),
            ];
        }

        // 7. Approved and Pending Dump Records
        $allDumps = $order->dumpRequests()->orderBy('id', 'asc')->get();
        $approvedDumps = [];
        $otherDumps = [];

        foreach ($allDumps as $d) {
            $rate = (float) ($d->admin_commission_percent ?? $order->admin_commission_percent ?? 15.0);
            $cut = (float) ($d->admin_commission_cut ?? round(((float) $d->dump_amount * $rate) / 100, 2));
            $direct = (float) ($d->direct_income_amount > 0 ? $d->direct_income_amount : round($cut * 0.40, 2));

            $dumpItem = [
                'dump_id' => $d->id,
                'dumpId' => $d->id,
                'dump_reason' => $d->dump_reason,
                'dumpReason' => $d->dump_reason,
                'dump_amount' => (float) $d->dump_amount,
                'dumpAmount' => (float) $d->dump_amount,
                'admin_commission_cut' => $cut,
                'adminCommissionCut' => $cut,
                'direct_income_amount' => $direct,
                'directIncomeAmount' => $direct,
                'status' => $d->status,
                'approved_by' => $d->approved_by,
                'approvedBy' => $d->approved_by,
                'approved_at' => $d->approved_at ? (string) $d->approved_at : null,
                'approvedAt' => $d->approved_at ? (string) $d->approved_at : null,
                'rejected_by' => $d->rejected_by,
                'rejectedBy' => $d->rejected_by,
                'rejected_at' => $d->rejected_at ? (string) $d->rejected_at : null,
                'rejectedAt' => $d->rejected_at ? (string) $d->rejected_at : null,
                'admin_rejection_reason' => $d->admin_rejection_reason,
                'adminRejectionReason' => $d->admin_rejection_reason,
            ];

            if ($d->status === 'approved') {
                $approvedDumps[] = $dumpItem;
            } else {
                $otherDumps[] = $dumpItem;
            }
        }

        // 8. Order Four-Way Financial Reconciliation Check
        $summaryDistributed = (float) $summary->total_distributed_amount;
        $paymentsDistributed = (float) round($completedPayments->sum('direct_income_amount'), 2);
        $ledgerDistributed = (float) round($ledgerRecords->sum('total_amount'), 2);
        $walletDistributed = (float) round($verifiedWalletCredits, 2);

        $diff = round(abs($summaryDistributed - $paymentsDistributed) + abs($summaryDistributed - $ledgerDistributed), 2);
        $isMathConsistent = round($summary->total_expected_amount, 2) === round($summaryDistributed + $summary->total_pending_amount + $summary->total_dump_amount, 2);

        if ($diff === 0.0 && $isMathConsistent) {
            if (count($ledgerRecords) === 0 && $paymentsDistributed === 0.0) {
                $recStatus = 'Reconciled';
                $recMessage = 'Order has zero distributions. Expected and pending direct balances are consistent.';
            } elseif ($walletDistributed === $summaryDistributed) {
                $recStatus = 'Reconciled';
                $recMessage = '100% four-way reconciliation verified across summary, payments, direct ledger, and wallet transfers.';
            } else {
                $recStatus = 'Incomplete Wallet Trace';
                $recMessage = "Summary, payment receipts, and direct income ledger match perfectly (₹{$summaryDistributed}); wallet transfer metadata is partially unlinked.";
            }
        } elseif ($paymentsDistributed > 0 && $ledgerDistributed === 0.0) {
            $recStatus = 'Missing Ledger Reference';
            $recMessage = 'Payment receipts are distributed but corresponding direct_incomes ledger entries are unlinked.';
        } else {
            $recStatus = 'Mismatch';
            $recMessage = "Financial mismatch detected. Variance: ₹{$diff}. Summary: ₹{$summaryDistributed}, Payments: ₹{$paymentsDistributed}, Ledger: ₹{$ledgerDistributed}.";
        }

        $expectedDirectTotal = (float) $summary->total_expected_amount;
        $completionPct = $expectedDirectTotal > 0
            ? round(($summaryDistributed / $expectedDirectTotal) * 100, 2)
            : 0.0;

        return response()->json([
            'status' => 'success',
            'order' => [
                'id' => $order->id,
                'order_id' => $order->id,
                'orderId' => $order->id,
                'invoice_number' => $order->invoice_number,
                'invoiceNumber' => $order->invoice_number,
                'order_date' => $order->date ? (string) $order->date : ($order->created_at ? $order->created_at->format('Y-m-d') : null),
                'orderDate' => $order->date ? (string) $order->date : ($order->created_at ? $order->created_at->format('Y-m-d') : null),
                'item_name' => $order->item,
                'itemName' => $order->item,
                'item_type' => $order->item_type ?? 'service',
                'itemType' => $order->item_type ?? 'service',
                'category' => $order->category ?? 'General',
                'entity_id' => $order->entity_id,
                'entityId' => $order->entity_id,
                'entity_name' => $order->entity_name ?? 'N/A',
                'entityName' => $order->entity_name ?? 'N/A',
                'entity_type' => $order->entity_type ?? 'business',
                'entityType' => $order->entity_type ?? 'business',
                'buyer' => [
                    'name' => $order->customer_name ?: ($customer?->name ?? 'Customer'),
                    'user_code' => $order->customer_user_code,
                    'userCode' => $order->customer_user_code,
                ],
                'sponsor' => [
                    'name' => $sponsor?->name ?? 'Sponsor',
                    'user_code' => $summary->user_code ?? $sponsorCode,
                    'userCode' => $summary->user_code ?? $sponsorCode,
                    'user_id' => $summary->user_id ?? $sponsor?->id,
                    'userId' => $summary->user_id ?? $sponsor?->id,
                ],
                'order_status' => $order->status ?? 'completed',
                'orderStatus' => $order->status ?? 'completed',
                'approval_status' => $order->approval_status ?? 'confirmed',
                'approvalStatus' => $order->approval_status ?? 'confirmed',
            ],
            'parent_order_financials' => [
                'order_gross_amount' => (float) ($summary->order_gross_amount ?? $order->gross_amount),
                'orderGrossAmount' => (float) ($summary->order_gross_amount ?? $order->gross_amount),
                'cash_received' => (float) ($order->total_payment_received ?? $order->advance_payment ?? 0),
                'cashReceived' => (float) ($order->total_payment_received ?? $order->advance_payment ?? 0),
                'remaining_order_balance' => (float) ($order->remaining_project_balance ?? $order->balance_due ?? 0),
                'remainingOrderBalance' => (float) ($order->remaining_project_balance ?? $order->balance_due ?? 0),
                'approved_dump_amount' => (float) ($order->approved_dump_amount ?? 0),
                'approvedDumpAmount' => (float) ($order->approved_dump_amount ?? 0),
                'admin_commission_percent' => (float) ($order->admin_commission_percent ?? 15.0),
                'adminCommissionPercent' => (float) ($order->admin_commission_percent ?? 15.0),
                'expected_admin_commission_cut' => (float) ($order->expected_admin_cut ?? round(((float) $order->gross_amount * (float) ($order->admin_commission_percent ?? 15.0)) / 100, 2)),
                'expectedAdminCommissionCut' => (float) ($order->expected_admin_cut ?? round(((float) $order->gross_amount * (float) ($order->admin_commission_percent ?? 15.0)) / 100, 2)),
            ],
            'direct_income_summary' => [
                'expected_direct_income' => $expectedDirectTotal,
                'expectedDirectIncome' => $expectedDirectTotal,
                'total_distributed_direct_income' => $summaryDistributed,
                'totalDistributedDirectIncome' => $summaryDistributed,
                'pending_direct_income' => (float) $summary->total_pending_amount,
                'pendingDirectIncome' => (float) $summary->total_pending_amount,
                'approved_dump_direct_income' => (float) $summary->total_dump_amount,
                'approvedDumpDirectIncome' => (float) $summary->total_dump_amount,
                'distribution_count' => (int) $summary->distribution_count,
                'distributionCount' => (int) $summary->distribution_count,
                'distribution_status' => $summary->distribution_status ?? 'pending',
                'distributionStatus' => $summary->distribution_status ?? 'pending',
                'completion_percentage' => $completionPct,
                'completionPercentage' => $completionPct,
                'last_distribution_at' => $summary->last_distribution_at instanceof \DateTimeInterface
                    ? $summary->last_distribution_at->toIso8601String()
                    : ($summary->last_distribution_at ? (string) $summary->last_distribution_at : null),
                'lastDistributionAt' => $summary->last_distribution_at instanceof \DateTimeInterface
                    ? $summary->last_distribution_at->toIso8601String()
                    : ($summary->last_distribution_at ? (string) $summary->last_distribution_at : null),
            ],
            'financial_summary' => [
                'expected_direct_income' => $expectedDirectTotal,
                'expectedDirectIncome' => $expectedDirectTotal,
                'total_distributed_direct_income' => $summaryDistributed,
                'totalDistributedDirectIncome' => $summaryDistributed,
                'pending_direct_income' => (float) $summary->total_pending_amount,
                'pendingDirectIncome' => (float) $summary->total_pending_amount,
                'approved_dump_direct_income' => (float) $summary->total_dump_amount,
                'approvedDumpDirectIncome' => (float) $summary->total_dump_amount,
                'distribution_count' => (int) $summary->distribution_count,
                'distributionCount' => (int) $summary->distribution_count,
                'distribution_status' => $summary->distribution_status ?? 'pending',
                'distributionStatus' => $summary->distribution_status ?? 'pending',
            ],
            'distributions' => $distributions,
            'pending_installments' => $pendingPayments,
            'pendingInstallments' => $pendingPayments,
            'ledger_entries' => $ledgerTrace,
            'ledgerEntries' => $ledgerTrace,
            'approved_dump_records' => $approvedDumps,
            'approvedDumpRecords' => $approvedDumps,
            'dump_records' => $approvedDumps,
            'dumpRecords' => $approvedDumps,
            'other_dump_requests' => $otherDumps,
            'otherDumpRequests' => $otherDumps,
            'reconciliation' => [
                'summary_distributed' => $summaryDistributed,
                'summaryDistributed' => $summaryDistributed,
                'payments_distributed' => $paymentsDistributed,
                'paymentsDistributed' => $paymentsDistributed,
                'ledger_distributed' => $ledgerDistributed,
                'ledgerDistributed' => $ledgerDistributed,
                'wallet_distributed' => $walletDistributed,
                'walletDistributed' => $walletDistributed,
                'difference' => $diff,
                'status' => $recStatus,
                'message' => $recMessage,
            ],
        ], 200);
    }
}
