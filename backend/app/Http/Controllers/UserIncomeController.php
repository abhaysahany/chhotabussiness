<?php

namespace App\Http\Controllers;

use App\Models\DirectIncomeAccount;
use App\Models\LevelIncomeAccount;
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

        // Always query exclusively by the authenticated user's ID
        $account = DirectIncomeAccount::where('user_id', $user->id)->first();

        $totalAmount = (float) ($account?->total_amount ?? 0.0);
        $paidAmount = (float) ($account?->paid_amount ?? 0.0);
        $balanceAmount = max(0.0, round($totalAmount - $paidAmount, 2));
        $dumpAmount = (float) ($account?->dump_amount ?? 0.0);

        $summary = [
            'id' => $account?->id,
            'user_id' => $user->id,
            'userId' => $user->id,
            'member_id' => $account?->member_id ?: ($user->user_code ?: "USR-{$user->id}"),
            'memberId' => $account?->member_id ?: ($user->user_code ?: "USR-{$user->id}"),
            'user_name' => $account?->user_name ?: ($user->name ?: 'Member'),
            'userName' => $account?->user_name ?: ($user->name ?: 'Member'),
            'total_amount' => $totalAmount,
            'totalAmount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'paidAmount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'balanceAmount' => $balanceAmount,
            'dump_amount' => $dumpAmount,
            'dumpAmount' => $dumpAmount,
            'has_record' => (bool) $account,
            'created_at' => $account?->created_at?->toIso8601String(),
            'updated_at' => $account?->updated_at?->toIso8601String(),
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
            'records' => $account ? [$account] : [],
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

        // Always query exclusively by the authenticated user's ID
        $records = LevelIncomeAccount::where('user_id', $user->id)
            ->orderBy('level_number', 'asc')
            ->get();

        // Calculate cumulative totals across existing level accounts
        $totalAmount = (float) $records->sum('total_amount');
        $paidAmount = (float) $records->sum('paid_amount');
        $balanceAmount = max(0.0, round($totalAmount - $paidAmount, 2));
        $dumpAmount = (float) $records->sum('dump_amount');

        $recordsByLevel = $records->keyBy('level_number');

        // Build Level 2, 3, 4, 5 structure
        $levelsBreakdown = [];
        foreach ([2, 3, 4, 5] as $levelNum) {
            $levelRecord = $recordsByLevel->get($levelNum);
            $lvlTotal = (float) ($levelRecord?->total_amount ?? 0.0);
            $lvlPaid = (float) ($levelRecord?->paid_amount ?? 0.0);
            $lvlBalance = max(0.0, round($lvlTotal - $lvlPaid, 2));
            $lvlDump = (float) ($levelRecord?->dump_amount ?? 0.0);

            $levelsBreakdown[] = [
                'id' => $levelRecord?->id,
                'user_id' => $user->id,
                'userId' => $user->id,
                'member_id' => $levelRecord?->member_id ?: ($user->user_code ?: "USR-{$user->id}"),
                'memberId' => $levelRecord?->member_id ?: ($user->user_code ?: "USR-{$user->id}"),
                'user_name' => $levelRecord?->user_name ?: ($user->name ?: 'Member'),
                'userName' => $levelRecord?->user_name ?: ($user->name ?: 'Member'),
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
                'has_record' => (bool) $levelRecord,
                'created_at' => $levelRecord?->created_at?->toIso8601String(),
                'updated_at' => $levelRecord?->updated_at?->toIso8601String(),
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
