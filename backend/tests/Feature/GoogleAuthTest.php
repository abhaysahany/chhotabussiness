<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\GoogleAuthService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'chhotabiz',
            'services.google.client_id' => 'test-google-client-id',
            'services.google.client_secret' => 'test-google-client-secret',
            'services.google.redirect_uri' => 'http://localhost:5174',
            'services.google.allowed_origins' => ['http://localhost:5174', 'http://127.0.0.1:5174'],
        ]);
        User::where('email', 'like', '%@test.com')->delete();
    }

    protected function tearDown(): void
    {
        User::where('email', 'like', '%@test.com')->delete();
        parent::tearDown();
    }

    /**
     * Helper to mock GoogleAuthService
     */
    protected function mockGoogleAuthService(array $identityPayload = [], ?\Exception $exception = null)
    {
        $mock = Mockery::mock(GoogleAuthService::class);

        if ($exception) {
            $mock->shouldReceive('verifyGoogleUser')
                ->andThrow($exception);
        } else {
            $mock->shouldReceive('verifyGoogleUser')
                ->andReturn($identityPayload);
        }

        $this->app->instance(GoogleAuthService::class, $mock);
        return $mock;
    }

    public function test_request_missing_x_requested_with_header_is_rejected(): void
    {
        $response = $this->postJson('/api/auth/google', [
            'code' => 'test_code',
            'mode' => 'login',
        ], [
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid or missing X-Requested-With header.',
            ]);
    }

    public function test_request_from_disallowed_origin_is_rejected(): void
    {
        $response = $this->postJson('/api/auth/google', [
            'code' => 'test_code',
            'mode' => 'login',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'https://malicious-site.com',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Origin not allowed for Google authentication.',
            ]);
    }

    public function test_missing_configuration_returns_actionable_500_message(): void
    {
        config([
            'services.google.client_id' => null,
            'services.google.client_secret' => null,
        ]);

        $response = $this->postJson('/api/auth/google', [
            'code' => 'test_code',
            'mode' => 'login',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(500)
            ->assertJson([
                'status' => 'error',
                'message' => 'Google authentication service is not configured on the server. Missing: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET in backend/.env.',
            ]);
    }

    public function test_invalid_or_expired_authorization_code_is_rejected(): void
    {
        $this->mockGoogleAuthService([], new \InvalidArgumentException('Invalid or expired Google authorization code.'));

        $response = $this->postJson('/api/auth/google', [
            'code' => 'expired_code_123',
            'mode' => 'login',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid or expired Google authorization code.',
            ]);
    }

    public function test_unverified_email_claims_are_rejected(): void
    {
        $this->mockGoogleAuthService([], new \InvalidArgumentException('Google account email address is not verified by Google.'));

        $response = $this->postJson('/api/auth/google', [
            'code' => 'unverified_email_code',
            'mode' => 'login',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'status' => 'error',
                'message' => 'Google account email address is not verified by Google.',
            ]);
    }

    public function test_valid_authorization_code_for_existing_linked_google_user_logs_in(): void
    {
        $user = User::create([
            'name' => 'Existing Google Member',
            'email' => 'existing.google@test.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => 'CB100001',
            'provider' => 'google',
            'provider_id' => 'google_sub_linked_123',
            'avatar' => 'https://example.com/avatar.jpg',
        ]);

        $this->mockGoogleAuthService([
            'sub' => 'google_sub_linked_123',
            'email' => 'existing.google@test.com',
            'email_verified' => true,
            'name' => 'Existing Google Member',
            'avatar' => 'https://example.com/new_avatar.jpg',
        ]);

        $response = $this->postJson('/api/auth/google', [
            'code' => 'valid_auth_code_linked',
            'mode' => 'login',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'email' => 'existing.google@test.com',
                    'provider' => 'google',
                ],
                'token_type' => 'Bearer',
            ]);

        $this->assertNotEmpty($response->json('token'));

        // Repeat login does not duplicate user
        $this->assertEquals(1, User::where('provider', 'google')->where('provider_id', 'google_sub_linked_123')->count());
    }

    public function test_google_login_for_unregistered_email_returns_404_and_registration_guidance(): void
    {
        $this->mockGoogleAuthService([
            'sub' => 'google_sub_unregistered_999',
            'email' => 'unregistered.user@test.com',
            'email_verified' => true,
            'name' => 'Unregistered User',
            'avatar' => null,
        ]);

        $response = $this->postJson('/api/auth/google', [
            'code' => 'valid_code_unregistered',
            'mode' => 'login',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'This Google email is not registered yet. Please register first.',
                'requires_registration' => true,
                'email' => 'unregistered.user@test.com',
            ]);

        $this->assertDatabaseMissing('users', [
            'email' => 'unregistered.user@test.com',
        ]);
    }

    public function test_google_login_for_unlinked_existing_email_requires_password_link(): void
    {
        // Existing standard email/password user
        User::create([
            'name' => 'Standard Email User',
            'email' => 'standard.user@test.com',
            'password' => Hash::make('secretpassword'),
            'sponsor_id' => 'CB100001',
            'provider' => null,
            'provider_id' => null,
        ]);

        $this->mockGoogleAuthService([
            'sub' => 'google_sub_unlinked_456',
            'email' => 'standard.user@test.com',
            'email_verified' => true,
            'name' => 'Standard Email User',
            'avatar' => null,
        ]);

        // Attempt login without password -> returns 409 requires_password_link
        $response = $this->postJson('/api/auth/google', [
            'code' => 'valid_code_unlinked',
            'mode' => 'login',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(409)
            ->assertJson([
                'status' => 'error',
                'message' => 'An account with this email already exists. Please log in with your password to link your Google account.',
                'requires_password_link' => true,
                'email' => 'standard.user@test.com',
            ]);

        // Provider fields must NOT have been blindly overwritten
        $userCheck = User::where('email', 'standard.user@test.com')->first();
        $this->assertNull($userCheck->provider);
        $this->assertNull($userCheck->provider_id);

        // Providing valid password links the account securely
        $linkResponse = $this->postJson('/api/auth/google', [
            'code' => 'valid_code_unlinked',
            'mode' => 'login',
            'link_password' => 'secretpassword',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $linkResponse->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'user' => [
                    'email' => 'standard.user@test.com',
                    'provider' => 'google',
                ],
            ]);

        $this->assertNotEmpty($linkResponse->json('token'));
        $userCheck->refresh();
        $this->assertEquals('google', $userCheck->provider);
        $this->assertEquals('google_sub_unlinked_456', $userCheck->provider_id);
    }

    public function test_google_register_creates_one_user_when_valid_sponsor_and_terms_accepted(): void
    {
        $sponsor = User::first(); // Use existing sponsor (e.g. CB100001)

        $this->mockGoogleAuthService([
            'sub' => 'google_sub_new_user_789',
            'email' => 'brandnew.google@test.com',
            'email_verified' => true,
            'name' => 'Brand New Google User',
            'avatar' => 'https://example.com/new_user_avatar.jpg',
        ]);

        $response = $this->postJson('/api/auth/google', [
            'code' => 'valid_code_registration',
            'mode' => 'register',
            'sponsor_id' => $sponsor->user_code,
            'terms_accepted' => true,
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Google registration successful!',
                'user' => [
                    'email' => 'brandnew.google@test.com',
                    'provider' => 'google',
                    'sponsor_id' => $sponsor->user_code,
                ],
                'token_type' => 'Bearer',
            ]);

        $this->assertNotEmpty($response->json('token'));

        $created = User::where('email', 'brandnew.google@test.com')->first();
        $this->assertNotNull($created);
        $this->assertEquals('google', $created->provider);
        $this->assertEquals('google_sub_new_user_789', $created->provider_id);
        $this->assertNotNull($created->email_verified_at);
        $this->assertNotEmpty($created->password);
    }

    public function test_google_register_without_terms_acceptance_fails(): void
    {
        $sponsor = User::first();

        $response = $this->postJson('/api/auth/google', [
            'code' => 'any_code',
            'mode' => 'register',
            'sponsor_id' => $sponsor->user_code,
            'terms_accepted' => false,
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'You must accept the Terms and Conditions and Privacy Policy to register.',
            ]);
    }

    public function test_google_register_without_valid_sponsor_fails(): void
    {
        $response = $this->postJson('/api/auth/google', [
            'code' => 'any_code',
            'mode' => 'register',
            'sponsor_id' => 'INVALID_SPONSOR_XYZ',
            'terms_accepted' => true,
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
            ]);
    }

    public function test_google_register_with_existing_email_returns_409_conflict(): void
    {
        $sponsor = User::first();
        User::create([
            'name' => 'Pre-existing Member',
            'email' => 'duplicate.email@test.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => $sponsor->user_code,
        ]);

        $this->mockGoogleAuthService([
            'sub' => 'google_sub_different_999',
            'email' => 'duplicate.email@test.com',
            'email_verified' => true,
            'name' => 'Duplicate Attempt',
            'avatar' => null,
        ]);

        $response = $this->postJson('/api/auth/google', [
            'code' => 'code_for_duplicate_email',
            'mode' => 'register',
            'sponsor_id' => $sponsor->user_code,
            'terms_accepted' => true,
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(409)
            ->assertJson([
                'status' => 'error',
                'message' => 'This email is already registered. Please log in instead.',
                'requires_login' => true,
            ]);

        // Verify count didn't increase
        $this->assertEquals(1, User::where('email', 'duplicate.email@test.com')->count());
    }

    public function test_direct_google_payload_to_social_login_route_is_blocked_with_403(): void
    {
        $response = $this->postJson('/api/auth/social-login', [
            'provider' => 'google',
            'email' => 'attacker.victim@test.com',
            'name' => 'Attacker',
            'provider_id' => 'fake_google_id_123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Direct Google social login is disabled. Please authenticate via /auth/google using Google authorization code exchange.',
            ]);
    }

    public function test_standard_email_password_login_remains_functional(): void
    {
        $user = User::create([
            'name' => 'Standard Login User',
            'email' => 'standard.login@test.com',
            'password' => Hash::make('correct_password_123'),
            'sponsor_id' => 'CB100001',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'standard.login@test.com',
            'password' => 'correct_password_123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Login successful',
                'user' => [
                    'email' => 'standard.login@test.com',
                ],
            ]);

        $this->assertNotEmpty($response->json('token'));
    }
}
