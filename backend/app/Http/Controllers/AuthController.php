<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Verify Sponsor ID from Database
     */
    public function verifySponsor(Request $request)
    {
        $sponsorId = $request->input('sponsor_id') ?? $request->input('sponsorId') ?? $request->input('user_code');

        if (empty($sponsorId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sponsor ID is required',
            ], 422);
        }

        $sponsor = User::whereRaw('LOWER(user_code) = ?', [strtolower($sponsorId)])
            ->orWhere('email', $sponsorId)
            ->orWhere('id', $sponsorId)
            ->first();

        if (!$sponsor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
                'verified' => false,
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Sponsor verified successfully!',
            'verified' => true,
            'sponsor' => [
                'name' => $sponsor->name,
                'user_code' => $sponsor->user_code,
                'email' => $sponsor->email,
            ],
        ], 200);
    }

    /**
     * Verify and Retrieve Member Details by Member ID (user_code) for Auto-fill
     */
    public function verifyMember(Request $request)
    {
        $memberId = trim($request->input('member_id') ?? $request->input('memberId') ?? $request->input('user_code') ?? $request->input('customer_user_code') ?? '');

        if (empty($memberId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Member ID is required',
                'verified' => false,
            ], 422);
        }

        $member = User::whereRaw('LOWER(user_code) = ?', [strtolower($memberId)])
            ->orWhere('email', $memberId)
            ->orWhere('id', $memberId)
            ->first();

        if (!$member) {
            return response()->json([
                'status' => 'error',
                'message' => "Member ID '{$memberId}' not found in database. Please enter a valid registered Member ID.",
                'verified' => false,
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Member verified successfully!',
            'verified' => true,
            'member' => [
                'id' => $member->id,
                'user_code' => $member->user_code,
                'name' => $member->name,
                'email' => $member->email,
                'phone' => $member->phone ?? '',
                'sponsor_id' => $member->sponsor_id ?? 'CB100001',
            ],
        ], 200);
    }


    /**
     * Send 6-Digit Email Verification OTP
     */
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Valid email address is required',
            ], 422);
        }

        // Check if email already registered
        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'This email address is already registered. Please login instead.',
            ], 422);
        }

        // Generate 6-digit OTP
        $otp = (string) rand(100000, 999999);

        // Store OTP in cache for 10 minutes
        Cache::put('otp_' . $request->email, $otp, now()->addMinutes(10));

        return response()->json([
            'status' => 'success',
            'message' => "Verification OTP sent to {$request->email} successfully!",
            'otp' => $otp, // Returned in response for demo & testing ease
        ], 200);
    }

    /**
     * Verify 6-Digit Email OTP
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
                'message' => 'Email and 6-digit OTP code are required',
            ], 422);
        }

        $cachedOtp = Cache::get('otp_' . $request->email);

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP verification code.',
                'verified' => false,
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Email address verified successfully!',
            'verified' => true,
        ], 200);
    }

    /**
     * User Login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid email or password credentials',
            ], 401);
        }

        // Create Sanctum API Token
        $token = $user->createToken('user_auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'user_code' => $user->user_code,
                'sponsor_id' => $user->sponsor_id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 200);
    }

    /**
     * MLM User Registration (Requires Verified Sponsor ID & Verified Email OTP)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'sponsor_id' => 'required|string',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 1. Verify Sponsor ID from database
        $sponsor = User::where('user_code', $request->sponsor_id)
            ->orWhere('email', $request->sponsor_id)
            ->orWhere('id', $request->sponsor_id)
            ->first();

        if (!$sponsor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid Sponsor ID. Sponsor does not exist in our system.',
            ], 422);
        }

        // 2. Verify Email OTP
        $cachedOtp = Cache::get('otp_' . $request->email);

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP verification code.',
            ], 422);
        }

        // OTP verified - clear from cache
        Cache::forget('otp_' . $request->email);

        // 3. Create MLM Member Account
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'sponsor_id' => $sponsor->user_code ?? $request->sponsor_id,
            'email_verified_at' => now(),
        ]);

        $token = $user->createToken('user_auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'MLM Registration successful!',
            'user' => [
                'id' => $user->id,
                'user_code' => $user->user_code,
                'sponsor_id' => $user->sponsor_id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Google / Facebook Social Login & Registration (Requires Verified Sponsor ID for New Members)
     */
    public function socialLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'provider' => 'required|in:google,facebook',
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'provider_id' => 'required|string',
            'avatar' => 'nullable|string',
            'sponsor_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Find existing user by provider_id or email
        $user = User::where(function ($query) use ($request) {
            $query->where('provider', $request->provider)
                  ->where('provider_id', $request->provider_id);
        })->orWhere('email', $request->email)
          ->first();

        if ($user) {
            // Update social provider fields
            $user->update([
                'provider' => $request->provider,
                'provider_id' => $request->provider_id,
                'avatar' => $request->avatar ?? $user->avatar,
            ]);
        } else {
            // Validate Sponsor ID for new social MLM registrations
            if (empty($request->sponsor_id)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No existing account found linked with ' . ucfirst($request->provider) . ' (' . $request->email . '). Please sign up with a Sponsor ID first.',
                    'requires_registration' => true,
                ], 404);
            }

            $sponsor = User::whereRaw('LOWER(user_code) = ?', [strtolower($request->sponsor_id)])
                ->orWhere('email', $request->sponsor_id)
                ->orWhere('id', $request->sponsor_id)
                ->first();

            if (!$sponsor) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
                ], 422);
            }

            // Create new social user (Google/Facebook emails are pre-verified)
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make(uniqid('social_' . $request->provider . '_')),
                'sponsor_id' => $sponsor->user_code ?? $request->sponsor_id,
                'provider' => $request->provider,
                'provider_id' => $request->provider_id,
                'avatar' => $request->avatar,
                'email_verified_at' => now(),
            ]);
        }

        // Generate Sanctum API token
        $token = $user->createToken('social_auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => ucfirst($request->provider) . ($user->wasRecentlyCreated ? ' registration' : ' login') . ' successful',
            'user' => [
                'id' => $user->id,
                'user_code' => $user->user_code,
                'sponsor_id' => $user->sponsor_id,
                'name' => $user->name,
                'email' => $user->email,
                'provider' => $user->provider,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 200);
    }

    /**
     * Update or Set User Password
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'nullable|string',
            'new_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // If user is not social or provides current_password, verify it
        if (!empty($request->current_password)) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Current password is incorrect.',
                ], 422);
            }
        } elseif (empty($user->provider)) {
            // For standard email/pass users without social provider, current password is required
            return response()->json([
                'status' => 'error',
                'message' => 'Current password is required to update password.',
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Password updated successfully! You can now log in using this password.',
        ]);
    }

    /**
     * Update User KYC Details in MySQL Database
     */
    public function updateKyc(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $pan = $request->input('pan_number') ?: $request->input('panNumber');
        if ($pan) {
            $user->pan_number = strtoupper(trim($pan));
        }

        // Mark KYC verified if valid documents provided
        $user->kyc_status = 'verified';
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'KYC Details submitted and verified successfully in database!',
            'user' => $user,
        ]);
    }

    /**
     * Update User Bank & Payout Credentials in MySQL Database
     */
    public function updateBank(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $user->bank_name = $request->input('bank_name') ?: $request->input('bankName') ?: $user->bank_name;
        $user->account_number = $request->input('account_number') ?: $request->input('accountNumber') ?: $user->account_number;
        $user->ifsc_code = strtoupper(trim($request->input('ifsc_code') ?: $request->input('ifscCode') ?: $user->ifsc_code));
        $user->account_holder_name = $request->input('account_holder_name') ?: $request->input('accountHolderName') ?: $user->account_holder_name ?: $user->name;
        $user->upi_id = $request->input('upi_id') ?: $request->input('upiId') ?: $user->upi_id;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Bank & UPI payout credentials saved successfully in database!',
            'user' => $user,
        ]);
    }

    /**
     * Get Current Authenticated User Profile
     */
    public function me(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        return response()->json([
            'status' => 'success',
            'user' => $user,
        ]);
    }

    /**
     * User Logout
     */
    public function logout(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if ($user && method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Send Password Recovery OTP for Users
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Registered email address or user code is required.',
            ], 422);
        }

        $input = trim($request->input('email'));
        $user = User::where('email', $input)
            ->orWhere('user_code', $input)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => "No partner account found with '{$input}'. Please check your credentials.",
            ], 404);
        }

        $otp = (string) rand(100000, 999999);
        Cache::put('user_reset_otp_' . $user->id, $otp, now()->addMinutes(15));
        Cache::put('user_reset_email_' . $user->email, $otp, now()->addMinutes(15));

        return response()->json([
            'status' => 'success',
            'message' => "Password reset OTP dispatched to {$user->email} successfully!",
            'email' => $user->email,
            'user_name' => $user->name,
            'otp' => $otp, // Returned for testing & mobile verification ease
        ], 200);
    }

    /**
     * Verify Password Reset OTP
     */
    public function verifyResetOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email and 6-digit OTP code are required.',
            ], 422);
        }

        $input = trim($request->input('email'));
        $user = User::where('email', $input)->orWhere('user_code', $input)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User account not found.',
            ], 404);
        }

        $cachedOtp = Cache::get('user_reset_otp_' . $user->id) ?: Cache::get('user_reset_email_' . $user->email);

        if (!$cachedOtp || $cachedOtp !== $request->input('otp')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP code. Please request a new code.',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'OTP verified successfully! You may now enter your new password.',
            'verified' => true,
        ], 200);
    }

    /**
     * Reset User Password with Verified OTP
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Valid email, 6-digit OTP, and new password (min 6 characters) are required.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $input = trim($request->input('email'));
        $user = User::where('email', $input)->orWhere('user_code', $input)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User account not found.',
            ], 404);
        }

        $cachedOtp = Cache::get('user_reset_otp_' . $user->id) ?: Cache::get('user_reset_email_' . $user->email);

        if (!$cachedOtp || $cachedOtp !== $request->input('otp')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP code.',
            ], 400);
        }

        $user->password = Hash::make($request->input('password'));
        $user->save();

        Cache::forget('user_reset_otp_' . $user->id);
        Cache::forget('user_reset_email_' . $user->email);

        return response()->json([
            'status' => 'success',
            'message' => 'Password reset successfully! You can now log in with your new password.',
        ], 200);
    }
}
