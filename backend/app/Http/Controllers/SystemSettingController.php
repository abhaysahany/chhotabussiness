<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SystemSettingController extends Controller
{
    /**
     * Public endpoint to get application branding configuration
     */
    public function getBranding()
    {
        $appName = SystemSetting::get('app_name', config('app.name', 'AddNet'));

        return response()->json([
            'status' => 'success',
            'app_name' => $appName ?: 'AddNet',
            'branding' => [
                'app_name' => $appName ?: 'AddNet',
            ],
        ], 200);
    }

    /**
     * Protected Admin endpoint to save/update application branding configuration
     */
    public function saveBranding(Request $request)
    {
        $user = $request->user();

        // 1. Verify Active Administrator Access
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

        // 2. Validate Application Name
        $validator = Validator::make($request->all(), [
            'app_name' => 'required|string|min:2|max:50',
        ], [
            'app_name.required' => 'The application name is required.',
            'app_name.string' => 'The application name must be a valid text string.',
            'app_name.min' => 'The application name must be at least 2 characters.',
            'app_name.max' => 'The application name must not exceed 50 characters.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $appName = trim($request->input('app_name'));
        if (empty($appName)) {
            return response()->json([
                'status' => 'error',
                'message' => 'The application name cannot be empty or whitespace only.',
                'errors' => [
                    'app_name' => ['The application name cannot be empty.'],
                ],
            ], 422);
        }

        // 3. Persist setting globally in system_settings database table
        SystemSetting::set('app_name', $appName, 'branding');

        return response()->json([
            'status' => 'success',
            'message' => 'Application branding updated successfully!',
            'app_name' => $appName,
            'branding' => [
                'app_name' => $appName,
            ],
        ], 200);
    }
    /**
     * Get all system settings or grouped settings
     */
    public function getSettings(Request $request)
    {
        $group = $request->query('group');
        $query = SystemSetting::query();
        if ($group) {
            $query->where('group', $group);
        }
        $settings = $query->get()->mapWithKeys(function ($item) {
            $decoded = json_decode($item->value, true);
            return [$item->key => (json_last_error() === JSON_ERROR_NONE ? $decoded : $item->value)];
        });

        return response()->json([
            'status' => 'success',
            'settings' => $settings,
        ]);
    }

    /**
     * Save or update settings in MySQL Database
     */
    public function saveSettings(Request $request)
    {
        $group = $request->input('group', 'general');

        if ($group === 'mlm') {
            $validator = Validator::make($request->all(), [
                'settings' => 'required|array',
                'settings.bpValueInRupees' => 'required|numeric|min:0.01',
                'settings.defaultReferralPercent' => 'required|numeric|min:0|max:100',
                'settings.defaultTeamPercent' => 'required|numeric|min:0|max:100',
                'settings.teamLevelsCount' => 'required|integer|min:1|max:50',
                'settings.defaultBpPercent' => 'required|numeric|min:0|max:100',
                'settings.bpLevelsCount' => 'required|integer|min:1|max:50',
                'settings.minWithdrawalAmount' => 'required|numeric|min:0',
            ], [
                'settings.bpValueInRupees.min' => 'BP value in Rupees must be greater than 0.',
                'settings.defaultReferralPercent.min' => 'Referral Commission cannot be negative.',
                'settings.defaultReferralPercent.max' => 'Referral Commission cannot exceed 100%.',
                'settings.defaultTeamPercent.min' => 'Team Commission cannot be negative.',
                'settings.defaultTeamPercent.max' => 'Team Commission cannot exceed 100%.',
                'settings.defaultBpPercent.min' => 'Business Points Allocation cannot be negative.',
                'settings.defaultBpPercent.max' => 'Business Points Allocation cannot exceed 100%.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors(),
                ], 422);
            }

            $settings = $request->input('settings', []);
            $ref = (float)($settings['defaultReferralPercent'] ?? 0);
            $team = (float)($settings['defaultTeamPercent'] ?? 0);
            $bp = (float)($settings['defaultBpPercent'] ?? 0);
            if (($ref + $team + $bp) > 100) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'The total sum of Referral Commission, Team Commission, and BP Allocation cannot exceed 100%.',
                    'errors' => [
                        'settings.total' => ['The total sum of Referral Commission, Team Commission, and BP Allocation cannot exceed 100%.'],
                    ],
                ], 422);
            }
        } else {
            $validator = Validator::make($request->all(), [
                'settings' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors(),
                ], 422);
            }
        }

        $settings = $request->input('settings', []);
        foreach ($settings as $key => $value) {
            SystemSetting::set($key, $value, $group);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Settings saved successfully to database.',
        ]);
    }

    /**
     * Public endpoint for Social Platform Links
     */
    public function getSocialLinks()
    {
        $links = SystemSetting::get('social_platform_links', null);
        return response()->json([
            'status' => 'success',
            'socialLinks' => $links,
        ]);
    }

    /**
     * Save Social Platform Links
     */
    public function saveSocialLinks(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'social_links' => 'required|array',
            'social_links.*.channelUrl' => 'nullable|url',
            'social_links.*.profileUrl' => 'nullable|url',
            'social_links.*.companyUrl' => 'nullable|url',
            'social_links.*.pageUrl' => 'nullable|url',
            'social_links.*.embedVideoUrl' => 'nullable|url',
        ], [
            'social_links.*.*.url' => 'Please provide valid URL addresses for social links.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $links = $request->input('social_links', []);
        SystemSetting::set('social_platform_links', $links, 'social');

        return response()->json([
            'status' => 'success',
            'message' => 'Social platform links saved to database.',
            'socialLinks' => $links,
        ]);
    }
}
