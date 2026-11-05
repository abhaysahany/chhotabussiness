<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\GoogleAuthService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class GoogleSponsorOnboardingTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => env('DB_DATABASE', 'chhotabiz_test'),
            'services.google.client_id' => 'test-google-client-id',
            'services.google.client_secret' => 'test-google-client-secret',
            'services.google.redirect_uri' => 'http://localhost:5174',
            'services.google.allowed_origins' => ['https://vyaparadnet.com', 'http://localhost:5174', 'http://127.0.0.1:5174'],
        ]);
        User::where('email', 'like', '%@test.com')->delete();
    }

    protected function tearDown(): void
    {
        User::where('email', 'like', '%@test.com')->delete();
        parent::tearDown();
    }

    protected function mockGoogleAuthService(array $identityPayload = [])
    {
        $mock = Mockery::mock(GoogleAuthService::class);
        $mock->shouldReceive('verifyGoogleUser')->andReturn($identityPayload);
        $this->app->instance(GoogleAuthService::class, $mock);
        return $mock;
    }

    public function test_new_google_user_registers_with_pending_onboarding_when_no_sponsor_provided(): void
    {
        $this->mockGoogleAuthService([
            'sub' => 'google_sub_onboard_101',
            'email' => 'onboard.new@test.com',
            'email_verified' => true,
            'name' => 'Onboarding Candidate',
            'avatar' => null,
        ]);

        $response = $this->postJson('/api/auth/google', [
            'code' => 'test_code_onboarding',
            'mode' => 'auto',
            'terms_accepted' => true,
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'user' => [
                    'email' => 'onboard.new@test.com',
                    'sponsor_id' => null,
                    'sponsor_onboarding_status' => 'pending',
                    'has_pending_sponsor_onboarding' => true,
                ],
                'requires_sponsor_onboarding' => true,
            ]);

        $user = User::where('email', 'onboard.new@test.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('pending', $user->sponsor_onboarding_status);
        $this->assertNull($user->sponsor_id);
    }

    public function test_complete_sponsor_onboarding_with_valid_sponsor_succeeds(): void
    {
        $existingSponsor = User::first();

        $user = User::create([
            'name' => 'Pending Google Member',
            'email' => 'pending.member@test.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => null,
            'sponsor_onboarding_status' => 'pending',
            'provider' => 'google',
            'provider_id' => 'google_sub_pending_1',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->postJson('/api/user/complete-sponsor-onboarding', [
            'sponsor_id' => $existingSponsor->user_code,
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Sponsor ID successfully linked to your account!',
                'user' => [
                    'id' => $user->id,
                    'sponsor_id' => $existingSponsor->user_code,
                    'sponsor_onboarding_status' => 'completed',
                    'has_pending_sponsor_onboarding' => false,
                ],
                'requires_sponsor_onboarding' => false,
            ]);

        $user->refresh();
        $this->assertEquals($existingSponsor->user_code, $user->sponsor_id);
        $this->assertEquals('completed', $user->sponsor_onboarding_status);
    }

    public function test_complete_sponsor_onboarding_with_invalid_sponsor_fails(): void
    {
        $user = User::create([
            'name' => 'Pending Member Invalid Test',
            'email' => 'invalid.test@test.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => null,
            'sponsor_onboarding_status' => 'pending',
            'provider' => 'google',
            'provider_id' => 'google_sub_pending_2',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->postJson('/api/user/complete-sponsor-onboarding', [
            'sponsor_id' => 'NONEXISTENT_SPONSOR_XYZ',
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
            ]);

        $user->refresh();
        $this->assertNull($user->sponsor_id);
        $this->assertEquals('pending', $user->sponsor_onboarding_status);
    }

    public function test_complete_sponsor_onboarding_with_self_referral_fails(): void
    {
        $user = User::create([
            'name' => 'Self Ref User',
            'email' => 'selfref@test.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => null,
            'sponsor_onboarding_status' => 'pending',
            'provider' => 'google',
            'provider_id' => 'google_sub_pending_3',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->postJson('/api/user/complete-sponsor-onboarding', [
            'sponsor_id' => $user->user_code,
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'You cannot enter your own Member ID or email as your Sponsor ID.',
            ]);

        $user->refresh();
        $this->assertNull($user->sponsor_id);
        $this->assertEquals('pending', $user->sponsor_onboarding_status);
    }

    public function test_cannot_overwrite_sponsor_if_already_assigned(): void
    {
        $existingSponsor = User::first();

        $user = User::create([
            'name' => 'Already Assigned User',
            'email' => 'assigned@test.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => $existingSponsor->user_code,
            'sponsor_onboarding_status' => 'completed',
            'provider' => 'google',
            'provider_id' => 'google_sub_assigned_1',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->postJson('/api/user/complete-sponsor-onboarding', [
            'sponsor_id' => $existingSponsor->user_code,
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'status' => 'error',
                'message' => 'A sponsor relationship has already been established for this account and cannot be overwritten.',
            ]);
    }

    public function test_skip_sponsor_onboarding_sets_skipped_status_and_leaves_sponsor_null(): void
    {
        $user = User::create([
            'name' => 'Skipping User',
            'email' => 'skipping@test.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => null,
            'sponsor_onboarding_status' => 'pending',
            'provider' => 'google',
            'provider_id' => 'google_sub_skip_1',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->postJson('/api/user/skip-sponsor-onboarding', [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Sponsor onboarding skipped successfully.',
                'user' => [
                    'id' => $user->id,
                    'sponsor_id' => null,
                    'sponsor_onboarding_status' => 'skipped',
                    'has_pending_sponsor_onboarding' => false,
                ],
                'requires_sponsor_onboarding' => false,
            ]);

        $user->refresh();
        $this->assertNull($user->sponsor_id);
        $this->assertEquals('skipped', $user->sponsor_onboarding_status);
    }

    public function test_subsequent_login_of_skipped_user_does_not_require_onboarding(): void
    {
        $user = User::create([
            'name' => 'Already Skipped User',
            'email' => 'alreadyskipped@test.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => null,
            'sponsor_onboarding_status' => 'skipped',
            'provider' => 'google',
            'provider_id' => 'google_sub_alreadyskipped_1',
        ]);

        $this->mockGoogleAuthService([
            'sub' => 'google_sub_alreadyskipped_1',
            'email' => 'alreadyskipped@test.com',
            'email_verified' => true,
            'name' => 'Already Skipped User',
            'avatar' => null,
        ]);

        $response = $this->postJson('/api/auth/google', [
            'code' => 'valid_login_code',
            'mode' => 'login',
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'user' => [
                    'email' => 'alreadyskipped@test.com',
                    'sponsor_onboarding_status' => 'skipped',
                    'has_pending_sponsor_onboarding' => false,
                ],
                'requires_sponsor_onboarding' => false,
            ]);
    }
}
