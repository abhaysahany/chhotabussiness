<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Centralized cryptographically secure random Member ID generator.
 *
 * Generates unique MLM Member IDs in the format `CB` + 7 random digits
 * (e.g. CB9848484) with bounded collision retries and DB uniqueness protection.
 */
class MemberIdGeneratorService
{
    public const PREFIX = 'CB';
    public const MIN_NUMBER = 1000000;
    public const MAX_NUMBER = 9999999;
    public const MAX_GENERATION_ATTEMPTS = 25;
    public const MAX_CONCURRENT_RETRIES = 10;

    /**
     * Generate a single candidate Member ID using PHP's CSPRNG.
     */
    public function generateCandidate(): string
    {
        return self::PREFIX . random_int(self::MIN_NUMBER, self::MAX_NUMBER);
    }

    /**
     * Check whether a string matches the new random Member ID format (CB + 7 digits).
     */
    public function isValidFormat(string $code): bool
    {
        return (bool) preg_match('/^CB\d{7}$/', $code);
    }

    /**
     * Check if a Member ID already exists in the users table.
     */
    public function codeExists(string $code): bool
    {
        return User::where('user_code', $code)->exists();
    }

    /**
     * Generate an unused random Member ID with bounded pre-insert collision checks.
     *
     * @throws RuntimeException When an unused ID cannot be found within maxAttempts.
     */
    public function generateUniqueCode(
        int $maxAttempts = self::MAX_GENERATION_ATTEMPTS,
        ?callable $candidateGenerator = null
    ): string {
        $generator = $candidateGenerator ?? fn (): string => $this->generateCandidate();

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $candidate = (string) $generator($attempt);

            if ($this->isValidFormat($candidate) && !$this->codeExists($candidate)) {
                return $candidate;
            }
        }

        throw new RuntimeException(
            "Unable to generate a unique Member ID after {$maxAttempts} attempts."
        );
    }

    /**
     * Persist a new User with a unique random Member ID, retrying safely on
     * database UNIQUE constraint collisions caused by concurrent registrations.
     *
     * @throws RuntimeException When concurrent collision retries are exhausted.
     * @throws QueryException When a non-user_code database error (e.g. duplicate email) occurs.
     */
    public function createMemberWithUniqueId(
        array $attributes,
        int $maxInsertAttempts = self::MAX_CONCURRENT_RETRIES,
        ?callable $candidateGenerator = null
    ): User {
        $hasExplicitCode = !empty($attributes['user_code']);

        for ($attempt = 1; $attempt <= $maxInsertAttempts; $attempt++) {
            $payload = $attributes;
            $generatedCode = null;

            if (!$hasExplicitCode) {
                $generatedCode = $this->generateUniqueCode(
                    self::MAX_GENERATION_ATTEMPTS,
                    $candidateGenerator
                );
                $payload['user_code'] = $generatedCode;
            }

            try {
                return DB::transaction(function () use ($payload) {
                    return User::create($payload);
                });
            } catch (QueryException $e) {
                if (!$hasExplicitCode && $this->isUserCodeUniqueViolation($e, $generatedCode)) {
                    if ($attempt < $maxInsertAttempts) {
                        continue;
                    }

                    throw new RuntimeException(
                        'Unable to assign a unique Member ID due to concurrent collision after maximum retries.',
                        0,
                        $e
                    );
                }

                throw $e;
            }
        }

        throw new RuntimeException('Unable to create member with a unique Member ID.');
    }

    /**
     * Determine whether a QueryException was specifically caused by a user_code UNIQUE violation.
     */
    public function isUserCodeUniqueViolation(QueryException $e, ?string $attemptedCode = null): bool
    {
        $sqlState = (string) ($e->errorInfo[0] ?? $e->getCode());
        $driverCode = (int) ($e->errorInfo[1] ?? 0);
        $message = $e->getMessage();

        $isUniqueError =
            $driverCode === 1062 ||
            $driverCode === 19 ||
            $sqlState === '23000' ||
            str_contains($message, 'Duplicate entry') ||
            str_contains($message, 'UNIQUE constraint failed');

        if (!$isUniqueError) {
            return false;
        }

        // Email unique collisions must propagate so callers can return 409 "email already exists"
        if (str_contains($message, 'users_email_unique') || str_contains($message, 'users.email')) {
            return false;
        }

        if (
            str_contains($message, 'users_user_code_unique') ||
            str_contains($message, 'users.user_code') ||
            str_contains($message, 'user_code')
        ) {
            return true;
        }

        if ($attemptedCode !== null && str_contains($message, "'{$attemptedCode}'")) {
            return true;
        }

        return false;
    }
}
