<?php

namespace App\Http\Controllers;

use App\Models\CommissionSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class NetworkController extends Controller
{
    /**
     * Map Rank to CSS Badge Class
     */
    private function getRankBadgeClass($rank)
    {
        $r = strtolower($rank ?? '');
        if (str_contains($r, 'crown')) return 'badge-crown';
        if (str_contains($r, 'diamond')) return 'badge-diamond';
        if (str_contains($r, 'platinum')) return 'badge-platinum';
        if (str_contains($r, 'gold')) return 'badge-gold';
        if (str_contains($r, 'silver')) return 'badge-silver';
        return 'badge-bronze';
    }

    /**
     * Level Commission Percentages resolved dynamically from database CommissionSetting
     */
    private function getLevelCommissionPct($level)
    {
        $setting = CommissionSetting::getGlobalRecord();
        if (!$setting) {
            return '0%';
        }
        $key = 'level_' . (int) $level . '_percent';
        $pct = (float) ($setting->{$key} ?? 0);
        return (round($pct, 2) == round($pct, 0) ? (int) $pct : round($pct, 2)) . '%';
    }

    /**
     * Format number in Indian Currency Format (Lakhs & Crores)
     */
    private function formatIndianCurrency($num)
    {
        $num = (float)$num;
        $isNegative = $num < 0;
        $num = abs($num);

        $exploded = explode('.', (string)round($num, 2));
        $integerPart = $exploded[0];

        if (strlen($integerPart) > 3) {
            $lastThree = substr($integerPart, -3);
            $remaining = substr($integerPart, 0, -3);
            $formattedRemaining = preg_replace("/\B(?=(\d{2})+(?!\d))/", ",", $remaining);
            $result = $formattedRemaining . ',' . $lastThree;
        } else {
            $result = $integerPart;
        }

        return ($isNegative ? '-' : '') . '₹' . $result;
    }

    /**
     * Resolve target user from request or authentication
     */
    private function resolveUser(Request $request)
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        if ($authUser) {
            return $authUser;
        }

        $userCode = $request->input('user_code') ?? $request->input('userCode');
        if ($userCode) {
            return User::whereRaw('LOWER(user_code) = ?', [strtolower($userCode)])
                ->orWhere('id', $userCode)
                ->orWhere('email', $userCode)
                ->first();
        }

        return null;
    }

    /**
     * GET /api/user/network/direct
     * Fetch Level 1 Direct Connections from MySQL Database
     */
    public function getDirectConnections(Request $request)
    {
        $user = $this->resolveUser($request);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }

        // Query direct downlines from users table
        $directs = User::where(function ($q) use ($user) {
            $q->where('sponsor_id', $user->user_code)
              ->orWhere('sponsor_id', (string)$user->id);
            if ($user->user_code) {
                $q->orWhereRaw('LOWER(sponsor_id) = ?', [strtolower($user->user_code)]);
            }
        })->orderBy('id', 'desc')->get();

        $directMembers = $directs->map(function ($m) {
            $level2Count = User::where('sponsor_id', $m->user_code)->count();
            return [
                'id' => $m->user_code ?? ('CB' . (100000 + $m->id)),
                'db_id' => $m->id,
                'name' => $m->name,
                'avatar' => $m->avatar ?: null,
                'email' => $m->email,
                'phone' => $m->phone ?: null,
                'joiningDate' => $m->created_at ? $m->created_at->format('Y-m-d') : null,
                'rank' => $m->rank ?: 'Member',
                'rankBadgeClass' => $this->getRankBadgeClass($m->rank),
                'personalPv' => (int) ($m->personal_pv ?? 0),
                'personalBv' => (int) ($m->personal_pv ?? 0),
                'groupPv' => (int) ($m->group_pv ?? 0),
                'groupBv' => (int) ($m->group_pv ?? 0),
                'teamTurnover' => $this->formatIndianCurrency((float) ($m->group_pv ?? 0)),
                'level2Count' => $level2Count,
                'level1Bonus' => $this->formatIndianCurrency((float) ($m->commission_balance ?? 0)),
                'status' => $m->status ?: 'active',
                'kycVerified' => $m->kyc_status === 'verified',
                'location' => $m->location ?: null,
            ];
        });

        // Compute summary metrics from MySQL
        $totalDirectCount = $directMembers->count();
        $activeCount = $directMembers->where('status', 'active')->count();
        $totalPv = $directs->sum('personal_pv');
        $totalBv = $totalPv;
        $totalTurnover = $directs->sum('group_pv');
        $totalBonus = $directs->sum('commission_balance');

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'user_code' => $user->user_code,
                'rank' => $user->rank ?: 'Member',
            ],
            'directMembers' => $directMembers,
            'stats' => [
                'totalDirectCount' => $totalDirectCount,
                'activeCount' => $activeCount,
                'inactiveCount' => $totalDirectCount - $activeCount,
                'totalPv' => $totalPv,
                'totalBv' => $totalBv,
                'totalTurnoverFormatted' => $this->formatIndianCurrency($totalTurnover),
                'totalBonusFormatted' => $this->formatIndianCurrency($totalBonus),
            ],
        ]);
    }

    /**
     * GET /api/user/network/team
     * Fetch 10-Level Team Connections from MySQL Database
     */
    public function getTeamConnections(Request $request)
    {
        $user = $this->resolveUser($request);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }

        $allTeamMembers = [];
        $levelStats = [];
        $currentParentCodes = [$user->user_code];
        $parentMap = [
            $user->user_code => [
                'name' => $user->name . ' (You)',
                'code' => $user->user_code,
            ],
        ];

        // 10-Level traversal from MySQL users table
        for ($level = 1; $level <= 10; $level++) {
            if (empty($currentParentCodes)) {
                $levelStats[$level] = [
                    'level' => $level,
                    'count' => 0,
                    'activeCount' => 0,
                    'commissionRate' => $this->getLevelCommissionPct($level),
                    'totalPv' => 0,
                    'totalGroupPv' => 0,
                ];
                continue;
            }

            $members = User::whereIn('sponsor_id', $currentParentCodes)->get();

            $nextParentCodes = [];
            $levelPv = 0;
            $levelGroupPv = 0;
            $levelActive = 0;

            foreach ($members as $m) {
                $nextParentCodes[] = $m->user_code;
                $parentInfo = $parentMap[$m->sponsor_id] ?? ['name' => $m->sponsor_id, 'code' => $m->sponsor_id];
                $parentMap[$m->user_code] = ['name' => $m->name, 'code' => $m->user_code];

                $downlineCount = User::where('sponsor_id', $m->user_code)->count();
                $isAct = ($m->status ?: 'active') === 'active';
                if ($isAct) $levelActive++;

                $levelPv += (int) ($m->personal_pv ?? 0);
                $levelGroupPv += (int) ($m->group_pv ?? 0);

                $allTeamMembers[] = [
                    'id' => $m->user_code ?? ('CB' . (100000 + $m->id)),
                    'db_id' => $m->id,
                    'name' => $m->name,
                    'avatar' => $m->avatar ?: null,
                    'level' => $level,
                    'levelCommissionPct' => $this->getLevelCommissionPct($level),
                    'sponsorId' => $m->sponsor_id ?: $user->user_code,
                    'sponsorName' => $parentInfo['name'],
                    'rank' => $m->rank ?: 'Member',
                    'rankBadgeClass' => $this->getRankBadgeClass($m->rank),
                    'personalPv' => (int) ($m->personal_pv ?? 0),
                    'personalBv' => (int) ($m->personal_pv ?? 0),
                    'groupPv' => (int) ($m->group_pv ?? 0),
                    'groupBv' => (int) ($m->group_pv ?? 0),
                    'groupBvFormatted' => $this->formatIndianCurrency((float) ($m->group_pv ?? 0)),
                    'downlineCount' => $downlineCount,
                    'status' => $m->status ?: 'active',
                    'joiningDate' => $m->created_at ? $m->created_at->format('Y-m-d') : null,
                    'email' => $m->email,
                    'phone' => $m->phone ?: null,
                    'location' => $m->location ?: null,
                ];
            }

            $levelStats[$level] = [
                'level' => $level,
                'count' => $members->count(),
                'activeCount' => $levelActive,
                'commissionRate' => $this->getLevelCommissionPct($level),
                'totalPv' => $levelPv,
                'totalBv' => $levelPv,
                'totalGroupPv' => $levelGroupPv,
                'totalGroupBv' => $levelGroupPv,
                'totalGroupBvFormatted' => $this->formatIndianCurrency($levelGroupPv),
            ];

            $currentParentCodes = array_unique($nextParentCodes);
        }

        $totalTeamCount = count($allTeamMembers);
        $totalActiveCount = collect($allTeamMembers)->where('status', 'active')->count();
        $totalGroupVolume = collect($allTeamMembers)->sum('groupPv');

        return response()->json([
            'status' => 'success',
            'user' => [
                'name' => $user->name,
                'user_code' => $user->user_code,
                'rank' => $user->rank ?: 'Member',
            ],
            'teamMembers' => $allTeamMembers,
            'levelStats' => array_values($levelStats),
            'summary' => [
                'totalTeamCount' => $totalTeamCount,
                'activeCount' => $totalActiveCount,
                'inactiveCount' => $totalTeamCount - $totalActiveCount,
                'totalGroupVolume' => $totalGroupVolume,
                'totalGroupVolumeFormatted' => $this->formatIndianCurrency($totalGroupVolume),
            ],
        ]);
    }

    /**
     * Recursive builder for Genealogy Tree nodes
     */
    private function buildTreeNode($user, $level, $maxDepth, $parentName = 'System Root')
    {
        $node = [
            'id' => $user->user_code ?? ('CB' . (100000 + $user->id)),
            'db_id' => $user->id,
            'name' => $user->name,
            'rank' => $user->rank ?: 'Member',
            'rankClass' => $this->getRankBadgeClass($user->rank),
            'level' => $level,
            'overridePct' => $level === 0 ? 'N/A (Root)' : $this->getLevelCommissionPct($level),
            'avatar' => $user->avatar ?: null,
            'personalPv' => (int) ($user->personal_pv ?? 0),
            'personalBv' => (int) ($user->personal_pv ?? 0),
            'groupPv' => (int) ($user->group_pv ?? 0),
            'groupBv' => (int) ($user->group_pv ?? 0),
            'groupBvFormatted' => $this->formatIndianCurrency((float) ($user->group_pv ?? 0)),
            'status' => $user->status ?: 'active',
            'joiningDate' => $user->created_at ? $user->created_at->format('Y-m-d') : null,
            'sponsor' => $parentName,
            'children' => [],
        ];

        $childrenUsers = User::where(function ($q) use ($user) {
            $q->where('sponsor_id', $user->user_code)
              ->orWhere('sponsor_id', (string)$user->id);
            if ($user->user_code) {
                $q->orWhereRaw('LOWER(sponsor_id) = ?', [strtolower($user->user_code)]);
            }
        })->get();

        $node['directsCount'] = $childrenUsers->count();

        if ($level < $maxDepth) {
            foreach ($childrenUsers as $child) {
                $node['children'][] = $this->buildTreeNode($child, $level + 1, $maxDepth, "{$user->name} ({$user->user_code})");
            }
        }

        return $node;
    }

    /**
     * GET /api/user/network/genealogy
     * Fetch Nested 10-Level Genealogy Tree from MySQL Database
     */
    public function getGenealogyTree(Request $request)
    {
        $user = $this->resolveUser($request);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }

        $depth = (int)$request->input('depth', 10);
        if ($depth < 1 || $depth > 10) $depth = 10;

        $treeData = $this->buildTreeNode($user, 0, $depth, $user->sponsor_id ?: 'Platform Root');

        // Count total nodes recursively in tree
        $countNodes = function ($n) use (&$countNodes) {
            $c = 1;
            if (!empty($n['children'])) {
                foreach ($n['children'] as $child) {
                    $c += $countNodes($child);
                }
            }
            return $c;
        };

        $totalTeamCount = $countNodes($treeData) - 1; // Exclude root user

        return response()->json([
            'status' => 'success',
            'tree' => $treeData,
            'treeData' => $treeData,
            'stats' => [
                'totalTeamCount' => $totalTeamCount,
                'directCount' => count($treeData['children']),
                'maxDepth' => $depth,
            ],
        ]);
    }
}
