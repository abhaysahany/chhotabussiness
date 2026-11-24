<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\User;
use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\PersonalAccessToken;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;

class SessionExpiryTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config(['session_timeout.idle_timeout_minutes' => 120]);
        config(['session_timeout.absolute_timeout_hours' => 2]);
        config(['sanctum.expiration' => 120]);
    }

    public function test_session_config_endpoint_returns_120_minutes_policy()
    {
        $response = $this->getJson('/api/session/config');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'idle_timeout_minutes' => 120,
            'absolute_timeout_hours' => 2,
            'remember_me_enabled' => false,
        ]);
    }

    public function test_active_session_passes_and_can_ping()
    {
        $user = User::first() ?? User::create([
            'name' => 'Session User',
            'email' => 'session_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);

        $tokenResult = $user->createToken('test_session_token');
        $plainToken = $tokenResult->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                         ->postJson('/api/session/ping');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'message' => 'Session active',
            'idle_timeout_minutes' => 120,
            'absolute_timeout_hours' => 2,
        ]);

        $this->assertGreaterThan(0, $response->json('idle_remaining_seconds'));
        $this->assertGreaterThan(0, $response->json('absolute_remaining_seconds'));
    }

    /**
     * ADMIN PANEL: Valid session before 120 minutes & authoritative rejection after 120 minutes
     */
    public function test_admin_session_validity_and_120_minute_expiration()
    {
        $admin = Admin::first() ?? Admin::create([
            'name' => 'Admin Test',
            'username' => 'admin_test_' . uniqid(),
            'email' => 'admin_' . uniqid() . '@example.com',
            'password' => bcrypt('AdminPass123!'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        // 1. Session valid before 120 minutes (e.g. at 60 minutes)
        $tokenResult = $admin->createToken('admin_auth_token', ['admin']);
        $plainToken = $tokenResult->plainTextToken;
        $tokenId = $tokenResult->accessToken->id;

        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subMinutes(60),
            'last_activity_at' => Carbon::now()->subMinutes(60),
        ])->save();

        $validRes = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                         ->getJson('/api/admin/me');
        $validRes->assertStatus(200);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $tokenId]);

        // 2. Session expired after 120 minutes (e.g. 125 minutes)
        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subMinutes(125),
            'last_activity_at' => Carbon::now()->subMinutes(5), // even with recent activity
        ])->save();

        $expiredRes = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                           ->getJson('/api/admin/me');
        $expiredRes->assertStatus(401);
        $expiredRes->assertJson([
            'status' => 'error',
            'session_expired' => true,
            'expiry_type' => 'absolute',
        ]);

        // Token must be authoritatively revoked from DB
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);

        // 3. Re-login capability
        $newTokenResult = $admin->createToken('admin_auth_token', ['admin']);
        $reloginRes = $this->withHeader('Authorization', 'Bearer ' . $newTokenResult->plainTextToken)
                           ->getJson('/api/admin/me');
        $reloginRes->assertStatus(200);
    }

    /**
     * USER PANEL: Valid session before 120 minutes & authoritative rejection after 120 minutes
     */
    public function test_user_session_validity_and_120_minute_expiration()
    {
        $user = User::first() ?? User::create([
            'name' => 'User Test',
            'email' => 'user_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);

        // 1. Session valid before 120 minutes (e.g. at 45 minutes)
        $tokenResult = $user->createToken('user_auth_token');
        $plainToken = $tokenResult->plainTextToken;
        $tokenId = $tokenResult->accessToken->id;

        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subMinutes(45),
            'last_activity_at' => Carbon::now()->subMinutes(10),
        ])->save();

        $validRes = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                         ->getJson('/api/me');
        $validRes->assertStatus(200);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $tokenId]);

        // 2. Session expired after 120 minutes (e.g. 130 minutes)
        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subMinutes(130),
            'last_activity_at' => Carbon::now()->subMinutes(2),
        ])->save();

        $expiredRes = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                           ->getJson('/api/me');
        $expiredRes->assertStatus(401);
        $expiredRes->assertJson([
            'status' => 'error',
            'session_expired' => true,
            'expiry_type' => 'absolute',
        ]);

        // Token must be authoritatively revoked from DB
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);

        // 3. Re-login capability
        $newTokenResult = $user->createToken('user_auth_token');
        $reloginRes = $this->withHeader('Authorization', 'Bearer ' . $newTokenResult->plainTextToken)
                           ->getJson('/api/me');
        $reloginRes->assertStatus(200);
    }

    /**
     * ENTITY PANEL: Valid session before 120 minutes & authoritative rejection after 120 minutes
     */
    public function test_entity_session_validity_and_120_minute_expiration()
    {
        $category = EntityCategory::first() ?? EntityCategory::create([
            'name' => 'General Business',
            'slug' => 'general-business-' . uniqid(),
        ]);

        $entity = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Test Corp ' . uniqid(),
            'owner_name' => 'John Doe',
            'email' => 'entity_' . uniqid() . '@example.com',
            'phone' => '98' . rand(10000000, 99999999),
            'registration_no' => 'REG-' . rand(1000, 9999),
            'password' => Hash::make('SecretPass123!'),
            'verification_status' => 'verified',
        ]);

        // 1. Session valid before 120 minutes (e.g. at 50 minutes)
        $tokenResult = $entity->createToken('entity_token');
        $plainToken = $tokenResult->plainTextToken;
        $tokenId = $tokenResult->accessToken->id;

        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subMinutes(50),
            'last_activity_at' => Carbon::now()->subMinutes(15),
        ])->save();

        $validRes = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                         ->getJson('/api/entity/me');
        $validRes->assertStatus(200);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $tokenId]);

        // 2. Session expired after 120 minutes (e.g. 121 minutes)
        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subMinutes(121),
            'last_activity_at' => Carbon::now()->subMinutes(1),
        ])->save();

        $expiredRes = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                           ->getJson('/api/entity/me');
        $expiredRes->assertStatus(401);
        $expiredRes->assertJson([
            'status' => 'error',
            'session_expired' => true,
            'expiry_type' => 'absolute',
        ]);

        // Token must be authoritatively revoked from DB
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);

        // 3. Re-login capability
        $newTokenResult = $entity->createToken('entity_token');
        $reloginRes = $this->withHeader('Authorization', 'Bearer ' . $newTokenResult->plainTextToken)
                           ->getJson('/api/entity/me');
        $reloginRes->assertStatus(200);
    }

    /**
     * INACTIVITY EXPIRATION: Tokens inactive for > 120 minutes expire
     */
    public function test_session_expires_after_120_minutes_inactivity()
    {
        $user = User::first() ?? User::create([
            'name' => 'Idle User',
            'email' => 'idle_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);

        $tokenResult = $user->createToken('user_auth_token');
        $plainToken = $tokenResult->plainTextToken;
        $tokenId = $tokenResult->accessToken->id;

        // Inactive for 125 minutes (created 125 mins ago, last activity 125 mins ago)
        $tokenResult->accessToken->forceFill([
            'created_at' => Carbon::now()->subMinutes(125),
            'last_activity_at' => Carbon::now()->subMinutes(125),
        ])->save();

        $res = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
                    ->getJson('/api/me');
        $res->assertStatus(401);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }
}
