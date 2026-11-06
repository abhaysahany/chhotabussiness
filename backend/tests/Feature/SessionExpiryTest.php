<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\User;
use App\Models\PersonalAccessToken;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class SessionExpiryTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config(['session_timeout.idle_timeout_minutes' => 30]);
        config(['session_timeout.absolute_timeout_hours' => 12]);
    }

    public function test_session_config_endpoint_returns_correct_policy()
    {
        $response = $this->getJson('/api/session/config');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'idle_timeout_minutes' => 30,
            'absolute_timeout_hours' => 12,
            'remember_me_enabled' => false,
        ]);
    }

    public function test_active_session_passes_and_can_ping()
    {
        $user = User::first();
        if (!$user) {
            $user = User::create([
                'name' => 'Session User',
                'email' => 'session_test@example.com',
                'password' => bcrypt('password123'),
                'user_code' => 'CB999999',
            ]);
        }

        $tokenResult = $user->createToken('test_session_token');
        $plainToken = $tokenResult->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                         ->postJson('/api/session/ping');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'message' => 'Session active',
            'idle_timeout_minutes' => 30,
            'absolute_timeout_hours' => 12,
        ]);

        $this->assertGreaterThan(0, $response->json('idle_remaining_seconds'));
        $this->assertGreaterThan(0, $response->json('absolute_remaining_seconds'));
    }

    public function test_session_expires_after_inactivity_timeout_and_token_is_revoked()
    {
        $admin = Admin::first();
        $tokenResult = $admin->createToken('admin_test_token');
        $plainToken = $tokenResult->plainTextToken;

        // Simulate 35 minutes of genuine inactivity
        $tokenResult->accessToken->forceFill([
            'last_activity_at' => Carbon::now()->subMinutes(35),
            'created_at' => Carbon::now()->subMinutes(35),
        ])->save();

        $tokenId = $tokenResult->accessToken->id;

        // Attempt to access protected endpoint
        $response = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                         ->getJson('/api/admin/me');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'error',
            'session_expired' => true,
            'expiry_type' => 'idle',
        ]);

        // Assert token was revoked from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);
    }

    public function test_session_expires_after_absolute_timeout_even_with_recent_activity()
    {
        $user = User::first();
        $tokenResult = $user->createToken('user_abs_token');
        $plainToken = $tokenResult->plainTextToken;

        // Simulate token created 13 hours ago (exceeding 12h absolute limit), but with recent activity 2 minutes ago
        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subHours(13),
            'last_activity_at' => Carbon::now()->subMinutes(2),
        ])->save();

        $tokenId = $tokenResult->accessToken->id;

        $response = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                         ->getJson('/api/me');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'error',
            'session_expired' => true,
            'expiry_type' => 'absolute',
        ]);

        // Assert token was revoked from database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);
    }

    public function test_passive_requests_do_not_extend_idle_timeout_but_genuine_activity_does()
    {
        $user = User::first();
        $tokenResult = $user->createToken('activity_test_token');
        $plainToken = $tokenResult->plainTextToken;

        $initialTime = Carbon::now()->subMinutes(10);
        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subMinutes(10),
            'last_activity_at' => $initialTime,
        ])->save();

        // 1. Passive GET request without X-User-Activity
        $this->withHeader('Authorization', 'Bearer ' . $plainToken)
             ->getJson('/api/user/dashboard-stats');

        $tokenResult->accessToken->refresh();
        $this->assertEquals(
            $initialTime->toDateTimeString(),
            $tokenResult->accessToken->last_activity_at->toDateTimeString(),
            'Passive GET request must NOT update last_activity_at'
        );

        // 2. Request with X-User-Activity header
        $this->withHeaders([
            'Authorization' => 'Bearer ' . $plainToken,
            'X-User-Activity' => '1',
        ])->getJson('/api/me');

        $tokenResult->accessToken->refresh();
        $this->assertGreaterThan(
            $initialTime->timestamp,
            $tokenResult->accessToken->last_activity_at->timestamp,
            'Request with X-User-Activity MUST update last_activity_at'
        );
    }
}
