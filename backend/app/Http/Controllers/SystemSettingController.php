<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
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
