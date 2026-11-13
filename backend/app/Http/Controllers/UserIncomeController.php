<?php

namespace App\Http\Controllers;

use App\Models\CommissionSetting;
use App\Models\DirectIncome;
use App\Models\DirectIncomeOrderSummary;
use App\Models\LevelIncome;
use App\Models\Order;
use App\Models\OrderPaymentDump;
use App\Models\SalePayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class UserIncomeController extends Controller
{
    /**
     * Resolve authenticated User from Sanctum or request context.
     * Enforces strict authorization so a user can never access another user's income.
     *
     * @param Request $request
     * @return User|null
     */
    protected function resolveAuthenticatedUser(Request $request): ?User
    {
        $user = $request->user();

        if (!$user && auth('sanctum')->check()) {
            $user = auth('sanctum')->user();
        }

        if (!$user && $request->bearerToken()) {
            if (class_exists(PersonalAccessToken::class)) {
                $token = PersonalAccessToken::findToken($request->bearerToken());
                if ($token && $token->tokenable instanceof User) {
                    $user = $token->tokenable;
                }
            }
        }

        return $user instanceof User ? $user : null;
    }

    /**
     * Get Direct Income summary for authenticated user.
     *
     * GET /api/user/income/direct
     */
    public function getDirectIncome(Request $request)
    {
        $user = $this->resolveAuthenticatedUser($request);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Please log in to view Direct Income.',
            ], 401);
        }

        // Query direct_incomes exclusively for the authenticated user by user_code
        $directIncomes = $user->user_code
            ? DirectIncome::where('user_code', $user->user_code)->orderBy('id', 'desc')->get()
            : collect([]);

        $totalAmount = (float) $directIncomes->sum('total_amount');
        $paidAmount = (float) $directIncomes->sum('paid_amount');
        $dumpAmount = (float) $directIncomes->sum('dump_amount');
        $balanceAmount = max(0.0, round($totalAmount - $paidAmount, 2));

        $todayAmount = (float) $directIncomes->filter(function ($rec) {
            return $rec->created_at && Carbon::parse($rec->created_at)->setTimezone('Asia/Kolkata')->isToday();
        })->sum('total_amount');

        $latestRecord = $directIncomes->first();

        $summary = [
            'id' => $latestRecord?->id,
            'user_id' => $user->id,
            'userId' => $user->id,
            'member_id' => $user->user_code ?: "USR-{$user->id}",
            'memberId' => $user->user_code ?: "USR-{$user->id}",
            'user_name' => $user->name ?: 'Member',
            'userName' => $user->name ?: 'Member',
            'total_amount' => $totalAmount,
            'totalAmount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'paidAmount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'balanceAmount' => $balanceAmount,
            'dump_amount' => $dumpAmount,
            'dumpAmount' => $dumpAmount,
            'today_amount' => $todayAmount,
            'todayAmount' => $todayAmount,
            'has_record' => $directIncomes->isNotEmpty(),
            'created_at' => $latestRecord?->created_at?->toIso8601String(),
            'updated_at' => $latestRecord?->updated_at?->toIso8601String(),
        ];

        $records = $directIncomes->map(function ($rec) use ($user) {
            $total = (float) $rec->total_amount;
            $paid = (float) $rec->paid_amount;
            $balance = max(0.0, round($total - $paid, 2));
            $dump = (float) $rec->dump_amount;

            return [
                'id' => $rec->id,
                'user_id' => $user->id,
                'userId' => $user->id,
                'member_id' => $rec->user_code ?: $user->user_code,
                'memberId' => $rec->user_code ?: $user->user_code,
                'user_name' => $user->name ?: 'Member',
                'userName' => $user->name ?: 'Member',
                'user_code' => $rec->user_code,
                'userCode' => $rec->user_code,
                'sponsor_id' => $rec->sponsor_id,
                'sponsorId' => $rec->sponsor_id,
                'total_amount' => $total,
                'totalAmount' => $total,
                'paid_amount' => $paid,
                'paidAmount' => $paid,
                'balance_amount' => $balance,
                'balanceAmount' => $balance,
                'dump_amount' => $dump,
                'dumpAmount' => $dump,
                'status' => $paid >= $total && $total > 0 ? 'paid' : ($paid > 0 ? 'partial' : 'active'),
                'created_at' => $rec->created_at?->toIso8601String(),
                'updated_at' => $rec->updated_at?->toIso8601String(),
            ];
        })->values()->all();

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'user_code' => $user->user_code,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'summary' => $summary,
            'records' => $records,
        ], 200);
    }

    /**
     * Get Level Income summary and Level 2-5 breakdown for authenticated user.
     *
     * GET /api/user/income/levels
     */
    public function getLevelIncome(Request $request)
    {
        $user = $this->resolveAuthenticatedUser($request);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Please log in to view Level Income.',
            ], 401);
        }

        // Query level_incomes by user_code
        $records = $user->user_code
            ? LevelIncome::where('user_code', $user->user_code)->orderBy('id', 'desc')->get()
            : collect([]);

        // Calculate cumulative totals across existing level records
        $totalAmount = (float) $records->sum('total_amount');
        $paidAmount = (float) $records->sum('paid_amount');
        $balanceAmount = max(0.0, round($totalAmount - $paidAmount, 2));
        $dumpAmount = (float) $records->sum('dump_amount');

        $todayAmount = (float) $records->filter(function ($rec) {
            return $rec->created_at && Carbon::parse($rec->created_at)->setTimezone('Asia/Kolkata')->isToday();
        })->sum('total_amount');

        $recordsByLevel = $records->groupBy('level');

        // Determine active level numbers dynamically (including Level 1 when configured > 0 or earned)
        $globalSetting = CommissionSetting::getGlobalRecord();
        $levelColumns = CommissionSetting::getLevelColumns();
        $levelNumbers = [];
        foreach ($levelColumns as $col) {
            $lvlNum = (int) $col['level'];
            $lvlPct = (float) ($globalSetting?->{$col['key']} ?? 0);
            if ($lvlNum === 1 && $lvlPct <= 0 && !$recordsByLevel->has(1)) {
                continue;
            }
            $levelNumbers[] = $lvlNum;
        }
        if (empty($levelNumbers)) {
            $levelNumbers = [2, 3, 4, 5];
        }

        // Build per-level breakdown dynamically
        $levelsBreakdown = [];
        foreach ($levelNumbers as $levelNum) {
            $levelGroup = $recordsByLevel->get($levelNum, collect([]));
            $lvlTotal = (float) $levelGroup->sum('total_amount');
            $lvlPaid = (float) $levelGroup->sum('paid_amount');
            $lvlBalance = max(0.0, round($lvlTotal - $lvlPaid, 2));
            $lvlDump = (float) $levelGroup->sum('dump_amount');

            $firstRec = $levelGroup->first();

            $levelsBreakdown[] = [
                'id' => $firstRec?->id,
                'user_id' => $user->id,
                'userId' => $user->id,
                'member_id' => $user->user_code ?: "USR-{$user->id}",
                'memberId' => $user->user_code ?: "USR-{$user->id}",
                'user_name' => $user->name ?: 'Member',
                'userName' => $user->name ?: 'Member',
                'level_number' => $levelNum,
                'levelNumber' => $levelNum,
                'total_amount' => $lvlTotal,
                'totalAmount' => $lvlTotal,
                'paid_amount' => $lvlPaid,
                'paidAmount' => $lvlPaid,
                'balance_amount' => $lvlBalance,
                'balanceAmount' => $lvlBalance,
                'dump_amount' => $lvlDump,
                'dumpAmount' => $lvlDump,
                'has_record' => $levelGroup->isNotEmpty(),
                'created_at' => $firstRec?->created_at?->toIso8601String(),
                'updated_at' => $firstRec?->updated_at?->toIso8601String(),
            ];
        }

        $summary = [
            'user_id' => $user->id,
            'userId' => $user->id,
            'member_id' => $user->user_code ?: "USR-{$user->id}",
            'memberId' => $user->user_code ?: "USR-{$user->id}",
            'user_name' => $user->name ?: 'Member',
            'userName' => $user->name ?: 'Member',
            'total_amount' => $totalAmount,
            'totalAmount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'paidAmount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'balanceAmount' => $balanceAmount,
            'dump_amount' => $dumpAmount,
            'dumpAmount' => $dumpAmount,
            'today_amount' => $todayAmount,
            'todayAmount' => $todayAmount,
            'levels_count' => $records->count(),
        ];

        $mappedRecords = $records->map(function ($rec) use ($user) {
            $total = (float) $rec->total_amount;
            $paid = (float) $rec->paid_amount;
            $balance = max(0.0, round($total - $paid, 2));
            $dump = (float) $rec->dump_amount;

            return [
                'id' => $rec->id,
                'user_id' => $user->id,
                'userId' => $user->id,
                'user_code' => $rec->user_code ?: $user->user_code,
                'userCode' => $rec->user_code ?: $user->user_code,
                'member_id' => $rec->user_code ?: $user->user_code,
                'memberId' => $rec->user_code ?: $user->user_code,
                'user_name' => $user->name ?: 'Member',
                'userName' => $user->name ?: 'Member',
                'level' => (int) $rec->level,
                'level_number' => (int) $rec->level,
                'levelNumber' => (int) $rec->level,
                'level_id' => $rec->level_id,
                'source_member' => $rec->level_id,
                'sourceMember' => $rec->level_id,
                'total_amount' => $total,
                'totalAmount' => $total,
                'paid_amount' => $paid,
                'paidAmount' => $paid,
                'balance_amount' => $balance,
                'balanceAmount' => $balance,
                'dump_amount' => $dump,
                'dumpAmount' => $dump,
                'status' => $paid >= $total && $total > 0 ? 'paid' : ($paid > 0 ? 'partial' : 'active'),
                'created_at' => $rec->created_at?->toIso8601String(),
                'updated_at' => $rec->updated_at?->toIso8601String(),
            ];
        })->values()->all();

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'user_code' => $user->user_code,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'summary' => $summary,
            'levels' => $levelsBreakdown,
            'records' => $mappedRecords,
        ], 200);
    }

    /**
     * Get combined Income summary (Today's, Total, Direct, Level) for authenticated user.
     *
     * GET /api/user/income/summary
     */
    public function getIncomeSummary(Request $request)
    {
        $user = $this->resolveAuthenticatedUser($request);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Please log in to view Income summary.',
            ], 401);
        }

        $userCode = $user->user_code;

        $directIncomes = $userCode ? DirectIncome::where('user_code', $userCode)->get() : collect([]);
        $levelIncomes = $userCode ? LevelIncome::where('user_code', $userCode)->get() : collect([]);

        $directTotal = (float) $directIncomes->sum('total_amount');
        $directPaid = (float) $directIncomes->sum('paid_amount');
        $directBalance = max(0.0, round($directTotal - $directPaid, 2));
        $directDump = (float) $directIncomes->sum('dump_amount');
        $todayDirect = (float) $directIncomes->filter(function ($rec) {
            return $rec->created_at && Carbon::parse($rec->created_at)->setTimezone('Asia/Kolkata')->isToday();
        })->sum('total_amount');

        $levelTotal = (float) $levelIncomes->sum('total_amount');
        $levelPaid = (float) $levelIncomes->sum('paid_amount');
        $levelBalance = max(0.0, round($levelTotal - $levelPaid, 2));
        $levelDump = (float) $levelIncomes->sum('dump_amount');
        $todayLevel = (float) $levelIncomes->filter(function ($rec) {
            return $rec->created_at && Carbon::parse($rec->created_at)->setTimezone('Asia/Kolkata')->isToday();
        })->sum('total_amount');

        $totalIncome = round($directTotal + $levelTotal, 2);
        $todayIncome = round($todayDirect + $todayLevel, 2);
        $totalPaid = round($directPaid + $levelPaid, 2);
        $totalBalance = round($directBalance + $levelBalance, 2);
        $totalDump = round($directDump + $levelDump, 2);

        $mappedDirectRecords = $directIncomes->map(function ($rec) use ($user) {
            $total = (float) $rec->total_amount;
            $paid = (float) $rec->paid_amount;
            $balance = max(0.0, round($total - $paid, 2));
            $dump = (float) $rec->dump_amount;

            return [
                'id' => $rec->id,
                'user_code' => $rec->user_code ?: $user->user_code,
                'member_id' => $rec->user_code ?: $user->user_code,
                'sponsor_id' => $rec->sponsor_id ?: '—',
                'total_amount' => $total,
                'paid_amount' => $paid,
                'balance_amount' => $balance,
                'dump_amount' => $dump,
                'status' => $balance > 0 ? 'Active' : ($total > 0 ? 'Settled' : 'Pending'),
                'created_at' => $rec->created_at?->toIso8601String(),
                'updated_at' => $rec->updated_at?->toIso8601String(),
            ];
        })->values()->all();

        $mappedLevelRecords = $levelIncomes->map(function ($rec) use ($user) {
            $total = (float) $rec->total_amount;
            $paid = (float) $rec->paid_amount;
            $balance = max(0.0, round($total - $paid, 2));
            $dump = (float) $rec->dump_amount;

            return [
                'id' => $rec->id,
                'user_code' => $rec->user_code ?: $user->user_code,
                'member_id' => $rec->user_code ?: $user->user_code,
                'level' => (int) $rec->level,
                'level_id' => $rec->level_id,
                'source_member' => $rec->level_id ? ('Member #' . $rec->level_id) : 'Downline',
                'total_amount' => $total,
                'paid_amount' => $paid,
                'balance_amount' => $balance,
                'dump_amount' => $dump,
                'status' => $balance > 0 ? 'Active' : ($total > 0 ? 'Settled' : 'Pending'),
                'created_at' => $rec->created_at?->toIso8601String(),
                'updated_at' => $rec->updated_at?->toIso8601String(),
            ];
        })->values()->all();

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'user_code' => $user->user_code,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'summary' => [
                'user_id' => $user->id,
                'member_id' => $userCode,
                'user_name' => $user->name,
                'today_income' => $todayIncome,
                'total_income' => $totalIncome,
                'direct_income' => $directTotal,
                'level_income' => $levelTotal,
                'paid_amount' => $totalPaid,
                'balance_amount' => $totalBalance,
                'dump_amount' => $totalDump,
            ],
            'cards' => [
                'today_income' => $todayIncome,
                'todayIncome' => $todayIncome,
                'total_income' => $totalIncome,
                'totalIncome' => $totalIncome,
                'direct_income' => $directTotal,
                'directIncome' => $directTotal,
                'level_income' => $levelTotal,
                'levelIncome' => $levelTotal,
                'paid_amount' => $totalPaid,
                'paidAmount' => $totalPaid,
                'balance_amount' => $totalBalance,
                'balanceAmount' => $totalBalance,
                'dump_amount' => $totalDump,
                'dumpAmount' => $totalDump,
            ],
            'direct' => [
                'total_amount' => $directTotal,
                'paid_amount' => $directPaid,
                'balance_amount' => $directBalance,
                'dump_amount' => $directDump,
                'today_amount' => $todayDirect,
                'count' => $directIncomes->count(),
                'records' => $mappedDirectRecords,
            ],
            'level' => [
                'total_amount' => $levelTotal,
                'paid_amount' => $levelPaid,
                'balance_amount' => $levelBalance,
                'dump_amount' => $levelDump,
                'today_amount' => $todayLevel,
                'count' => $levelIncomes->count(),
                'records' => $mappedLevelRecords,
            ],
        ], 200);
    }

    /**
     * Get Order-wise Direct Income summaries for authenticated sponsor.
     * Supports pagination, search (invoice or customer), and status filtering.
     *
     * GET /api/user/income/direct-orders
     */
    public function getOrderDirectIncomeSummaries(Request $request)
    {
        $user = $this->resolveAuthenticatedUser($request);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Please log in to view Direct Income summaries.',
            ], 401);
        }

        $query = DirectIncomeOrderSummary::where('user_id', $user->id)
            ->orderBy('last_distribution_at', 'desc')
            ->orderBy('id', 'desc');

        // Status filter
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $status = strtolower(trim((string) $request->input('status')));
            $query->where('distribution_status', $status);
        }

        // Search by invoice number or customer name/code
        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('source_user_code', 'like', "%{$search}%")
                  ->orWhere('source_user_name', 'like', "%{$search}%")
                  ->orWhere('item_name', 'like', "%{$search}%");
            });
        }

        // Top-level summary aggregates across ALL orders for this user (not just current page)
        $allSummaries = DirectIncomeOrderSummary::where('user_id', $user->id)->get();
        $totalOrders = $allSummaries->count();
        $totalExpected = (float) round($allSummaries->sum('total_expected_amount'), 2);
        $totalDistributed = (float) round($allSummaries->sum('total_distributed_amount'), 2);
        $totalPending = (float) round($allSummaries->sum('total_pending_amount'), 2);
        $totalDump = (float) round($allSummaries->sum('total_dump_amount'), 2);

        // Pagination
        $perPage = max(1, min(50, (int) ($request->input('per_page') ?? 10)));
        $paginated = $query->paginate($perPage);

        $mappedOrders = collect($paginated->items())->map(function ($s) {
            return [
                'id' => $s->id,
                'order_id' => $s->order_id,
                'orderId' => $s->order_id,
                'invoice_number' => $s->invoice_number,
                'invoiceNumber' => $s->invoice_number,
                'order_date' => $s->order?->date ? (string) $s->order->date : ($s->created_at ? $s->created_at->format('Y-m-d') : null),
                'orderDate' => $s->order?->date ? (string) $s->order->date : ($s->created_at ? $s->created_at->format('Y-m-d') : null),
                'item_name' => $s->item_name,
                'itemName' => $s->item_name,
                'item_type' => $s->order?->item_type ?? 'service',
                'itemType' => $s->order?->item_type ?? 'service',
                'category' => $s->order?->category ?? 'General',
                'source_user_code' => $s->source_user_code,
                'sourceUserCode' => $s->source_user_code,
                'source_user_name' => $s->source_user_name,
                'sourceUserName' => $s->source_user_name,
                'order_gross_amount' => (float) $s->order_gross_amount,
                'orderGrossAmount' => (float) $s->order_gross_amount,
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
                'created_at' => $s->created_at?->toIso8601String(),
                'updated_at' => $s->updated_at?->toIso8601String(),
            ];
        });

        $totalDistributionsCount = (int) $allSummaries->sum('distribution_count');
        $completionPercentage = $totalExpected > 0 ? round(($totalDistributed / $totalExpected) * 100, 1) : 0.0;

        $summaryData = [
            'total_orders' => $totalOrders,
            'totalOrders' => $totalOrders,
            'total_expected_direct_income' => $totalExpected,
            'totalExpectedDirectIncome' => $totalExpected,
            'total_expected_income' => $totalExpected,
            'total_received_direct_income' => $totalDistributed,
            'totalReceivedDirectIncome' => $totalDistributed,
            'total_received_income' => $totalDistributed,
            'total_pending_direct_income' => $totalPending,
            'totalPendingDirectIncome' => $totalPending,
            'total_pending_income' => $totalPending,
            'total_dump_direct_income' => $totalDump,
            'totalDumpDirectIncome' => $totalDump,
            'total_dump_income' => $totalDump,
            'total_distributions_count' => $totalDistributionsCount,
            'totalDistributionsCount' => $totalDistributionsCount,
            'completion_percentage' => $completionPercentage,
            'completionPercentage' => $completionPercentage,
        ];

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'user_code' => $user->user_code,
                'name' => $user->name,
            ],
            'summary' => $summaryData,
            'summary_metrics' => $summaryData,
            'orders' => $mappedOrders,
            'data' => $mappedOrders,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ], 200);
    }

    /**
     * Get detailed installment-wise Direct Income distributions and Dump records
     * for a specific Order. Scoped strictly to the authenticated eligible sponsor.
     *
     * GET /api/user/income/direct-orders/{orderId}
     */
    public function getOrderDirectIncomeDetails(Request $request, $orderId)
    {
        $user = $this->resolveAuthenticatedUser($request);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Please log in to view order Direct Income details.',
            ], 401);
        }

        // 1. Resolve Order
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

        // 2. Strict Authorization Enforcement:
        // Authenticated user MUST be the eligible sponsor for this order
        $customer = $order->customer_user_code ? User::where('user_code', $order->customer_user_code)->first() : null;
        $sponsorCode = $customer ? $customer->sponsor_id : $order->sponsor;

        $isEligible = ($user->user_code && strcasecmp(trim($user->user_code), trim((string) $sponsorCode)) === 0)
            || ($order->directIncomeSummary && (int) $order->directIncomeSummary->user_id === (int) $user->id);

        if (!$isEligible) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. You are not eligible to view Direct Income details for this order.',
            ], 403);
        }

        // 3. Resolve or sync summary
        $summary = $order->directIncomeSummary;
        if (!$summary) {
            $summary = app(\App\Services\AdminIncomeAllocationService::class)->syncOrderDirectIncomeSummary($order);
        }

        // 4. Completed Distributions (Installment-wise ledger entries from sale_payments)
        $completedPayments = $order->payments()
            ->whereIn('income_distribution_status', ['completed', 'legacy_completed'])
            ->where('direct_income_amount', '>', 0)
            ->orderBy('id', 'asc')
            ->get();

        $distributions = $completedPayments->map(function ($p, $idx) use ($order) {
            $paymentTypeLabel = match ($p->payment_type) {
                'advance' => 'Initial Advance Payment',
                'full' => 'Full Payment Receipt',
                'balance' => 'Balance Installment #' . ($idx + 1),
                default => ucfirst($p->payment_type ?: 'Installment'),
            };

            return [
                'id' => $p->id,
                'payment_id' => $p->id,
                'paymentId' => $p->id,
                'installment_number' => $idx + 1,
                'installmentNumber' => $idx + 1,
                'installment_type' => $p->payment_type,
                'installmentType' => $p->payment_type,
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
                'direct_income_amount' => (float) $p->direct_income_amount,
                'directIncomeAmount' => (float) $p->direct_income_amount,
                'distribution_status' => $p->income_distribution_status,
                'distributionStatus' => $p->income_distribution_status,
                'distributed_at' => $p->income_distributed_at ? (string) $p->income_distributed_at : null,
                'distributedAt' => $p->income_distributed_at ? (string) $p->income_distributed_at : null,
            ];
        });

        // 5. Pending Payments (Received cash awaiting Admin allocation)
        $pendingPayments = $order->payments()
            ->where('income_distribution_status', 'pending')
            ->where('admin_commission_cut', '>', 0)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'payment_id' => $p->id,
                    'paymentId' => $p->id,
                    'payment_type' => $p->payment_type,
                    'reference_no' => $p->reference_no,
                    'amount' => (float) $p->amount,
                    'admin_commission_cut' => (float) $p->admin_commission_cut,
                    'status' => 'pending_admin_distribution',
                    'payment_date' => $p->payment_date ? (string) $p->payment_date : null,
                ];
            });

        // 6. Approved Dump Records
        $approvedDumps = $order->dumpRequests()
            ->where('status', 'approved')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($d) use ($order) {
                $rate = (float) ($d->admin_commission_percent ?? $order->admin_commission_percent ?? 15.0);
                $cut = (float) ($d->admin_commission_cut ?? round(((float) $d->dump_amount * $rate) / 100, 2));
                $direct = (float) ($d->direct_income_amount > 0 ? $d->direct_income_amount : round($cut * 0.40, 2));

                return [
                    'id' => $d->id,
                    'dump_id' => $d->id,
                    'dumpId' => $d->id,
                    'dump_amount' => (float) $d->dump_amount,
                    'dumpAmount' => (float) $d->dump_amount,
                    'admin_commission_cut' => $cut,
                    'adminCommissionCut' => $cut,
                    'direct_income_amount' => $direct,
                    'directIncomeAmount' => $direct,
                    'status' => 'approved',
                    'dump_reason' => $d->dump_reason,
                    'dumpReason' => $d->dump_reason,
                    'approved_at' => $d->approved_at ? (string) $d->approved_at : null,
                    'approvedAt' => $d->approved_at ? (string) $d->approved_at : null,
                ];
            });

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
                'item_type' => $order->item_type,
                'itemType' => $order->item_type,
                'category' => $order->category,
                'customer_name' => $order->customer_name,
                'customerName' => $order->customer_name,
                'customer_user_code' => $order->customer_user_code,
                'customerUserCode' => $order->customer_user_code,
                'order_gross_amount' => (float) ($summary?->order_gross_amount ?? $order->gross_amount),
                'orderGrossAmount' => (float) ($summary?->order_gross_amount ?? $order->gross_amount),
                'total_advance_received' => (float) ($order->advance_payment ?? 0),
                'totalAdvanceReceived' => (float) ($order->advance_payment ?? 0),
                'balance_due' => (float) ($order->balance_due ?? 0),
                'balanceDue' => (float) ($order->balance_due ?? 0),
                'admin_commission_percent' => (float) ($order->admin_commission_percent ?? 15.0),
                'adminCommissionPercent' => (float) ($order->admin_commission_percent ?? 15.0),
                'expected_direct_income' => (float) ($summary?->total_expected_amount ?? 0),
                'expectedDirectIncome' => (float) ($summary?->total_expected_amount ?? 0),
                'received_direct_income' => (float) ($summary?->total_distributed_amount ?? 0),
                'receivedDirectIncome' => (float) ($summary?->total_distributed_amount ?? 0),
                'pending_direct_income' => (float) ($summary?->total_pending_amount ?? 0),
                'pendingDirectIncome' => (float) ($summary?->total_pending_amount ?? 0),
                'dump_direct_income' => (float) ($summary?->total_dump_amount ?? 0),
                'dumpDirectIncome' => (float) ($summary?->total_dump_amount ?? 0),
                'distribution_count' => (int) ($summary?->distribution_count ?? $distributions->count()),
                'distributionCount' => (int) ($summary?->distribution_count ?? $distributions->count()),
                'distribution_status' => $summary?->distribution_status ?? 'pending',
                'distributionStatus' => $summary?->distribution_status ?? 'pending',
                'last_distribution_at' => $summary?->last_distribution_at?->toIso8601String(),
                'lastDistributionAt' => $summary?->last_distribution_at?->toIso8601String(),
            ],
            'summary' => [
                'expected_direct_income' => (float) ($summary?->total_expected_amount ?? 0),
                'received_direct_income' => (float) ($summary?->total_distributed_amount ?? 0),
                'pending_direct_income' => (float) ($summary?->total_pending_amount ?? 0),
                'dump_direct_income' => (float) ($summary?->total_dump_amount ?? 0),
                'distribution_count' => (int) ($summary?->distribution_count ?? $distributions->count()),
            ],
            'distributions' => $distributions,
            'pending_installments' => $pendingPayments,
            'dump_records' => $approvedDumps,
        ], 200);
    }
}
