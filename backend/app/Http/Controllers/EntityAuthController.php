<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\BusinessEntity;
use App\Models\FreelancerEntity;
use App\Services\PasswordResetOtpService;

class EntityAuthController extends Controller
{
    /**
     * Show login endpoint (used by SPA – returns minimal JSON).
     */
    public function showLogin()
    {
        return response()->json(['message' => 'Entity login endpoint']);
    }

    /**
     * Get list of registered entities for login selection dropdown.
     * GET /api/entity/selectable-entities
     */
    public function getSelectableEntities(Request $request)
    {
        $businesses = BusinessEntity::select('id', 'name', 'owner_name', 'email', 'phone', 'registration_no', 'verification_status', 'logo_url')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($b) {
                $identifier = $b->registration_no ?: ('BIZ-' . str_pad($b->id, 4, '0', STR_PAD_LEFT));
                return [
                    'key' => 'business_' . $b->id,
                    'value' => 'business_' . $b->id,
                    'id' => (int) $b->id,
                    'type' => 'business',
                    'entity_type' => 'business',
                    'name' => $b->name,
                    'owner_name' => $b->owner_name,
                    'email' => $b->email,
                    'phone' => $b->phone,
                    'identifier' => $identifier,
                    'label' => $b->name . " ({$identifier})",
                    'verification_status' => $b->verification_status,
                    'logo_url' => $b->logo_url,
                ];
            });

        $freelancers = FreelancerEntity::select('id', 'name', 'title', 'email', 'phone', 'verification_status', 'avatar_url')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($f) {
                $identifier = 'FL-' . str_pad($f->id, 4, '0', STR_PAD_LEFT);
                return [
                    'key' => 'freelancer_' . $f->id,
                    'value' => 'freelancer_' . $f->id,
                    'id' => (int) $f->id,
                    'type' => 'freelancer',
                    'entity_type' => 'freelancer',
                    'name' => $f->name,
                    'title' => $f->title,
                    'email' => $f->email,
                    'phone' => $f->phone,
                    'identifier' => $identifier,
                    'label' => $f->name . ($f->title ? " - {$f->title}" : " ({$identifier})"),
                    'verification_status' => $f->verification_status,
                    'avatar_url' => $f->avatar_url,
                ];
            });

        return response()->json([
            'status' => 'success',
            'success' => true,
            'entities' => $businesses->concat($freelancers)->values(),
            'businesses' => $businesses->values(),
            'freelancers' => $freelancers->values(),
            'total' => $businesses->count() + $freelancers->count(),
        ], 200);
    }

    /**
     * Handle entity login request with registered email/login ID and password.
     * Identifies the associated Entity automatically on the backend.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required_without:login|nullable|string',
            'login' => 'required_without:email|nullable|string',
            'password' => 'required|string',
        ], [
            'email.required_without' => 'Registered email or entity login ID is required.',
            'login.required_without' => 'Registered email or entity login ID is required.',
            'password.required' => 'Password is required.',
        ]);

        $rawLogin = trim((string) ($request->input('email') ?? $request->input('login') ?? ''));
        $rawPassword = (string) $request->input('password');

        if ($validator->fails() || $rawLogin === '' || $rawPassword === '') {
            $errors = $validator->errors();
            if ($rawLogin === '' && !$errors->has('email')) {
                $errors->add('email', 'Registered email or entity login ID is required.');
            }
            if ($rawPassword === '' && !$errors->has('password')) {
                $errors->add('password', 'Password is required.');
            }
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => $errors->first() ?: 'Both entity login ID / email and password are required.',
                'errors' => $errors,
            ], 422);
        }

        // Apply rate limiting (5 attempts per minute per identifier & IP)
        $loginLower = strtolower($rawLogin);
        $throttleKey = 'entity_login_' . $loginLower . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
                'error' => "Too many login attempts. Please try again in {$seconds} seconds.",
                'retry_after' => $seconds,
            ], 429);
        }

        $password = $rawPassword;
        $remember = $request->boolean('remember');

        // Optional scoping filters if provided by caller (never trusted blindly)
        $suppliedEntityId = $request->input('entity_id');
        $suppliedEntityType = $request->input('entity_type');
        $suppliedEntityKey = $request->input('entity_key') ?? $request->input('entity');
        if ($suppliedEntityKey && (empty($suppliedEntityType) || empty($suppliedEntityId))) {
            if (str_contains($suppliedEntityKey, '_')) {
                [$suppliedEntityType, $suppliedEntityId] = explode('_', $suppliedEntityKey, 2);
            }
        }

        // 1. Query candidate Business Entities matching login identifier
        $businessQuery = BusinessEntity::with('category')
            ->where(function ($q) use ($loginLower, $rawLogin) {
                $q->whereRaw('LOWER(TRIM(email)) = ?', [$loginLower])
                  ->orWhere('phone', $rawLogin)
                  ->orWhere(function ($sub) use ($loginLower) {
                      $sub->whereNotNull('registration_no')
                          ->where('registration_no', '!=', '')
                          ->whereRaw('LOWER(TRIM(registration_no)) = ?', [$loginLower]);
                  });
            });

        // 2. Query candidate Freelancer Entities matching login identifier
        $freelancerQuery = FreelancerEntity::with('category')
            ->where(function ($q) use ($loginLower, $rawLogin) {
                $q->whereRaw('LOWER(TRIM(email)) = ?', [$loginLower])
                  ->orWhere('phone', $rawLogin);
            });

        $candidateBusinesses = $businessQuery->get();
        $candidateFreelancers = $freelancerQuery->get();

        // 3. Authenticate candidates against password hash
        $authenticatedCandidates = [];

        foreach ($candidateBusinesses as $b) {
            $pwMatches = !empty($b->password) && Hash::check($password, $b->password);
            if (!$pwMatches) {
                $legacyUser = User::where('email', $b->email)->first();
                if ($legacyUser && !empty($legacyUser->password) && Hash::check($password, $legacyUser->password)) {
                    $pwMatches = true;
                    if (empty($b->password)) {
                        $b->password = $legacyUser->password;
                        $b->save();
                    }
                }
            }
            if ($pwMatches) {
                $authenticatedCandidates[] = [
                    'type' => 'business',
                    'entity' => $b,
                ];
            }
        }

        foreach ($candidateFreelancers as $f) {
            $pwMatches = !empty($f->password) && Hash::check($password, $f->password);
            if (!$pwMatches) {
                $legacyUser = User::where('email', $f->email)->first();
                if ($legacyUser && !empty($legacyUser->password) && Hash::check($password, $legacyUser->password)) {
                    $pwMatches = true;
                    if (empty($f->password)) {
                        $f->password = $legacyUser->password;
                        $f->save();
                    }
                }
            }
            if ($pwMatches) {
                $authenticatedCandidates[] = [
                    'type' => 'freelancer',
                    'entity' => $f,
                ];
            }
        }

        // If credentials do not match any candidate entity
        if (empty($authenticatedCandidates)) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Invalid email or password credentials.',
                'error' => 'Invalid email or password credentials.',
            ], 401);
        }

        // If multiple candidates authenticated with the same credentials (ambiguity check)
        if (count($authenticatedCandidates) > 1) {
            // If caller provided an entity_type, check if that safely disambiguates
            if (!empty($suppliedEntityType)) {
                $filtered = array_values(array_filter($authenticatedCandidates, function ($c) use ($suppliedEntityType) {
                    return strtolower($c['type']) === strtolower($suppliedEntityType);
                }));
                if (count($filtered) === 1) {
                    $authenticatedCandidates = $filtered;
                }
            }
        }

        if (count($authenticatedCandidates) > 1) {
            // Still ambiguous: never select an arbitrary entity.
            Log::warning("Ambiguous entity login attempt for identifier [{$rawLogin}]. Multiple entities matched and authenticated.", [
                'candidates' => array_map(fn($c) => ['type' => $c['type'], 'id' => $c['entity']->id, 'name' => $c['entity']->name], $authenticatedCandidates),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'status' => 'error',
                'code' => 'AMBIGUOUS_ENTITY_MAPPING',
                'message' => 'Multiple entity accounts are associated with this login identifier. Please contact administration to resolve your account mapping.',
                'error' => 'Multiple entity accounts are associated with this login identifier. Please contact administration to resolve your account mapping.',
            ], 422);
        }

        $chosen = $authenticatedCandidates[0];
        $entity = $chosen['entity'];
        $entityType = $chosen['type'];

        // If client explicitly passed an entity_id, verify that it matches the authenticated entity
        if (!empty($suppliedEntityId) && (int) $suppliedEntityId !== (int) $entity->id) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'The entered credentials do not belong to the selected entity.',
                'error' => 'The entered credentials do not belong to the selected entity.',
            ], 401);
        }

        if (!empty($suppliedEntityType) && strtolower($suppliedEntityType) !== $entityType) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'The entered credentials do not belong to the selected entity type.',
                'error' => 'The entered credentials do not belong to the selected entity type.',
            ], 401);
        }

        // Check account status & eligibility
        if (isset($entity->status) && strtolower((string) $entity->status) === 'inactive') {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Your entity account is currently inactive. Please contact administration.',
                'error' => 'Your entity account is currently inactive. Please contact administration.',
            ], 403);
        }

        if ($entity->verification_status === 'rejected') {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Your entity account application has been rejected. Please contact support.',
                'error' => 'Your entity account application has been rejected. Please contact support.',
            ], 403);
        }

        // Authentication successful: clear rate limiting attempts
        RateLimiter::clear($throttleKey);

        // Generate Sanctum token directly on the Authenticatable Entity model
        $token = $entity->createToken('entity_token')->plainTextToken;

        if ($entityType === 'business') {
            $entityDetails = [
                'entity_type' => 'business',
                'entity_id' => $entity->id,
                'business_name' => $entity->name,
                'owner_name' => $entity->owner_name,
                'category' => $entity->category?->name ?? 'General Business',
                'registration_no' => $entity->registration_no,
                'website' => $entity->website,
                'verification_status' => $entity->verification_status,
                'logo_url' => $entity->logo_url,
                'documents_count' => is_array($entity->documents) ? count($entity->documents) : 0,
                'documents' => $entity->documents ?? [],
            ];
            $userPayload = [
                'id' => $entity->id,
                'name' => $entity->name,
                'email' => $entity->email,
                'user_code' => 'ENT-B' . str_pad($entity->id, 5, '0', STR_PAD_LEFT),
                'entity_details' => $entityDetails,
            ];
        } else {
            $entityDetails = [
                'entity_type' => 'freelancer',
                'entity_id' => $entity->id,
                'business_name' => $entity->name,
                'title' => $entity->title,
                'category' => $entity->category?->name ?? 'Professional Freelance',
                'hourly_rate' => $entity->hourly_rate,
                'verification_status' => $entity->verification_status,
                'avatar_url' => $entity->avatar_url,
                'documents_count' => is_array($entity->documents) ? count($entity->documents) : 0,
                'documents' => $entity->documents ?? [],
            ];
            $userPayload = [
                'id' => $entity->id,
                'name' => $entity->name,
                'email' => $entity->email,
                'user_code' => 'ENT-F' . str_pad($entity->id, 5, '0', STR_PAD_LEFT),
                'entity_details' => $entityDetails,
            ];
        }

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Login successful! Welcome to the Entity Portal.',
            'user' => $userPayload,
            'token' => $token,
            'session' => [
                'idle_timeout_minutes' => (int) config('session_timeout.idle_timeout_minutes', 30),
                'absolute_timeout_hours' => (int) config('session_timeout.absolute_timeout_hours', 12),
                'session_start' => now()->toIso8601String(),
            ],
        ], 200);
    }

    /**
     * Get Current Authenticated Entity Profile
     */
    public function me(Request $request)
    {
        $principal = $request->user();

        if (!$principal && $request->bearerToken()) {
            if (class_exists(\Laravel\Sanctum\PersonalAccessToken::class)) {
                $tokenObj = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
                if ($tokenObj && $tokenObj->tokenable) {
                    $principal = $tokenObj->tokenable;
                }
            }
        }

        if (!$principal) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated entity session',
            ], 401);
        }

        $business = null;
        $freelancer = null;

        // 1. Direct BusinessEntity token
        if ($principal instanceof BusinessEntity) {
            $business = $principal->loadMissing('category');
        }
        // 2. Direct FreelancerEntity token
        elseif ($principal instanceof FreelancerEntity) {
            $freelancer = $principal->loadMissing('category');
        }
        // 3. Legacy User token (backward compatibility for historical sessions like User #19)
        elseif ($principal instanceof User) {
            $business = BusinessEntity::with('category')->where('email', $principal->email)->first();
            if (!$business) {
                $freelancer = FreelancerEntity::with('category')->where('email', $principal->email)->first();
            }
        }

        if (!$business && !$freelancer) {
            return response()->json([
                'status' => 'error',
                'message' => 'Entity record not found for authenticated session',
            ], 404);
        }

        if ($business) {
            $entityDetails = [
                'entity_type' => 'business',
                'entity_id' => $business->id,
                'business_name' => $business->name,
                'owner_name' => $business->owner_name,
                'category' => $business->category?->name ?? 'General Business',
                'registration_no' => $business->registration_no,
                'website' => $business->website,
                'verification_status' => $business->verification_status,
                'logo_url' => $business->logo_url,
                'documents_count' => is_array($business->documents) ? count($business->documents) : 0,
                'documents' => $business->documents ?? [],
            ];
            $userPayload = [
                'id' => $business->id,
                'name' => $business->name,
                'email' => $business->email,
                'user_code' => 'ENT-B' . str_pad($business->id, 5, '0', STR_PAD_LEFT),
                'entity_details' => $entityDetails,
            ];
        } else {
            $entityDetails = [
                'entity_type' => 'freelancer',
                'entity_id' => $freelancer->id,
                'business_name' => $freelancer->name,
                'title' => $freelancer->title,
                'category' => $freelancer->category?->name ?? 'Professional Freelance',
                'hourly_rate' => $freelancer->hourly_rate,
                'verification_status' => $freelancer->verification_status,
                'avatar_url' => $freelancer->avatar_url,
                'documents_count' => is_array($freelancer->documents) ? count($freelancer->documents) : 0,
                'documents' => $freelancer->documents ?? [],
            ];
            $userPayload = [
                'id' => $freelancer->id,
                'name' => $freelancer->name,
                'email' => $freelancer->email,
                'user_code' => 'ENT-F' . str_pad($freelancer->id, 5, '0', STR_PAD_LEFT),
                'entity_details' => $entityDetails,
            ];
        }

        return response()->json([
            'status' => 'success',
            'success' => true,
            'user' => $userPayload,
        ]);
    }

    /**
     * Entity Info & Stats Endpoint
     */
    public function info(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'panel' => 'Entity Panel',
            'message' => 'Welcome to Vyapar Adnet Entity Portal',
            'stats' => [
                'total_businesses' => BusinessEntity::count(),
                'total_freelancers' => FreelancerEntity::count(),
                'active_listings' => BusinessEntity::where('verification_status', 'verified')->count(),
            ],
        ]);
    }

    /**
     * Logout the entity guard.
     */
    public function logout(Request $request)
    {
        if (Auth::guard('entity')->check()) {
            Auth::guard('entity')->logout();
        }
        if (Auth::guard('web')->check()) {
            Auth::guard('web')->logout();
        }

        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }

        if ($request->bearerToken()) {
            \App\Models\PersonalAccessToken::findToken($request->bearerToken())?->delete();
        }

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Resolve target entity account scoped strictly by type to prevent shared-email collisions.
     */
    protected function resolveTargetEntity(string $email, ?string $type = null): array
    {
        $normalizedType = strtolower(trim((string) $type));
        $cleanEmail = strtolower(trim($email));

        if (in_array($normalizedType, ['business', 'business_entity'])) {
            $business = BusinessEntity::whereRaw('LOWER(TRIM(email)) = ?', [$cleanEmail])->first();
            return [$business, 'business', 'Business Entity'];
        }

        if (in_array($normalizedType, ['freelancer', 'freelancer_entity', 'freelance'])) {
            $freelancer = FreelancerEntity::whereRaw('LOWER(TRIM(email)) = ?', [$cleanEmail])->first();
            return [$freelancer, 'freelancer', 'Freelancer'];
        }

        // Backwards compatibility fallback if type was not provided
        $business = BusinessEntity::whereRaw('LOWER(TRIM(email)) = ?', [$cleanEmail])->first();
        $freelancer = FreelancerEntity::whereRaw('LOWER(TRIM(email)) = ?', [$cleanEmail])->first();

        if ($business && $freelancer) {
            return [null, 'ambiguous', 'Both'];
        }

        if ($business) {
            return [$business, 'business', 'Business Entity'];
        }

        if ($freelancer) {
            return [$freelancer, 'freelancer', 'Freelancer'];
        }

        return [null, null, null];
    }

    /**
     * Send OTP for Entity Password Recovery (Business Entity or Freelancer)
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'entity_type' => 'nullable|string|in:business,freelancer,business_entity,freelancer_entity',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'A valid registered email address is required.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = trim($request->input('email'));
        $entityType = $request->input('entity_type');

        [$targetEntity, $resolvedType, $typeLabel] = $this->resolveTargetEntity($email, $entityType);

        if ($resolvedType === 'ambiguous') {
            return response()->json([
                'status' => 'error',
                'requires_type_selection' => true,
                'message' => 'Both a Business Entity and a Freelancer account share this email address. Please select your specific account type.',
            ], 422);
        }

        if (!$targetEntity) {
            $typeName = $entityType ? ucfirst(str_replace('_entity', '', $entityType)) : 'entity';
            return response()->json([
                'status' => 'error',
                'message' => "No registered {$typeName} account found with this email address.",
            ], 404);
        }

        // Synchronous secure dispatch
        $result = PasswordResetOtpService::sendResetOtp(
            accountType: 'entity_' . $resolvedType,
            accountId: $targetEntity->id,
            recipientEmail: $targetEntity->email,
            recipientName: $targetEntity->name,
            accountLabel: $typeLabel
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'retry_after_seconds' => $result['retry_after_seconds'] ?? null,
            ], $result['status_code']);
        }

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => "Password reset verification code dispatched to {$result['masked_email']}!",
            'entity_type' => $resolvedType,
            'masked_email' => $result['masked_email'],
            'expires_in_minutes' => $result['expires_in_minutes'],
        ], 200);
    }

    /**
     * Verify Password Reset OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'entity_type' => 'nullable|string|in:business,freelancer,business_entity,freelancer_entity',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please provide a valid email and 6-digit OTP code.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = trim($request->input('email'));
        $entityType = $request->input('entity_type');
        $otp = trim($request->input('otp'));

        [$targetEntity, $resolvedType] = $this->resolveTargetEntity($email, $entityType);

        if (!$targetEntity) {
            return response()->json([
                'status' => 'error',
                'message' => 'Entity account not found.',
            ], 404);
        }

        $result = PasswordResetOtpService::verifyOtp('entity_' . $resolvedType, $targetEntity->id, $otp);

        if (!$result['valid'] && Cache::has('entity_reset_otp_' . $email) && Cache::get('entity_reset_otp_' . $email) === $otp) {
            $result = ['valid' => true, 'message' => 'OTP verified successfully.', 'status_code' => 200];
        }

        if (!$result['valid']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'remaining_attempts' => $result['remaining_attempts'] ?? null,
            ], $result['status_code']);
        }

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => $result['message'],
            'entity_type' => $resolvedType,
        ], 200);
    }

    /**
     * Reset Entity Password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'entity_type' => 'nullable|string|in:business,freelancer,business_entity,freelancer_entity',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed. Password must be at least 6 characters and match confirmation.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = trim($request->input('email'));
        $entityType = $request->input('entity_type');
        $otp = trim($request->input('otp'));
        $newPassword = $request->input('password');

        [$targetEntity, $resolvedType] = $this->resolveTargetEntity($email, $entityType);

        if (!$targetEntity) {
            return response()->json([
                'status' => 'error',
                'message' => 'No registered entity account found for this email address.',
            ], 404);
        }

        // Consume OTP (verifies hash and evicts challenge from cache)
        $consumed = PasswordResetOtpService::consumeOtp('entity_' . $resolvedType, $targetEntity->id, $otp);

        if (!$consumed && Cache::has('entity_reset_otp_' . $email) && Cache::get('entity_reset_otp_' . $email) === $otp) {
            Cache::forget('entity_reset_otp_' . $email);
            $consumed = true;
        }

        if (!$consumed) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired verification code. Please start the password reset process again.',
            ], 400);
        }

        // Update strictly only the targeted entity model
        $targetEntity->password = Hash::make($newPassword);
        $targetEntity->save();

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => 'Password reset successfully! You can now log in with your new credentials.',
            'entity_type' => $resolvedType,
        ], 200);
    }
}
