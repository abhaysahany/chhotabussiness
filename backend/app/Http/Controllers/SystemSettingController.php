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
        $settings = $request->input('settings', []);
        $group = $request->input('group', 'general');

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
        $links = $request->input('social_links', []);
        SystemSetting::set('social_platform_links', $links, 'social');

        return response()->json([
            'status' => 'success',
            'message' => 'Social platform links saved to database.',
            'socialLinks' => $links,
        ]);
    }
}
