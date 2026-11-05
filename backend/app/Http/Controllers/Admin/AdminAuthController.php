<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Services\PasswordResetOtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class AdminAuthController extends Controller
{
    /**
     * Admin Login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string', // Accepts email or username
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $loginInput = $request->login;

        // Query admin by email OR username
        $admin = Admin::where('email', $loginInput)
            ->orWhere('username', $loginInput)
            ->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid email/username or password credentials.',
            ], 401);
        }

        if ($admin->status !== 'active') {
            return response()->json([
                'status' => 'error',
                'message' => 'Your admin account is currently inactive. Please contact system administrator.',
            ], 403);
        }

        // Issue Sanctum token for Admin
        $token = $admin->createToken('admin_auth_token', ['admin'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Admin login successful!',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'username' => $admin->username,
                'email' => $admin->email,
                'role' => $admin->role,
                'status' => $admin->status,
                'created_at' => $admin->created_at,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 200);
    }

    /**
     * Get Current Authenticated Admin Profile
     */
    public function me(Request $request)
    {
        $admin = $request->user();

        if (!$admin || !($admin instanceof Admin)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated admin session',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'username' => $admin->username,
                'email' => $admin->email,
                'role' => $admin->role,
                'status' => $admin->status,
                'created_at' => $admin->created_at,
            ],
        ]);
    }

    /**
     * Admin Logout
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Admin logged out successfully.',
        ]);
    }

    /**
     * Send OTP for Admin Password Recovery
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string', // Accepts email or username
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please provide your registered admin email or username.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $loginInput = trim($request->login);

        $admin = Admin::where('email', $loginInput)
            ->orWhere('username', $loginInput)
            ->first();

        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'No administrator account found with that email or username.',
            ], 404);
        }

        // Dispatch real email OTP synchronously via PasswordResetOtpService
        $result = PasswordResetOtpService::sendResetOtp(
            accountType: 'admin',
            accountId: $admin->id,
            recipientEmail: $admin->email,
            recipientName: $admin->username,
            accountLabel: 'Administrator'
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
            'admin_username' => $admin->username,
            'masked_email' => $result['masked_email'],
            'expires_in_minutes' => $result['expires_in_minutes'],
        ], 200);
    }

    /**
     * Verify Admin Password Reset OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please provide your admin username/email and the 6-digit OTP.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $loginInput = trim($request->login);
        $otp = trim($request->otp);

        $admin = Admin::where('email', $loginInput)
            ->orWhere('username', $loginInput)
            ->first();

        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Admin account not found.',
            ], 404);
        }

        $result = PasswordResetOtpService::verifyOtp('admin', $admin->id, $otp);

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
        ], 200);
    }

    /**
     * Reset Admin Password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string',
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

        $loginInput = trim($request->login);
        $otp = trim($request->otp);
        $newPassword = $request->password;

        $admin = Admin::where('email', $loginInput)
            ->orWhere('username', $loginInput)
            ->first();

        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Admin account not found.',
            ], 404);
        }

        // Consume OTP (verifies hash and evicts from cache)
        $consumed = PasswordResetOtpService::consumeOtp('admin', $admin->id, $otp);

        if (!$consumed) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired verification code. Please start the password reset process again.',
            ], 400);
        }

        $admin->password = Hash::make($newPassword);
        $admin->save();

        return response()->json([
            'status' => 'success',
            'success' => true,
            'message' => 'Admin password has been reset successfully! You can now log in with your new password.',
        ], 200);
    }
}
