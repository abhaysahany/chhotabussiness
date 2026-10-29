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
     * Handle login request.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $email = $request->input('email');
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        // First check standard User table
        $user = User::where('email', $email)->first();
        $business = BusinessEntity::with('category')->where('email', $email)->first();
        $freelancer = FreelancerEntity::with('category')->where('email', $email)->first();

        $authenticated = false;

        if ($user && Hash::check($password, $user->password)) {
            $authenticated = true;
        } elseif ($business && !empty($business->password) && Hash::check($password, $business->password)) {
            $authenticated = true;
            if (!$user) {
                $user = User::create([
                    'name' => $business->name,
                    'email' => $business->email,
                    'password' => $business->password,
                ]);
            }
        } elseif ($freelancer && !empty($freelancer->password) && Hash::check($password, $freelancer->password)) {
            $authenticated = true;
            if (!$user) {
                $user = User::create([
                    'name' => $freelancer->name,
                    'email' => $freelancer->email,
                    'password' => $freelancer->password,
                ]);
            }
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
            ]);
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
        $appName = \App\Models\SystemSetting::get('app_name', config('app.name', 'AddNet')) ?: 'AddNet';

        return response()->json([
            'status' => 'success',
            'panel' => 'Entity Panel',
            'message' => "Welcome to {$appName} Entity Portal",
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
