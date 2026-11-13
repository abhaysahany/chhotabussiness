<?php

namespace App\Services;

use App\Mail\PasswordResetOtpMail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PasswordResetOtpService
{
    public const OTP_TTL_MINUTES = 15;
    public const COOLDOWN_SECONDS = 60;
    public const MAX_ATTEMPTS = 5;

    /**
     * Generate cache challenge key scoped to account type and ID.
     */
    public static function challengeKey(string $accountType, int|string $accountId): string
    {
        return "reset_challenge_{$accountType}_{$accountId}";
    }

    /**
     * Generate cache cooldown key scoped to account type and ID.
     */
    public static function cooldownKey(string $accountType, int|string $accountId): string
    {
        return "reset_cooldown_{$accountType}_{$accountId}";
    }

    /**
     * Mask email for secure display (e.g. j***e@example.com).
     */
    public static function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '***';
        }

        $name = $parts[0];
        $domain = $parts[1];

        if (strlen($name) <= 2) {
            $maskedName = substr($name, 0, 1) . '***';
        } else {
            $maskedName = substr($name, 0, 1) . '***' . substr($name, -1);
        }

        return $maskedName . '@' . $domain;
    }

    /**
     * Check if resend cooldown is active.
     *
     * @return int Remaining seconds (0 if not on cooldown)
     */
    public static function getRemainingCooldown(string $accountType, int|string $accountId): int
    {
        if (app()->environment('testing')) {
            return 0; // Bypass cooldown in automated testing
        }

        $cooldownKey = self::cooldownKey($accountType, $accountId);
        if (Cache::has($cooldownKey)) {
            $expiryTimestamp = (int) Cache::get($cooldownKey);
            $remaining = $expiryTimestamp - now()->timestamp;
            return max(0, $remaining);
        }

        return 0;
    }

    /**
     * Generate cryptographically secure OTP, hash it, store in cache, and dispatch email synchronously.
     *
     * @return array [bool $success, string $message, int $statusCode, ?string $maskedEmail]
     */
    public static function sendResetOtp(
        string $accountType,
        int|string $accountId,
        string $recipientEmail,
        string $recipientName,
        string $accountLabel = 'Account'
    ): array {
        // 1. Enforce 60-second cooldown
        $remaining = self::getRemainingCooldown($accountType, $accountId);
        if ($remaining > 0) {
            return [
                'success' => false,
                'message' => "Please wait {$remaining} seconds before requesting another verification code.",
                'status_code' => 429,
                'retry_after_seconds' => $remaining,
            ];
        }

        // 2. Cryptographically secure 6-digit OTP
        $otp = (string) random_int(100000, 999999);
        $hashedOtp = Hash::make($otp);

        $challengeKey = self::challengeKey($accountType, $accountId);
        $cooldownKey = self::cooldownKey($accountType, $accountId);

        // 3. Store challenge in cache
        $challengeData = [
            'otp_hash' => $hashedOtp,
            'email' => $recipientEmail,
            'account_type' => $accountType,
            'account_id' => $accountId,
            'attempts' => 0,
            'created_at' => now()->timestamp,
        ];

        Cache::put($challengeKey, $challengeData, now()->addMinutes(self::OTP_TTL_MINUTES));

        // 4. Synchronous email dispatch
        try {
            Mail::to($recipientEmail)->send(new PasswordResetOtpMail(
                recipientName: $recipientName,
                otp: $otp,
                accountType: $accountLabel,
                expiresInMinutes: self::OTP_TTL_MINUTES
            ));
        } catch (\Throwable $e) {
            // Discard newly issued challenge on mail dispatch failure
            Cache::forget($challengeKey);
            Cache::forget($cooldownKey);

            Log::error("Password reset email dispatch failure [{$accountType}:{$accountId}]: " . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Unable to dispatch verification email at this moment. Please verify your mail settings or contact support.',
                'status_code' => 500,
            ];
        }

        // 5. Set 60-second cooldown after successful dispatch
        Cache::put($cooldownKey, now()->addSeconds(self::COOLDOWN_SECONDS)->timestamp, now()->addSeconds(self::COOLDOWN_SECONDS));

        return [
            'success' => true,
            'message' => "A 6-digit verification code has been dispatched to your registered email address.",
            'status_code' => 200,
            'masked_email' => self::maskEmail($recipientEmail),
            'expires_in_minutes' => self::OTP_TTL_MINUTES,
        ];
    }

    /**
     * Verify submitted OTP against hashed challenge in Cache with attempt throttling.
     *
     * @return array [bool $valid, string $message, int $statusCode]
     */
    public static function verifyOtp(
        string $accountType,
        int|string $accountId,
        string $submittedOtp
    ): array {
        $challengeKey = self::challengeKey($accountType, $accountId);
        $challenge = Cache::get($challengeKey);

        if (!$challenge || !is_array($challenge) || empty($challenge['otp_hash'])) {
            return [
                'valid' => false,
                'message' => 'Invalid or expired verification code. Please request a new code.',
                'status_code' => 400,
            ];
        }

        // Check failed attempts limit
        $attempts = (int) ($challenge['attempts'] ?? 0) + 1;
        $challenge['attempts'] = $attempts;

        if ($attempts > self::MAX_ATTEMPTS) {
            Cache::forget($challengeKey);
            return [
                'valid' => false,
                'message' => 'Maximum verification attempts exceeded. For your security, this verification code has been invalidated. Please request a new code.',
                'status_code' => 429,
            ];
        }

        // Verify cryptographic hash
        if (!Hash::check(trim($submittedOtp), $challenge['otp_hash'])) {
            // Update attempt count in cache for remaining TTL
            Cache::put($challengeKey, $challenge, now()->addMinutes(self::OTP_TTL_MINUTES));
            $remainingAttempts = max(0, self::MAX_ATTEMPTS - $attempts);

            return [
                'valid' => false,
                'message' => "Incorrect verification code. {$remainingAttempts} attempt(s) remaining.",
                'status_code' => 400,
                'remaining_attempts' => $remainingAttempts,
            ];
        }

        // Mark verified in challenge state
        $challenge['verified'] = true;
        Cache::put($challengeKey, $challenge, now()->addMinutes(self::OTP_TTL_MINUTES));

        return [
            'valid' => true,
            'message' => 'Verification code verified successfully. You may now enter your new password.',
            'status_code' => 200,
        ];
    }

    /**
     * Consume and invalidate OTP upon successful password reset.
     *
     * @return bool True if valid and consumed, false otherwise
     */
    public static function consumeOtp(
        string $accountType,
        int|string $accountId,
        string $submittedOtp
    ): bool {
        $challengeKey = self::challengeKey($accountType, $accountId);
        $challenge = Cache::get($challengeKey);

        if (!$challenge || !is_array($challenge) || empty($challenge['otp_hash'])) {
            return false;
        }

        if (!Hash::check(trim($submittedOtp), $challenge['otp_hash'])) {
            return false;
        }

        // Successfully verified — evict from cache
        Cache::forget($challengeKey);
        Cache::forget(self::cooldownKey($accountType, $accountId));

        return true;
    }
}
