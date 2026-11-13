<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CommissionSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CommissionSettingController extends Controller
{
    /**
     * Verify caller is an authenticated, active Administrator.
     */
    protected function verifyAdminAccess(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (!$user || !($user instanceof Admin)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Active administrator credentials are required.',
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'status' => 'error',
                'message' => 'Your administrator account is inactive.',
            ], 403);
        }

        return null;
    }

    /**
     * Fetch the single active global Commission Settings configuration along with dynamic level schema metadata.
     *
     * GET /api/admin/commission-settings
     */
    public function index(Request $request): JsonResponse
    {
        if ($unauthorized = $this->verifyAdminAccess($request)) {
            return $unauthorized;
        }

        $levelColumns = CommissionSetting::getLevelColumns();
        $setting = CommissionSetting::getGlobalRecord();

        if (!$setting) {
            return response()->json([
                'status' => 'success',
                'exists' => false,
                'message' => 'No global Commission Settings record has been saved yet.',
                'data' => [
                    'id' => null,
                    'setting_key' => CommissionSetting::GLOBAL_SETTING_KEY,
                    'direct_percent' => null,
                    'reward_level_1_percent' => null,
                    'reward_level_2_percent' => null,
                    'reward_total_percent' => 0.0,
                    'reward_percent' => 0.0,
                    'diamond_conversion_rate' => (float) config('mlm.diamond_conversion_rate', 100.00),
                    'level_total_percent' => 0.0,
                    'total_percent' => 0.0,
                    'levels' => array_map(fn ($col) => [
                        'level' => $col['level'],
                        'key' => $col['key'],
                        'label' => $col['label'],
                        'percent' => null,
                    ], $levelColumns),
                    'level_percents_map' => [],
                    'updated_by_admin_id' => null,
                    'updated_by_admin_name' => null,
                    'updated_by_admin_email' => null,
                    'updated_at' => null,
                ],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'exists' => true,
            'data' => $setting->toNormalizedArray($levelColumns),
        ]);
    }

    /**
     * Save or update the single global Commission Settings configuration.
     * Validates individual percentages (0..100) and requires exact sum of 100.00%.
     *
     * POST/PUT /api/admin/commission-settings
     */
    public function save(Request $request): JsonResponse
    {
        if ($unauthorized = $this->verifyAdminAccess($request)) {
            return $unauthorized;
        }

        /** @var Admin $admin */
        $admin = $request->user();
        $levelColumns = CommissionSetting::getLevelColumns();

        if (empty($levelColumns)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No Level Income percentage columns were found in the commission_settings table.',
            ], 500);
        }

        $rules = [
            'direct_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'reward_level_1_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'reward_level_2_percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ];

        $messages = [
            'direct_percent.required' => 'Direct Income (%) is required.',
            'direct_percent.numeric' => 'Direct Income (%) must be a valid number.',
            'direct_percent.min' => 'Direct Income (%) cannot be negative.',
            'direct_percent.max' => 'Direct Income (%) cannot exceed 100%.',
            'reward_level_1_percent.required' => 'Reward Level 1 – Direct Sponsor (%) is required.',
            'reward_level_1_percent.numeric' => 'Reward Level 1 – Direct Sponsor (%) must be a valid number.',
            'reward_level_1_percent.min' => 'Reward Level 1 – Direct Sponsor (%) cannot be negative.',
            'reward_level_1_percent.max' => 'Reward Level 1 – Direct Sponsor (%) cannot exceed 100%.',
            'reward_level_2_percent.required' => 'Reward Level 2 – Sponsor\'s Sponsor (%) is required.',
            'reward_level_2_percent.numeric' => 'Reward Level 2 – Sponsor\'s Sponsor (%) must be a valid number.',
            'reward_level_2_percent.min' => 'Reward Level 2 – Sponsor\'s Sponsor (%) cannot be negative.',
            'reward_level_2_percent.max' => 'Reward Level 2 – Sponsor\'s Sponsor (%) cannot exceed 100%.',
        ];

        foreach ($levelColumns as $col) {
            $key = $col['key'];
            $label = $col['label'];
            $rules[$key] = ['required', 'numeric', 'min:0', 'max:100'];
            $messages["{$key}.required"] = "{$label} Income (%) is required.";
            $messages["{$key}.numeric"] = "{$label} Income (%) must be a valid number.";
            $messages["{$key}.min"] = "{$label} Income (%) cannot be negative.";
            $messages["{$key}.max"] = "{$label} Income (%) cannot exceed 100%.";
        }

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed for Commission Settings percentages.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $directPercent = round((float) $request->input('direct_percent'), 2);
        $rewardL1Percent = round((float) $request->input('reward_level_1_percent'), 2);
        $rewardL2Percent = round((float) $request->input('reward_level_2_percent'), 2);
        $rewardTotalPercent = round(($rewardL1Percent + $rewardL2Percent), 2);

        $savePayload = [
            'setting_key' => CommissionSetting::GLOBAL_SETTING_KEY,
            'direct_percent' => $directPercent,
            'reward_level_1_percent' => $rewardL1Percent,
            'reward_level_2_percent' => $rewardL2Percent,
            'reward_percent' => $rewardTotalPercent,
            'updated_by_admin_id' => $admin->id,
        ];

        $totalBasisPoints = (int) round($directPercent * 100)
            + (int) round($rewardL1Percent * 100)
            + (int) round($rewardL2Percent * 100);
        foreach ($levelColumns as $col) {
            $key = $col['key'];
            $lvlPct = round((float) $request->input($key), 2);
            $savePayload[$key] = $lvlPct;
            $totalBasisPoints += (int) round($lvlPct * 100);
        }

        if ($totalBasisPoints !== 10000) {
            $calculatedTotal = round($totalBasisPoints / 100, 2);
            $remaining = round((10000 - $totalBasisPoints) / 100, 2);

            return response()->json([
                'status' => 'error',
                'message' => "Total distribution must equal exactly 100%. Current total is {$calculatedTotal}% (remaining: {$remaining}%).",
                'errors' => [
                    'total_percent' => [
                        "Total distribution must equal exactly 100%. Current total is {$calculatedTotal}%.",
                    ],
                ],
                'total_percent' => $calculatedTotal,
                'remaining_percent' => $remaining,
            ], 422);
        }

        try {
            $setting = DB::transaction(function () use ($savePayload) {
                $existing = CommissionSetting::where('setting_key', CommissionSetting::GLOBAL_SETTING_KEY)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    $existing->update($savePayload);
                    return $existing->fresh(['updatedByAdmin']);
                }

                $created = CommissionSetting::create($savePayload);
                return $created->fresh(['updatedByAdmin']);
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Global Commission Settings updated successfully!',
                'data' => $setting->toNormalizedArray($levelColumns),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to save Global Commission Settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
