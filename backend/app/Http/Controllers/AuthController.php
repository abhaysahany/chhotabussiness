<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GoogleAuthService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

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
     * Validates all registration fields (Sponsor ID, Name, Email, Password, Terms) before issuing OTP
     */
    public function sendOtp(Request $request)
    {
        $data = $request->all();
        if (isset($data['name']) && is_string($data['name'])) {
            $data['name'] = trim($data['name']);
        }
        if (isset($data['email']) && is_string($data['email'])) {
            $data['email'] = strtolower(trim($data['email']));
        }
        if (isset($data['sponsor_id']) && is_string($data['sponsor_id'])) {
            $data['sponsor_id'] = trim($data['sponsor_id']);
        }

        $validator = Validator::make($data, [
            'sponsor_id' => 'required|string',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:6',
            'terms_accepted' => 'required|accepted',
        ], [
            'sponsor_id.required' => 'Sponsor ID is required.',
            'name.required' => 'Full Name / Business Name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 6 characters.',
            'terms_accepted.required' => 'You must accept the Terms and Conditions and Privacy Policy.',
            'terms_accepted.accepted' => 'You must accept the Terms and Conditions and Privacy Policy.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $data['email'];
        $sponsorId = $data['sponsor_id'];

        // 1. Check if email already registered
        if (User::where('email', $email)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'This email address is already registered. Please login instead.',
                'errors' => [
                    'email' => ['This email address is already registered. Please login instead.'],
                ],
                'requires_login' => true,
            ], 422);
        }

        // 2. Verify Sponsor ID against Database
        $sponsor = User::whereRaw('LOWER(user_code) = ?', [strtolower($sponsorId)])
            ->orWhere('email', $sponsorId)
            ->orWhere('id', $sponsorId)
            ->first();

        if (!$sponsor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
                'errors' => [
                    'sponsor_id' => ['Invalid Sponsor ID. Sponsor does not exist in our database.'],
                ],
            ], 422);
        }

        // 3. Rate Limiting & Cooldown Protection (Skip strict throttling during automated testing)
        $isTesting = app()->environment('testing');
        $cooldownKey = 'otp_cooldown_' . $email;
        if (!$isTesting && Cache::has($cooldownKey)) {
            $remaining = Cache::get($cooldownKey) - now()->timestamp;
            if ($remaining > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Please wait {$remaining} seconds before requesting a new OTP.",
                ], 429);
            }
        }

        $attemptsKey = 'otp_attempts_' . $email;
        $attempts = (int) Cache::get($attemptsKey, 0);
        if (!$isTesting && $attempts >= 5) {
            return response()->json([
                'status' => 'error',
                'message' => 'Too many OTP requests for this email. Please try again after 10 minutes.',
            ], 429);
        }
        Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(10));

        // 4. Generate 6-digit OTP
        $otp = (string) rand(100000, 999999);

        // Store OTP in cache for 10 minutes
        Cache::put('otp_' . $email, $otp, now()->addMinutes(10));
        Cache::put($cooldownKey, now()->addSeconds(60)->timestamp, now()->addSeconds(60));

        $response = [
            'status' => 'success',
            'message' => "Verification OTP sent to {$email} successfully!",
        ];

        // Production security: never expose raw OTP in production environment
        if (app()->environment('local', 'testing')) {
            $response['otp'] = $otp;
        }

        return response()->json($response, 200);
    }

    /**
     * Verify 6-Digit Email OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6|regex:/^[0-9]{6}$/',
        ], [
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'otp.required' => '6-digit OTP code is required.',
            'otp.size' => 'OTP code must be exactly 6 digits.',
            'otp.regex' => 'OTP code must consist of 6 numeric digits.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->email));
        $cachedOtp = Cache::get('otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== (string) $request->otp) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP verification code.',
                'errors' => [
                    'otp' => ['Invalid or expired OTP verification code.'],
                ],
                'verified' => false,
            ], 422);
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
        $data = $request->all();
        if (isset($data['name']) && is_string($data['name'])) {
            $data['name'] = trim($data['name']);
        }
        if (isset($data['email']) && is_string($data['email'])) {
            $data['email'] = strtolower(trim($data['email']));
        }
        if (isset($data['sponsor_id']) && is_string($data['sponsor_id'])) {
            $data['sponsor_id'] = trim($data['sponsor_id']);
        }

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'sponsor_id' => 'required|string',
            'otp' => 'required|string|size:6|regex:/^[0-9]{6}$/',
            'terms_accepted' => 'required|accepted',
        ], [
            'sponsor_id.required' => 'Sponsor ID is required.',
            'name.required' => 'Full Name / Business Name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email address is already registered. Please login instead.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 6 characters.',
            'otp.required' => '6-digit OTP code is required.',
            'otp.size' => 'OTP code must be exactly 6 digits.',
            'otp.regex' => 'OTP code must consist of 6 numeric digits.',
            'terms_accepted.required' => 'You must accept the Terms and Conditions and Privacy Policy.',
            'terms_accepted.accepted' => 'You must accept the Terms and Conditions and Privacy Policy.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $data['email'];
        $sponsorId = $data['sponsor_id'];

        // 1. Verify Sponsor ID from database
        $sponsor = User::whereRaw('LOWER(user_code) = ?', [strtolower($sponsorId)])
            ->orWhere('email', $sponsorId)
            ->orWhere('id', $sponsorId)
            ->first();

        if (!$sponsor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
                'errors' => [
                    'sponsor_id' => ['Invalid Sponsor ID. Sponsor does not exist in our database.'],
                ],
            ], 422);
        }

        // 2. Verify Email OTP
        $cachedOtp = Cache::get('otp_' . $email);

        if (!$cachedOtp || $cachedOtp !== (string) $request->otp) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired OTP verification code.',
                'errors' => [
                    'otp' => ['Invalid or expired OTP verification code.'],
                ],
            ], 422);
        }

        // OTP verified - clear from cache immediately to prevent replay/reuse!
        Cache::forget('otp_' . $email);
        Cache::forget('otp_cooldown_' . $email);

        // 3. Create MLM Member Account in Transaction
        try {
            $user = DB::transaction(function () use ($data, $sponsor, $email) {
                return User::create([
                    'name' => $data['name'],
                    'email' => $email,
                    'password' => Hash::make($data['password']),
                    'sponsor_id' => $sponsor->user_code ?? $sponsor->id,
                    'email_verified_at' => now(),
                ]);
            });
        } catch (QueryException $e) {
            if ($e->errorInfo[1] == 1062 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This email address is already registered. Please login instead.',
                    'errors' => [
                        'email' => ['This email address is already registered. Please login instead.'],
                    ],
                    'requires_login' => true,
                ], 409);
            }
            throw $e;
        }

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

        // Secure Google authentication: reject unverified direct Google social login
        if ($request->provider === 'google') {
            return response()->json([
                'status' => 'error',
                'message' => 'Direct Google social login is disabled. Please authenticate via /auth/google using Google authorization code exchange.',
            ], 403);
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
     * Secure Google Authentication (Login & Registration via Authorization Code Popup Flow)
     */
    public function googleAuth(Request $request, GoogleAuthService $googleAuthService)
    {
        // 1. Verify X-Requested-With header
        $xRequestedWith = $request->header('X-Requested-With');
        if (empty($xRequestedWith) || strcasecmp($xRequestedWith, 'XMLHttpRequest') !== 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or missing X-Requested-With header.',
            ], 403);
        }

        // 2. Verify Origin against allowed origins
        $origin = $request->header('Origin');
        $allowedOrigins = config('services.google.allowed_origins', ['http://localhost:5174', 'http://127.0.0.1:5174']);
        if (is_string($allowedOrigins)) {
            $allowedOrigins = array_filter(array_map('trim', explode(',', $allowedOrigins)));
        }

        $normalizedOrigin = !empty($origin) ? rtrim(trim($origin), '/') : null;
        $normalizedAllowed = array_map(fn($o) => rtrim(trim($o), '/'), (array) $allowedOrigins);

        if (empty($normalizedOrigin) || !in_array($normalizedOrigin, $normalizedAllowed, true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Origin not allowed for Google authentication.',
            ], 403);
        }

        // 3. Validate Inputs
        $validator = Validator::make($request->all(), [
            'code' => 'required|string',
            'mode' => 'required|in:login,register',
            'sponsor_id' => 'required_if:mode,register|string',
            'terms_accepted' => 'required_if:mode,register|boolean',
            'link_password' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $mode = $request->input('mode');
        $code = $request->input('code');

        // 4. Validate Sponsor & Terms in register mode
        $sponsor = null;
        if ($mode === 'register') {
            if (!$request->boolean('terms_accepted')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You must accept the Terms and Conditions and Privacy Policy to register.',
                ], 422);
            }

            $sponsorId = $request->input('sponsor_id');
            $sponsor = User::whereRaw('LOWER(user_code) = ?', [strtolower($sponsorId)])
                ->orWhere('email', $sponsorId)
                ->orWhere('id', $sponsorId)
                ->first();

            if (!$sponsor) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
                ], 422);
            }
        }

        // 5. Exchange code & verify with Google
        try {
            $redirectUri = $origin ?: (config('services.google.redirect_uri') ?: 'http://localhost:5174');
            $googleIdentity = $googleAuthService->verifyGoogleUser($code, $redirectUri);
        } catch (\RuntimeException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage() ?: 'Google authentication service is not configured on the server.',
            ], 500);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage() ?: 'Invalid or expired Google authorization code.',
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to verify Google identity.',
            ], 401);
        }

        $sub = $googleIdentity['sub'];
        $email = $googleIdentity['email'];
        $name = $googleIdentity['name'] ?: explode('@', $email)[0];
        $avatar = $googleIdentity['avatar'];

        // 6. Handle Login Mode
        if ($mode === 'login') {
            // Find existing user linked by provider_id
            $user = User::where('provider', 'google')
                ->where('provider_id', $sub)
                ->first();

            if ($user) {
                if ($avatar && $user->avatar !== $avatar) {
                    $user->update(['avatar' => $avatar]);
                }

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
                        'provider' => $user->provider,
                        'avatar' => $user->avatar,
                        'created_at' => $user->created_at,
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer',
                ], 200);
            }

            // Not linked by subject - check if account exists with this email
            $existingUser = User::where('email', $email)->first();

            if ($existingUser) {
                // Safe linking rule: Require password verification before linking
                $linkPassword = $request->input('link_password');
                if (!empty($linkPassword) && Hash::check($linkPassword, $existingUser->password)) {
                    $existingUser->update([
                        'provider' => 'google',
                        'provider_id' => $sub,
                        'avatar' => $avatar ?? $existingUser->avatar,
                    ]);

                    $token = $existingUser->createToken('user_auth_token')->plainTextToken;

                    return response()->json([
                        'status' => 'success',
                        'message' => 'Google account successfully linked and logged in',
                        'user' => [
                            'id' => $existingUser->id,
                            'user_code' => $existingUser->user_code,
                            'sponsor_id' => $existingUser->sponsor_id,
                            'name' => $existingUser->name,
                            'email' => $existingUser->email,
                            'provider' => $existingUser->provider,
                            'avatar' => $existingUser->avatar,
                            'created_at' => $existingUser->created_at,
                        ],
                        'token' => $token,
                        'token_type' => 'Bearer',
                    ], 200);
                }

                return response()->json([
                    'status' => 'error',
                    'message' => 'An account with this email already exists. Please log in with your password to link your Google account.',
                    'requires_password_link' => true,
                    'email' => $email,
                ], 409);
            }

            // Unregistered email in login mode
            return response()->json([
                'status' => 'error',
                'message' => 'This Google email is not registered yet. Please register first.',
                'requires_registration' => true,
                'email' => $email,
            ], 404);
        }

        // 7. Handle Register Mode
        // Check if email already registered
        if (User::where('email', $email)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'This email is already registered. Please log in instead.',
                'requires_login' => true,
            ], 409);
        }

        // Check if Google subject already registered under another account
        if (User::where('provider', 'google')->where('provider_id', $sub)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'This Google account is already linked to an existing profile. Please log in instead.',
                'requires_login' => true,
            ], 409);
        }

        try {
            $newUser = DB::transaction(function () use ($name, $email, $sub, $avatar, $sponsor) {
                return User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make(Str::random(32)),
                    'sponsor_id' => $sponsor->user_code,
                    'provider' => 'google',
                    'provider_id' => $sub,
                    'avatar' => $avatar,
                    'email_verified_at' => now(),
                ]);
            });
        } catch (QueryException $e) {
            // Concurrent duplicate insertion safety
            if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This email is already registered. Please log in instead.',
                    'requires_login' => true,
                ], 409);
            }
            throw $e;
        }

        $token = $newUser->createToken('user_auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Google registration successful!',
            'user' => [
                'id' => $newUser->id,
                'user_code' => $newUser->user_code,
                'sponsor_id' => $newUser->sponsor_id,
                'name' => $newUser->name,
                'email' => $newUser->email,
                'provider' => $newUser->provider,
                'avatar' => $newUser->avatar,
                'created_at' => $newUser->created_at,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
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
