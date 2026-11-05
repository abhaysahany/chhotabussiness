<?php

namespace App\Http\Controllers;

use App\Models\DirectIncome;
use App\Models\LevelIncome;
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

        // Build Level 2, 3, 4, 5 structure
        $levelsBreakdown = [];
        foreach ([2, 3, 4, 5] as $levelNum) {
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
}
