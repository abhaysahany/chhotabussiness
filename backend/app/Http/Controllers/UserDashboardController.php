<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\DirectIncome;
use App\Models\LevelIncome;
use App\Models\SalesRecord;
use App\Models\SalePayment;
use App\Models\UserPayout;
use App\Models\RewardClaim;
use App\Models\SupportTicket;
use Carbon\Carbon;

class UserDashboardController extends Controller
{
    /**
     * Get aggregated dynamic SaaS metrics and chart data for user dashboard strictly from MySQL Database.
     */
    public function getDashboardStats(Request $request)
    {
        // Resolve target user from authentication or parameter
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->bearerToken()) {
            if (class_exists(\Laravel\Sanctum\PersonalAccessToken::class)) {
                $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
                if ($token && $token->tokenable instanceof User) {
                    $user = $token->tokenable;
                }
            }
        }
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->input('user_id'));
        }
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated user session.',
            ], 401);
        }

        $userId = $user->id;
        $userCode = $user->user_code ?: '';

        // 1. Commission & Balance Stats from User Model in Database
        $commissionBalance = $user ? (float)$user->commission_balance : 0.00;
        $bpBalance = $user ? (float)($user->bp_balance ?: 0) : 0.00;
        
        // 2. Real Payouts Totals from `user_payouts` Database Table
        $totalPaidPayouts = 0.00;
        if ($userId || $userCode) {
            $totalPaidPayouts = (float) UserPayout::where(function ($q) use ($userId, $userCode) {
                if ($userId) $q->where('user_id', $userId);
                if ($userCode) $q->orWhere('user_code', $userCode);
            })->whereIn('status', ['completed', 'paid'])->sum('net_payable_amount');
        }

        $totalEarnings = $totalPaidPayouts + $commissionBalance;

        // 2b. Dynamic Direct & Level Incomes strictly from MySQL Income Tables
        $directIncomeTotal = 0.00;
        $todayDirectIncome = 0.00;
        $levelIncomeTotal = 0.00;
        $todayLevelIncome = 0.00;

        if ($user && !empty($userCode)) {
            $directIncomeTotal = (float) DirectIncome::where('user_code', $userCode)->sum('total_amount');
            $todayDirectIncome = (float) DirectIncome::where('user_code', $userCode)
                ->whereDate('created_at', Carbon::today())
                ->sum('total_amount');

            $levelIncomeTotal = (float) LevelIncome::where('user_code', $userCode)->sum('total_amount');
            $todayLevelIncome = (float) LevelIncome::where('user_code', $userCode)
                ->whereDate('created_at', Carbon::today())
                ->sum('total_amount');
        }

        $totalIncomeFromTables = round($directIncomeTotal + $levelIncomeTotal, 2);
        $todayIncomeFromTables = round($todayDirectIncome + $todayLevelIncome, 2);

        // 3. Team Network Numbers from `users` Database Table
        $directMembersCount = 0;
        $totalTeamCount = 0;
        $teamVolumeBv = (int) ($user ? ($user->group_pv ?: ($user->personal_pv ?: 0)) : 0);

        if ($user && $userCode) {
            $directMembersCount = User::where('sponsor_id', $userCode)
                ->orWhere('sponsor_id', $user->email)
                ->orWhere('sponsor_id', (string)$user->id)
                ->count();

            $totalTeamCount = $directMembersCount;
        }

        // 4. Rewards claimed from `reward_claims` Database Table
        $rewardsClaimedCount = 0;
        $rewardsClaimedValue = 0.00;
        if ($user) {
            $rewardsClaimedCount = RewardClaim::where('user_id', $user->id)->count();
            $rewardsClaimedValue = (float) RewardClaim::where('user_id', $user->id)->sum('points_deducted');
        }

        // 5. KYC Status
        $kycStatus = $user ? ($user->kyc_status ?: 'unverified') : 'unverified';

        // 6. Dynamic Multi-Period Revenue Chart strictly from MySQL Income Tables
        $period = $request->query('period', '7d');
        $revenueCategories = [];
        $directSeries = [];
        $levelSeries = [];

        if ($period === '6m' || $period === '1y') {
            for ($i = 5; $i >= 0; $i--) {
                $m = Carbon::now()->subMonths($i);
                $revenueCategories[] = $m->format('M Y');
                $mStart = $m->copy()->startOfMonth();
                $mEnd = $m->copy()->endOfMonth();
                $dVal = 0.0;
                $lVal = 0.0;
                if ($userCode) {
                    $dVal = (float) DirectIncome::where('user_code', $userCode)->whereBetween('created_at', [$mStart, $mEnd])->sum('total_amount');
                    $lVal = (float) LevelIncome::where('user_code', $userCode)->whereBetween('created_at', [$mStart, $mEnd])->sum('total_amount');
                }
                $directSeries[] = round($dVal, 2);
                $levelSeries[] = round($lVal, 2);
            }
        } elseif ($period === '30d') {
            $revenueCategories = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            for ($w = 3; $w >= 0; $w--) {
                $wStart = Carbon::now()->subWeeks($w)->startOfWeek();
                $wEnd = Carbon::now()->subWeeks($w)->endOfWeek();
                $dVal = 0.0;
                $lVal = 0.0;
                if ($userCode) {
                    $dVal = (float) DirectIncome::where('user_code', $userCode)->whereBetween('created_at', [$wStart, $wEnd])->sum('total_amount');
                    $lVal = (float) LevelIncome::where('user_code', $userCode)->whereBetween('created_at', [$wStart, $wEnd])->sum('total_amount');
                }
                $directSeries[] = round($dVal, 2);
                $levelSeries[] = round($lVal, 2);
            }
        } else {
            for ($d = 6; $d >= 0; $d--) {
                $day = Carbon::now()->subDays($d);
                $revenueCategories[] = $day->format('D');
                $dStart = $day->copy()->startOfDay();
                $dEnd = $day->copy()->endOfDay();
                $dVal = 0.0;
                $lVal = 0.0;
                if ($userCode) {
                    $dVal = (float) DirectIncome::where('user_code', $userCode)->whereBetween('created_at', [$dStart, $dEnd])->sum('total_amount');
                    $lVal = (float) LevelIncome::where('user_code', $userCode)->whereBetween('created_at', [$dStart, $dEnd])->sum('total_amount');
                }
                $directSeries[] = round($dVal, 2);
                $levelSeries[] = round($lVal, 2);
            }
        }

        $revenueChart = [
            'categories' => $revenueCategories,
            'series' => [
                ['name' => 'Direct Referral Bonus', 'data' => $directSeries],
                ['name' => 'Binary Team Commissions', 'data' => $levelSeries],
            ],
        ];

        // 7. Dynamic Commission Breakdown Donut Chart strictly from User's Actual Earnings
        $sumIncomeSources = $directIncomeTotal + $levelIncomeTotal + $rewardsClaimedValue;
        if ($sumIncomeSources > 0) {
            $directPct = round(($directIncomeTotal / $sumIncomeSources) * 100, 1);
            $levelPct = round(($levelIncomeTotal / $sumIncomeSources) * 100, 1);
            $rewardPct = round(($rewardsClaimedValue / $sumIncomeSources) * 100, 1);
            $otherPct = max(0, round(100 - $directPct - $levelPct - $rewardPct, 1));
            $commissionDistribution = [
                'labels' => ['Direct Bonus', 'Team Match', 'Leadership Bonus', 'Rewards'],
                'series' => [$directPct, $levelPct, $otherPct, $rewardPct],
                'amounts' => [$directIncomeTotal, $levelIncomeTotal, 0.00, $rewardsClaimedValue],
            ];
        } else {
            $commissionDistribution = [
                'labels' => ['Direct Bonus', 'Team Match', 'Leadership Bonus', 'Rewards'],
                'series' => [0, 0, 0, 0],
                'amounts' => [0.00, 0.00, 0.00, 0.00],
            ];
        }

        // 8. Dynamic Network Growth Sparkline
        $sparklineCategories = [];
        $sparklineData = [];
        for ($d = 6; $d >= 0; $d--) {
            $day = Carbon::now()->subDays($d);
            $sparklineCategories[] = $day->format('D');
            $dStart = $day->copy()->startOfDay();
            $dEnd = $day->copy()->endOfDay();
            $cnt = 0;
            if ($user && $userCode) {
                $cnt = User::where(function ($q) use ($user, $userCode) {
                    $q->where('sponsor_id', $userCode)->orWhere('sponsor_id', $user->email);
                })->whereBetween('created_at', [$dStart, $dEnd])->count();
            }
            $sparklineData[] = $cnt;
        }

        $networkSparklines = [
            'categories' => $sparklineCategories,
            'data' => $sparklineData,
        ];

        // 9. Real Transactions from Database
        $payoutsQuery = UserPayout::query();
        if ($userId || $userCode) {
            $payoutsQuery->where(function ($q) use ($userId, $userCode) {
                if ($userId) $q->where('user_id', $userId);
                if ($userCode) $q->orWhere('user_code', $userCode);
            });
        }
        $dbPayouts = $payoutsQuery->orderBy('id', 'desc')->take(5)->get();

        if ($dbPayouts->isNotEmpty()) {
            $recentTransactions = $dbPayouts->map(function ($p) {
                return [
                    'id' => $p->payout_code ?: ('TXN-' . $p->id),
                    'title' => 'Affiliate Commission Payout',
                    'date' => $p->created_at ? Carbon::parse($p->created_at)->format('d M Y, h:i A') : Carbon::now()->format('d M Y, h:i A'),
                    'amount' => (float)$p->net_payable_amount,
                    'type' => 'credit',
                    'status' => $p->status === 'paid' ? 'completed' : $p->status,
                    'method' => $p->payment_method ?: 'IMPS Instant',
                    'utr' => $p->utr_number ?: '',
                    'icon' => 'bank',
                ];
            })->values()->all();
        } else {
            $recentTransactions = [];
        }

        // 10. Real-time Activity Feed from database events
        $activityFeed = [];
        if ($userCode) {
            $recentDirects = DirectIncome::where('user_code', $userCode)->latest()->take(3)->get();
            foreach ($recentDirects as $rd) {
                $activityFeed[] = [
                    'id' => 'di_' . $rd->id,
                    'title' => 'Direct Referral Income',
                    'desc' => 'Earned ₹' . number_format($rd->total_amount, 2) . ' from member referral ' . ($rd->from_user_code ?: '') . '.',
                    'time' => $rd->created_at ? Carbon::parse($rd->created_at)->diffForHumans() : 'Recently',
                    'type' => 'income',
                ];
            }
            $recentLevels = LevelIncome::where('user_code', $userCode)->latest()->take(3)->get();
            foreach ($recentLevels as $rl) {
                $activityFeed[] = [
                    'id' => 'li_' . $rl->id,
                    'title' => 'Level ' . ($rl->level ?: 'Team') . ' Commission',
                    'desc' => 'Earned ₹' . number_format($rl->total_amount, 2) . ' team volume match from ' . ($rl->from_user_code ?: '') . '.',
                    'time' => $rl->created_at ? Carbon::parse($rl->created_at)->diffForHumans() : 'Recently',
                    'type' => 'income',
                ];
            }
        }

        // 11. Real Leaderboard from Database Users Table
        $dbUsers = User::where('commission_balance', '>', 0)->orderBy('commission_balance', 'desc')->take(4)->get();
        if ($dbUsers->isNotEmpty()) {
            $colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899'];
            $leaderboard = $dbUsers->map(function ($u, $idx) use ($colors) {
                return [
                    'name' => $u->name ?: 'Leader ' . ($idx + 1),
                    'code' => $u->user_code ?: ('CB' . (100010 + $idx)),
                    'rank' => $u->rank ?: 'Member',
                    'volumeBv' => (int) ($u->group_pv ?: ($u->personal_pv ?: 0)),
                    'avatar' => $u->name ? collect(explode(' ', $u->name))->map(fn($n) => $n[0] ?? '')->take(2)->join('') : 'CB',
                    'color' => $colors[$idx % count($colors)],
                ];
            })->values()->all();
        } else {
            $leaderboard = [];
        }

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user ? $user->name : '',
                'email' => $user ? $user->email : '',
                'userCode' => $userCode,
                'rank' => $user ? ($user->rank ?: 'Member') : 'Member',
                'kycStatus' => $kycStatus,
                'sponsor' => $user ? ($user->sponsor_id ?: 'Root System') : 'Root System',
                'avatar' => $user ? $user->avatar : null,
            ],
            'kpis' => [
                'totalEarnings' => $totalEarnings,
                'commissionBalance' => $commissionBalance,
                'teamVolumeBv' => $teamVolumeBv,
                'directMembers' => $directMembersCount,
                'totalTeamMembers' => $totalTeamCount,
                'bpBalance' => $bpBalance,
                'rewardsClaimedValue' => $rewardsClaimedValue,
                'rewardsClaimedCount' => $rewardsClaimedCount,
                'todayIncome' => $todayIncomeFromTables,
                'totalIncome' => $totalIncomeFromTables,
                'directIncome' => $directIncomeTotal,
                'levelIncome' => $levelIncomeTotal,
                'todayDirectIncome' => $todayDirectIncome,
                'todayLevelIncome' => $todayLevelIncome,
                'nextRankProgress' => 0,
                'nextRankTargetBv' => 0,
                'nextRankCurrentBv' => 0,
                'nextRankName' => 'Standard Member',
            ],
            'incomeStats' => [
                'todayIncome' => $todayIncomeFromTables,
                'totalIncome' => $totalIncomeFromTables,
                'directIncome' => $directIncomeTotal,
                'levelIncome' => $levelIncomeTotal,
                'todayDirectIncome' => $todayDirectIncome,
                'todayLevelIncome' => $todayLevelIncome,
            ],
            'charts' => [
                'revenue' => $revenueChart,
                'distribution' => $commissionDistribution,
                'network' => $networkSparklines,
            ],
            'recentTransactions' => $recentTransactions,
            'activityFeed' => $activityFeed,
            'leaderboard' => $leaderboard,
        ]);
    }
}