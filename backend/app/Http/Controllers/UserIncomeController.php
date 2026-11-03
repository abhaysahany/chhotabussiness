<?php

namespace App\Http\Controllers;

use App\Models\DirectIncome;
use App\Models\LevelIncome;
use App\Models\User;
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
            'has_record' => $directIncomes->isNotEmpty(),
            'created_at' => $latestRecord?->created_at?->toIso8601String(),
            'updated_at' => $latestRecord?->updated_at?->toIso8601String(),
        ];

        $records = $directIncomes->map(function ($rec) use ($user) {
            return [
                'id' => $rec->id,
                'user_id' => $user->id,
                'userId' => $user->id,
                'member_id' => $rec->user_code ?: $user->user_code,
                'memberId' => $rec->user_code ?: $user->user_code,
                'user_name' => $user->name ?: 'Member',
                'userName' => $user->name ?: 'Member',
                'user_code' => $rec->user_code,
                'sponsor_id' => $rec->sponsor_id,
                'total_amount' => (float) $rec->total_amount,
                'totalAmount' => (float) $rec->total_amount,
                'paid_amount' => (float) $rec->paid_amount,
                'paidAmount' => (float) $rec->paid_amount,
                'balance_amount' => (float) $rec->balance_amount,
                'balanceAmount' => (float) $rec->balance_amount,
                'dump_amount' => (float) $rec->dump_amount,
                'dumpAmount' => (float) $rec->dump_amount,
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
            ? LevelIncome::where('user_code', $user->user_code)->orderBy('level', 'asc')->get()
            : collect([]);

        // Calculate cumulative totals across existing level records
        $totalAmount = (float) $records->sum('total_amount');
        $paidAmount = (float) $records->sum('paid_amount');
        $balanceAmount = max(0.0, round($totalAmount - $paidAmount, 2));
        $dumpAmount = (float) $records->sum('dump_amount');

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
            'levels_count' => $records->count(),
        ];

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
            'records' => $records,
        ], 200);
    }
}
