<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class SystemSettingController extends Controller
{
    /**
     * Public endpoint to get application branding configuration
     */
    public function getBranding()
    {
        $appName = SystemSetting::get('app_name', config('app.name', 'AddNet'));
        if (empty($appName)) {
            $appName = 'AddNet';
        }

        $companyLogo = SystemSetting::get('company_logo');
        $companyLogoUrl = null;

        if (!empty($companyLogo)) {
            if (str_starts_with($companyLogo, 'http://') || str_starts_with($companyLogo, 'https://')) {
                $companyLogoUrl = $companyLogo;
            } else {
                $companyLogoUrl = url($companyLogo);
            }
        } else {
            // Default bundled logo
            $companyLogoUrl = url('logo.png');
        }

        return response()->json([
            'status' => 'success',
            'app_name' => $appName,
            'company_name' => $appName,
            'company_logo' => $companyLogo,
            'company_logo_url' => $companyLogoUrl,
            'logo_url' => $companyLogoUrl,
            'branding' => [
                'app_name' => $appName,
                'company_name' => $appName,
                'company_logo' => $companyLogo,
                'company_logo_url' => $companyLogoUrl,
                'logo_url' => $companyLogoUrl,
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

        // 2. Validate Application Name and Logo
        $hasName = $request->has('app_name') || $request->has('company_name');
        $hasLogo = $request->hasFile('company_logo') || $request->hasFile('logo');
        $hasReset = $request->has('reset_logo') && filter_var($request->input('reset_logo'), FILTER_VALIDATE_BOOLEAN);

        // If app_name is explicitly passed, validate strictly
        if ($request->has('app_name')) {
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

            $trimmedName = trim($request->input('app_name'));
            if (empty($trimmedName)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'The application name cannot be empty or whitespace only.',
                    'errors' => [
                        'app_name' => ['The application name cannot be empty.'],
                    ],
                ], 422);
            }
        } elseif ($request->has('company_name')) {
            $validator = Validator::make($request->all(), [
                'company_name' => 'required|string|min:2|max:50',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors(),
                ], 422);
            }
        }

        // Validate logo file if uploaded
        $logoKey = $request->hasFile('company_logo') ? 'company_logo' : ($request->hasFile('logo') ? 'logo' : null);
        if ($logoKey) {
            $fileValidator = Validator::make($request->all(), [
                $logoKey => 'required|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            ], [
                "{$logoKey}.image" => 'The company logo must be a valid image file.',
                "{$logoKey}.mimes" => 'Supported logo formats: JPEG, PNG, JPG, SVG, WEBP.',
                "{$logoKey}.max" => 'The company logo size must not exceed 2MB.',
            ]);

            if ($fileValidator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => $fileValidator->errors()->first(),
                    'errors' => $fileValidator->errors(),
                ], 422);
            }
        }

        // 3. Handle Logo Storage / Reset
        if ($hasReset) {
            $oldLogo = SystemSetting::get('company_logo');
            if ($oldLogo && str_starts_with($oldLogo, 'uploads/branding/')) {
                $oldPath = public_path($oldLogo);
                if (File::exists($oldPath)) {
                    @File::delete($oldPath);
                }
            }
            SystemSetting::where('key', 'company_logo')->delete();
        } elseif ($logoKey) {
            $file = $request->file($logoKey);
            $uploadDir = public_path('uploads/branding');

            if (!File::isDirectory($uploadDir)) {
                File::makeDirectory($uploadDir, 0755, true, true);
            }

            // Remove previous custom logo file
            $oldLogo = SystemSetting::get('company_logo');
            if ($oldLogo && str_starts_with($oldLogo, 'uploads/branding/')) {
                $oldPath = public_path($oldLogo);
                if (File::exists($oldPath)) {
                    @File::delete($oldPath);
                }
            }

            $ext = strtolower($file->getClientOriginalExtension()) ?: 'png';
            $fileName = 'company_logo_' . time() . '_' . substr(uniqid(), 0, 6) . '.' . $ext;
            $file->move($uploadDir, $fileName);

            SystemSetting::set('company_logo', 'uploads/branding/' . $fileName, 'branding');
        }

        // 4. Handle Application Name
        if ($hasName) {
            $appName = trim($request->input('app_name', $request->input('company_name')));
            SystemSetting::set('app_name', $appName, 'branding');
        }

        // Fetch current values
        $currentName = SystemSetting::get('app_name', config('app.name', 'AddNet')) ?: 'AddNet';
        $currentLogo = SystemSetting::get('company_logo');
        $currentLogoUrl = null;

        if (!empty($currentLogo)) {
            $currentLogoUrl = (str_starts_with($currentLogo, 'http://') || str_starts_with($currentLogo, 'https://'))
                ? $currentLogo
                : url($currentLogo) . '?t=' . time();
        } else {
            $currentLogoUrl = url('logo.png');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Application branding updated successfully!',
            'app_name' => $currentName,
            'company_name' => $currentName,
            'company_logo' => $currentLogo,
            'company_logo_url' => $currentLogoUrl,
            'logo_url' => $currentLogoUrl,
            'branding' => [
                'app_name' => $currentName,
                'company_name' => $currentName,
                'company_logo' => $currentLogo,
                'company_logo_url' => $currentLogoUrl,
                'logo_url' => $currentLogoUrl,
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
