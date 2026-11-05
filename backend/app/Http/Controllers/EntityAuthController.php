<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
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
     * Handle login request with entity selection and credentials verification.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Both entity login ID / email and password are required.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $loginId = trim($request->input('email'));
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        // Extract entity selection
        $entityKey = $request->input('entity_key') ?? $request->input('entity');
        $entityType = $request->input('entity_type');
        $entityId = $request->input('entity_id');

        if ($entityKey && (empty($entityType) || empty($entityId))) {
            if (str_contains($entityKey, '_')) {
                [$entityType, $entityId] = explode('_', $entityKey, 2);
            }
        }

        // Entity selection is strictly required
        if (empty($entityType) || empty($entityId)) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Please select your registered entity from the dropdown to continue.',
                'error' => 'Please select your registered entity from the dropdown to continue.',
            ], 422);
        }

        $entityType = strtolower(trim($entityType));
        $entityId = (int) $entityId;

        $user = null;
        $business = null;
        $freelancer = null;
        $authenticated = false;

        if ($entityType === 'business') {
            $business = BusinessEntity::with('category')->find($entityId);
            if (!$business) {
                return response()->json([
                    'success' => false,
                    'status' => 'error',
                    'message' => 'The selected business entity was not found in our records.',
                    'error' => 'The selected business entity was not found in our records.',
                ], 422);
            }

            // Verify login ID matches the selected business
            $loginLower = strtolower($loginId);
            $matchesEmail = !empty($business->email) && strtolower(trim($business->email)) === $loginLower;
            $matchesPhone = !empty($business->phone) && trim($business->phone) === $loginId;
            $matchesRegNo = !empty($business->registration_no) && strtolower(trim($business->registration_no)) === $loginLower;

            if (!$matchesEmail && !$matchesPhone && !$matchesRegNo) {
                return response()->json([
                    'success' => false,
                    'status' => 'error',
                    'message' => 'The entered credentials do not belong to the selected business entity.',
                    'error' => 'The entered credentials do not belong to the selected business entity.',
                ], 401);
            }

            // Verify password using Laravel Hash
            $user = User::where('email', $business->email)->first();
            $pwMatchesBusiness = !empty($business->password) && Hash::check($password, $business->password);
            $pwMatchesUser = $user && !empty($user->password) && Hash::check($password, $user->password);

            if ($pwMatchesBusiness || $pwMatchesUser) {
                $authenticated = true;
                // Backfill password on business entity if historically only set on user
                if (!$pwMatchesBusiness && $pwMatchesUser && empty($business->password)) {
                    $business->password = $user->password;
                    $business->save();
                }
            } else {
                return response()->json([
                    'success' => false,
                    'status' => 'error',
                    'message' => 'Invalid password for the selected business entity.',
                    'error' => 'Invalid password for the selected business entity.',
                ], 401);
            }
        } elseif ($entityType === 'freelancer') {
            $freelancer = FreelancerEntity::with('category')->find($entityId);
            if (!$freelancer) {
                return response()->json([
                    'success' => false,
                    'status' => 'error',
                    'message' => 'The selected freelancer entity was not found in our records.',
                    'error' => 'The selected freelancer entity was not found in our records.',
                ], 422);
            }

            // Verify login ID matches the selected freelancer
            $loginLower = strtolower($loginId);
            $matchesEmail = !empty($freelancer->email) && strtolower(trim($freelancer->email)) === $loginLower;
            $matchesPhone = !empty($freelancer->phone) && trim($freelancer->phone) === $loginId;

            if (!$matchesEmail && !$matchesPhone) {
                return response()->json([
                    'success' => false,
                    'status' => 'error',
                    'message' => 'The entered credentials do not belong to the selected freelancer entity.',
                    'error' => 'The entered credentials do not belong to the selected freelancer entity.',
                ], 401);
            }

            // Verify password using Laravel Hash
            $user = User::where('email', $freelancer->email)->first();
            $pwMatchesFreelancer = !empty($freelancer->password) && Hash::check($password, $freelancer->password);
            $pwMatchesUser = $user && !empty($user->password) && Hash::check($password, $user->password);

            if ($pwMatchesFreelancer || $pwMatchesUser) {
                $authenticated = true;
                // Backfill password on freelancer entity if historically only set on user
                if (!$pwMatchesFreelancer && $pwMatchesUser && empty($freelancer->password)) {
                    $freelancer->password = $user->password;
                    $freelancer->save();
                }
            } else {
                return response()->json([
                    'success' => false,
                    'status' => 'error',
                    'message' => 'Invalid password for the selected freelancer entity.',
                    'error' => 'Invalid password for the selected freelancer entity.',
                ], 401);
            }
        } else {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Invalid entity type specified. Must be business or freelancer.',
                'error' => 'Invalid entity type specified.',
            ], 422);
        }

        if ($authenticated && ($business || $freelancer)) {
            $entityDetails = null;
            if ($business) {
                $token = $business->createToken('entity_token')->plainTextToken;
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
                $token = $freelancer->createToken('entity_token')->plainTextToken;
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
                'success' => true,
                'status' => 'success',
                'message' => 'Login successful! Welcome to the Entity Portal.',
                'user' => $userPayload,
                'token' => $token,
            ], 200);
        }

        return response()->json([
            'success' => false,
            'status' => 'error',
            'error' => 'Invalid email or password credentials.',
            'message' => 'Invalid email or password credentials.',
        ], 401);
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

        if (in_array($normalizedType, ['business', 'business_entity'])) {
            $business = BusinessEntity::where('email', $email)->first();
            return [$business, 'business', 'Business Entity'];
        }

        if (in_array($normalizedType, ['freelancer', 'freelancer_entity', 'freelance'])) {
            $freelancer = FreelancerEntity::where('email', $email)->first();
            return [$freelancer, 'freelancer', 'Freelancer'];
        }

        // Backwards compatibility fallback if type was not provided
        $business = BusinessEntity::where('email', $email)->first();
        $freelancer = FreelancerEntity::where('email', $email)->first();

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
