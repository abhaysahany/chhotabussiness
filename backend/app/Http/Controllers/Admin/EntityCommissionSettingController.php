<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\EntityCommissionSetting;
use App\Models\FreelancerEntity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EntityCommissionSettingController extends Controller
{
    /**
     * Helper to verify active administrator privileges
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
     * Unified list of all Business Entities and Freelancers with their commission settings.
     * Business entities default to Direct: 10%, Level 2: 4%, Level 3: 3%, Level 4: 2%, Level 5: 1%, Reward: 5%.
     */
    public function index(Request $request): JsonResponse
    {
        if ($unauthorized = $this->verifyAdminAccess($request)) {
            return $unauthorized;
        }

        $entityTypeFilter = strtolower(trim($request->input('entity_type', 'all')));
        $search = trim($request->input('search', ''));
        $configFilter = strtolower(trim($request->input('config_status', 'all')));

        $businesses = collect();
        $freelancers = collect();

        // 1. Fetch Business Entities
        if ($entityTypeFilter === 'all' || $entityTypeFilter === 'business') {
            $businessQuery = BusinessEntity::with(['category', 'commissionSetting']);

            if (!empty($search)) {
                $businessQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('owner_name', 'like', "%{$search}%")
                      ->orWhere('id', $search);
                });
            }

            $defaultBizSettings = EntityCommissionSetting::defaultBusinessSettings();

            $businesses = $businessQuery->orderBy('name', 'asc')->get()->map(function ($biz) use ($defaultBizSettings) {
                $setting = $biz->commissionSetting;
                $isConfigured = $setting !== null && (bool)$setting->is_custom;

                return [
                    'entity_type' => 'business',
                    'entity_type_label' => 'Business Entity',
                    'entity_id' => $biz->id,
                    'entity_name' => $biz->name,
                    'owner_name' => $biz->owner_name,
                    'email' => $biz->email,
                    'phone' => $biz->phone,
                    'category_name' => $biz->category?->name ?? 'General Business',
                    'verification_status' => $biz->verification_status,
                    'direct_percent' => (float)($setting?->direct_percent ?? $defaultBizSettings['direct_percent']),
                    'level_2_percent' => (float)($setting?->level_2_percent ?? $defaultBizSettings['level_2_percent']),
                    'level_3_percent' => (float)($setting?->level_3_percent ?? $defaultBizSettings['level_3_percent']),
                    'level_4_percent' => (float)($setting?->level_4_percent ?? $defaultBizSettings['level_4_percent']),
                    'level_5_percent' => (float)($setting?->level_5_percent ?? $defaultBizSettings['level_5_percent']),
                    'reward_percent' => (float)($setting?->reward_percent ?? $defaultBizSettings['reward_percent']),
                    'is_configured' => $isConfigured,
                    'setting_id' => $setting?->id,
                    'updated_at' => $setting?->updated_at?->toIso8601String(),
                ];
            });
        }

        // 2. Fetch Freelancer Entities
        if ($entityTypeFilter === 'all' || $entityTypeFilter === 'freelancer' || $entityTypeFilter === 'freelance') {
            $freelancerQuery = FreelancerEntity::with(['category', 'commissionSetting']);

            if (!empty($search)) {
                $freelancerQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('title', 'like', "%{$search}%")
                      ->orWhere('id', $search);
                });
            }

            $defaultFreelancerSettings = EntityCommissionSetting::defaultSettings('freelancer');

            $freelancers = $freelancerQuery->orderBy('name', 'asc')->get()->map(function ($freelancer) use ($defaultFreelancerSettings) {
                $setting = $freelancer->commissionSetting;
                $isConfigured = $setting !== null && (bool)$setting->is_custom;

                return [
                    'entity_type' => 'freelancer',
                    'entity_type_label' => 'Freelancer Entity',
                    'entity_id' => $freelancer->id,
                    'entity_name' => $freelancer->name,
                    'owner_name' => $freelancer->name,
                    'email' => $freelancer->email,
                    'phone' => $freelancer->phone,
                    'category_name' => $freelancer->category?->name ?? 'Professional Freelance',
                    'verification_status' => $freelancer->verification_status,
                    'direct_percent' => (float)($setting?->direct_percent ?? $defaultFreelancerSettings['direct_percent']),
                    'level_2_percent' => (float)($setting?->level_2_percent ?? $defaultFreelancerSettings['level_2_percent']),
                    'level_3_percent' => (float)($setting?->level_3_percent ?? $defaultFreelancerSettings['level_3_percent']),
                    'level_4_percent' => (float)($setting?->level_4_percent ?? $defaultFreelancerSettings['level_4_percent']),
                    'level_5_percent' => (float)($setting?->level_5_percent ?? $defaultFreelancerSettings['level_5_percent']),
                    'reward_percent' => (float)($setting?->reward_percent ?? $defaultFreelancerSettings['reward_percent']),
                    'is_configured' => $isConfigured,
                    'setting_id' => $setting?->id,
                    'updated_at' => $setting?->updated_at?->toIso8601String(),
                ];
            });
        }

        // Combine into unified list
        $combined = $businesses->concat($freelancers);

        // Apply config status filter if requested
        if ($configFilter === 'configured') {
            $combined = $combined->where('is_configured', true);
        } elseif ($configFilter === 'default') {
            $combined = $combined->where('is_configured', false);
        }

        $combined = $combined->values();

        $totalCount = $combined->count();
        $configuredCount = $combined->where('is_configured', true)->count();
        $bizCount = $combined->where('entity_type', 'business')->count();
        $freeCount = $combined->where('entity_type', 'freelancer')->count();

        return response()->json([
            'status' => 'success',
            'data' => $combined,
            'summary' => [
                'total_entities' => $totalCount,
                'business_count' => $bizCount,
                'freelancer_count' => $freeCount,
                'configured_count' => $configuredCount,
                'default_count' => $totalCount - $configuredCount,
            ],
        ]);
    }

    /**
     * Retrieve current settings for a single entity
     */
    public function show(string $entity_type, int $entity_id, Request $request): JsonResponse
    {
        if ($unauthorized = $this->verifyAdminAccess($request)) {
            return $unauthorized;
        }

        $normalizedType = strtolower(trim($entity_type));
        if ($normalizedType === 'freelance') {
            $normalizedType = 'freelancer';
        }

        if (!in_array($normalizedType, ['business', 'freelancer'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid entity type. Supported types are "business" or "freelancer".',
            ], 422);
        }

        $entity = null;
        if ($normalizedType === 'business') {
            $entity = BusinessEntity::with('commissionSetting')->find($entity_id);
        } else {
            $entity = FreelancerEntity::with('commissionSetting')->find($entity_id);
        }

        if (!$entity) {
            return response()->json([
                'status' => 'error',
                'message' => "The {$normalizedType} entity with ID #{$entity_id} was not found.",
            ], 404);
        }

        $setting = $entity->commissionSetting;

        $defaults = EntityCommissionSetting::defaultSettings($normalizedType);

        $isConfigured = $setting !== null && (bool)$setting->is_custom;

        return response()->json([
            'status' => 'success',
            'data' => [
                'entity_type' => $normalizedType,
                'entity_id' => $entity->id,
                'entity_name' => $entity->name,
                'email' => $entity->email,
                'direct_percent' => (float)($setting?->direct_percent ?? $defaults['direct_percent']),
                'level_2_percent' => (float)($setting?->level_2_percent ?? $defaults['level_2_percent']),
                'level_3_percent' => (float)($setting?->level_3_percent ?? $defaults['level_3_percent']),
                'level_4_percent' => (float)($setting?->level_4_percent ?? $defaults['level_4_percent']),
                'level_5_percent' => (float)($setting?->level_5_percent ?? $defaults['level_5_percent']),
                'reward_percent' => (float)($setting?->reward_percent ?? $defaults['reward_percent']),
                'is_configured' => $isConfigured,
                'updated_at' => $setting?->updated_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Save or update commission & reward settings for an entity.
     * Prevents duplicate rows via composite unique upsert.
     */
    public function save(Request $request): JsonResponse
    {
        if ($unauthorized = $this->verifyAdminAccess($request)) {
            return $unauthorized;
        }

        // Support 'freelance' alias by mapping to 'freelancer'
        $input = $request->all();
        if (isset($input['entity_type']) && strtolower(trim($input['entity_type'])) === 'freelance') {
            $input['entity_type'] = 'freelancer';
        }

        $validator = Validator::make($input, [
            'entity_type' => ['required', 'string', Rule::in(['business', 'freelancer'])],
            'entity_id' => ['required', 'integer', 'min:1'],
            'direct_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'level_1_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'level_2_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'level_3_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'level_4_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'level_5_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'reward_percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ], [
            'entity_type.in' => 'Entity type must be either "business" or "freelancer".',
            'direct_percent.min' => 'Direct Commission (%) cannot be negative.',
            'direct_percent.max' => 'Direct Commission (%) cannot exceed 100%.',
            'level_2_percent.min' => 'Level 2 Commission (%) cannot be negative.',
            'level_2_percent.max' => 'Level 2 Commission (%) cannot exceed 100%.',
            'level_3_percent.min' => 'Level 3 Commission (%) cannot be negative.',
            'level_3_percent.max' => 'Level 3 Commission (%) cannot exceed 100%.',
            'level_4_percent.min' => 'Level 4 Commission (%) cannot be negative.',
            'level_4_percent.max' => 'Level 4 Commission (%) cannot exceed 100%.',
            'level_5_percent.min' => 'Level 5 Commission (%) cannot be negative.',
            'level_5_percent.max' => 'Level 5 Commission (%) cannot exceed 100%.',
            'reward_percent.min' => 'Reward (%) cannot be negative.',
            'reward_percent.max' => 'Reward (%) cannot exceed 100%.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed for commission rates.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $entityType = strtolower(trim($input['entity_type']));
        $entityId = (int)$input['entity_id'];

        // Verify entity exists in the authoritative table
        $entity = null;
        if ($entityType === 'business') {
            $entity = BusinessEntity::find($entityId);
        } elseif ($entityType === 'freelancer') {
            $entity = FreelancerEntity::find($entityId);
        }

        if (!$entity) {
            return response()->json([
                'status' => 'error',
                'message' => "The {$entityType} entity with ID #{$entityId} does not exist in the database.",
            ], 404);
        }

        DB::beginTransaction();
        try {
            $saveData = [
                'direct_percent' => round((float)$input['direct_percent'], 2),
                'level_2_percent' => round((float)$input['level_2_percent'], 2),
                'level_3_percent' => round((float)$input['level_3_percent'], 2),
                'level_4_percent' => round((float)$input['level_4_percent'], 2),
                'level_5_percent' => round((float)$input['level_5_percent'], 2),
                'reward_percent' => round((float)$input['reward_percent'], 2),
                'is_custom' => true,
            ];

            if (isset($input['level_1_percent'])) {
                $saveData['level_1_percent'] = round((float)$input['level_1_percent'], 2);
            }

            $setting = EntityCommissionSetting::updateOrCreate(
                [
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                ],
                $saveData
            );

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Commission & reward settings saved successfully for \"{$entity->name}\"!",
                'data' => [
                    'entity_type' => $entityType,
                    'entity_type_label' => $entityType === 'business' ? 'Business Entity' : 'Freelancer Entity',
                    'entity_id' => $entityId,
                    'entity_name' => $entity->name,
                    'email' => $entity->email,
                    'direct_percent' => (float)$setting->direct_percent,
                    'level_2_percent' => (float)$setting->level_2_percent,
                    'level_3_percent' => (float)$setting->level_3_percent,
                    'level_4_percent' => (float)$setting->level_4_percent,
                    'level_5_percent' => (float)$setting->level_5_percent,
                    'reward_percent' => (float)$setting->reward_percent,
                    'is_configured' => true,
                    'setting_id' => $setting->id,
                    'updated_at' => $setting->updated_at->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while saving commission settings. Please try again.',
            ], 500);
        }
    }
}
