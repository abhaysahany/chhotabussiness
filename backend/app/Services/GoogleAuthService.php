<?php

namespace App\Services;

use Firebase\JWT\BeforeValidException;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\SignatureInvalidException;
use Google\Client as GoogleClient;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class GoogleAuthService
{
    /**
     * Bounded tolerance (in seconds) for system clock skew between identity provider (Google) and host
     */
    public const JWT_CLOCK_SKEW_LEEWAY_SECONDS = 60;

    protected ?GoogleClient $client = null;

    public function __construct(?GoogleClient $client = null)
    {
        $this->client = $client;
    }

    /**
     * Get or initialize Google Client instance
     */
    public function getClient(): GoogleClient
    {
        if ($this->client !== null) {
            return $this->client;
        }

        // Configure bounded leeway on JWT service before client initialization
        if (class_exists(JWT::class)) {
            JWT::$leeway = max(self::JWT_CLOCK_SKEW_LEEWAY_SECONDS, JWT::$leeway);
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');
        $redirectUri = config('services.google.redirect_uri') ?: 'http://localhost:5174';

        if (empty($clientId) || empty($clientSecret)) {
            $missing = [];
            if (empty($clientId)) {
                $missing[] = 'GOOGLE_CLIENT_ID';
            }
            if (empty($clientSecret)) {
                $missing[] = 'GOOGLE_CLIENT_SECRET';
            }
            $missingKeys = implode(', ', $missing);
            throw new RuntimeException("Google authentication service is not configured on the server. Missing: {$missingKeys} in backend/.env.");
        }

        $client = new GoogleClient();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri($redirectUri);

        $this->client = $client;
        return $this->client;
    }

    /**
     * Exchange one-time authorization code with Google token endpoint
     *
     * @param string $code
     * @param string|null $redirectUri For popup UX flow, must match frontend origin
     * @return array
     */
    public function exchangeCode(string $code, ?string $redirectUri = null): array
    {
        $client = $this->getClient();

        if ($redirectUri) {
            $client->setRedirectUri($redirectUri);
        }

        $tokenResponse = $client->fetchAccessTokenWithAuthCode($code);

        if (!is_array($tokenResponse)) {
            throw new InvalidArgumentException('Failed to exchange authorization code with Google.');
        }

        if (isset($tokenResponse['error'])) {
            $errorDescription = $tokenResponse['error_description'] ?? $tokenResponse['error'];
            throw new InvalidArgumentException("Google OAuth error: {$errorDescription}");
        }

        if (empty($tokenResponse['id_token'])) {
            throw new InvalidArgumentException('Google token exchange response did not contain an ID token.');
        }

        return $tokenResponse;
    }

    /**
     * Verify Google ID token signature, issuer, audience, and expiry
     *
     * @param string $idToken
     * @return array Verified claims
     */
    public function verifyIdToken(string $idToken): array
    {
        // Enforce 60s bounded leeway for JWT clock skew tolerance between Google servers and host
        if (class_exists(JWT::class)) {
            JWT::$leeway = max(self::JWT_CLOCK_SKEW_LEEWAY_SECONDS, JWT::$leeway);
        }

        $client = $this->getClient();
        $clientId = config('services.google.client_id');

        try {
            $payload = $client->verifyIdToken($idToken);
        } catch (BeforeValidException $e) {
            throw new InvalidArgumentException('Google ID token timestamp is invalid or in the future: ' . $e->getMessage());
        } catch (ExpiredException $e) {
            throw new InvalidArgumentException('Google ID token has expired.');
        } catch (SignatureInvalidException $e) {
            throw new InvalidArgumentException('Invalid Google ID token signature.');
        } catch (Throwable $e) {
            throw new InvalidArgumentException('Google ID token verification failed: ' . $e->getMessage());
        }

        if (!$payload || !is_array($payload)) {
            throw new InvalidArgumentException('Invalid Google ID token signature or payload.');
        }

        // Validate Audience
        if (!empty($clientId) && isset($payload['aud']) && $payload['aud'] !== $clientId) {
            throw new InvalidArgumentException('Google ID token audience mismatch.');
        }

        // Validate Issuer
        $iss = $payload['iss'] ?? '';
        if ($iss !== 'accounts.google.com' && $iss !== 'https://accounts.google.com') {
            throw new InvalidArgumentException('Google ID token issuer is invalid.');
        }

        // Validate Expiry (with bounded 60-second leeway)
        if (isset($payload['exp']) && ((int) $payload['exp'] + self::JWT_CLOCK_SKEW_LEEWAY_SECONDS) < time()) {
            throw new InvalidArgumentException('Google ID token has expired.');
        }

        // Validate stable Google Subject (sub)
        $sub = $payload['sub'] ?? null;
        if (empty($sub)) {
            throw new InvalidArgumentException('Google ID token does not contain a valid subject (sub) claim.');
        }

        // Validate Email
        $email = $payload['email'] ?? null;
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Google ID token does not contain a valid email address.');
        }

        // Validate email_verified
        $emailVerified = $payload['email_verified'] ?? false;
        if ($emailVerified !== true && $emailVerified !== 'true' && $emailVerified !== 1 && $emailVerified !== '1') {
            throw new InvalidArgumentException('Google account email address is not verified by Google.');
        }

        return [
            'sub' => (string) $sub,
            'email' => strtolower(trim($email)),
            'email_verified' => true,
            'name' => $payload['name'] ?? null,
            'avatar' => $payload['picture'] ?? null,
        ];
    }

    /**
     * Complete authorization code exchange and verification
     *
     * @param string $code
     * @param string|null $redirectUri
     * @return array
     */
    public function verifyGoogleUser(string $code, ?string $redirectUri = null): array
    {
        $tokenResponse = $this->exchangeCode($code, $redirectUri);
        return $this->verifyIdToken($tokenResponse['id_token']);
    }
}
