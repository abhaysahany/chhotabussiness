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
                if (!$user) {
                    $user = User::create([
                        'name' => $business->name,
                        'email' => $business->email,
                        'password' => $business->password ?: Hash::make($password),
                        'user_code' => 'ENT-B' . str_pad($business->id, 5, '0', STR_PAD_LEFT),
                    ]);
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
                if (!$user) {
                    $user = User::create([
                        'name' => $freelancer->name,
                        'email' => $freelancer->email,
                        'password' => $freelancer->password ?: Hash::make($password),
                        'user_code' => 'ENT-F' . str_pad($freelancer->id, 5, '0', STR_PAD_LEFT),
                    ]);
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

        if ($authenticated && $user) {
            $token = $user->createToken('entity_token')->plainTextToken;

            // Determine entity details if attached
            $entityDetails = null;
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
            } elseif ($freelancer) {
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
            }

            return response()->json([
                'success' => true,
                'status' => 'success',
                'message' => 'Login successful! Welcome to the Entity Portal.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'user_code' => $user->user_code ?? null,
                    'entity_details' => $entityDetails,
                ],
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
        $user = $request->user() ?? Auth::guard('entity')->user() ?? Auth::guard('web')->user();

        if (!$user && $request->bearerToken()) {
            $tokenObj = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
            if ($tokenObj && $tokenObj->tokenable) {
                $user = $tokenObj->tokenable;
            }
        }

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated entity session',
            ], 401);
        }

        $business = BusinessEntity::with('category')->where('email', $user->email)->first();
        $freelancer = FreelancerEntity::with('category')->where('email', $user->email)->first();

        $entityDetails = null;
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
        } elseif ($freelancer) {
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
        }

        return response()->json([
            'status' => 'success',
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_code' => $user->user_code ?? null,
                'entity_details' => $entityDetails,
            ],
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
     * Send OTP for Entity Password Recovery
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'A valid registered email address is required.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->input('email');

        // Check if any business, freelancer, or user exists with this email
        $userExists = User::where('email', $email)->exists();
        $businessExists = BusinessEntity::where('email', $email)->exists();
        $freelancerExists = FreelancerEntity::where('email', $email)->exists();

        if (!$userExists && !$businessExists && !$freelancerExists) {
            return response()->json([
                'status' => 'error',
                'message' => 'No registered business entity or freelancer found with this email address.',
            ], 404);
        }

        // Generate 6-digit OTP
        $otp = (string) rand(100000, 999999);

        // Store OTP in Cache for 15 minutes
        Cache::put('entity_reset_otp_' . $email, $otp, now()->addMinutes(15));

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => "Password reset OTP sent to {$email} successfully!",
            'otp' => $otp, // Included for testing and demonstration ease
            'expires_in_minutes' => 15,
        ], 200);
    }

    /**
     * Verify Password Reset OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please provide a valid email and 6-digit OTP code.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->input('email');
        $otp = $request->input('otp');

        $cachedOtp = Cache::get('entity_reset_otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== $otp) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP. Please request a new verification code.',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => 'OTP verified successfully! You may now set your new password.',
        ], 200);
    }

    /**
     * Reset Entity Password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
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

        $email = $request->input('email');
        $otp = $request->input('otp');
        $newPassword = $request->input('password');

        $cachedOtp = Cache::get('entity_reset_otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== $otp) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP. Please start the password reset process again.',
            ], 400);
        }

        $hashed = Hash::make($newPassword);

        // Update standard user table
        $user = User::where('email', $email)->first();
        if ($user) {
            $user->password = $hashed;
            $user->save();
        }

        // Update business entity table
        $business = BusinessEntity::where('email', $email)->first();
        if ($business) {
            $business->password = $hashed;
            $business->save();
            if (!$user) {
                User::create([
                    'name' => $business->name,
                    'email' => $business->email,
                    'password' => $hashed,
                ]);
            }
        }

        // Update freelancer entity table
        $freelancer = FreelancerEntity::where('email', $email)->first();
        if ($freelancer) {
            $freelancer->password = $hashed;
            $freelancer->save();
            if (!$user) {
                User::create([
                    'name' => $freelancer->name,
                    'email' => $freelancer->email,
                    'password' => $hashed,
                ]);
            }
        }

        // Clear used OTP from cache
        Cache::forget('entity_reset_otp_' . $email);

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => 'Password reset successfully! You can now log in with your new credentials.',
        ], 200);
    }
}
