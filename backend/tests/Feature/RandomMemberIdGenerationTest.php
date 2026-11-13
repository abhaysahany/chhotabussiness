<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\GoogleAuthService;
use App\Services\MemberIdGeneratorService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class RandomMemberIdGenerationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $legacySponsor;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => env('DB_DATABASE', 'chhotabiz_test'),
            'services.google.client_id' => 'test-google-client-id',
            'services.google.client_secret' => 'test-google-client-secret',
            'services.google.redirect_uri' => 'http://localhost:5174',
            'services.google.allowed_origins' => ['http://localhost:5174', 'https://vyaparadnet.com'],
        ]);

        User::where('email', 'like', '%@randidtest.com')->delete();

        // Seed a legacy-format member ID (e.g. CB1000012) to verify preservation & compatibility
        $this->legacySponsor = User::create([
            'name' => 'Legacy Sequential Member',
            'email' => 'legacy_sponsor@randidtest.com',
            'password' => Hash::make('password123'),
            'user_code' => 'CB1000012',
            'sponsor_onboarding_status' => 'completed',
            'email_verified_at' => now(),
        ]);
    }

    protected function tearDown(): void
    {
        User::where('email', 'like', '%@randidtest.com')->delete();
        parent::tearDown();
    }

    /**
     * 1, 2 & 3: Generator service produces CB + 7 digits and does not rely on sequential DB ID.
     */
    public function test_generator_produces_valid_cb_seven_digit_format_not_based_on_auto_increment(): void
    {
        $service = app(MemberIdGeneratorService::class);

        for ($i = 0; $i < 25; $i++) {
            $candidate = $service->generateCandidate();
            $this->assertStringStartsWith('CB', $candidate);
            $this->assertSame(9, strlen($candidate));
            $this->assertMatchesRegularExpression('/^CB\d{7}$/', $candidate);

            $digits = (int) substr($candidate, 2);
            $this->assertGreaterThanOrEqual(1000000, $digits);
            $this->assertLessThanOrEqual(9999999, $digits);
            $this->assertTrue($service->isValidFormat($candidate));
        }

        // Verify newly created user ID does not follow old ($latestId + 100001) formula
        $member = User::create([
            'name' => 'Format Check Member',
            'email' => 'format_member@randidtest.com',
            'password' => Hash::make('secret123'),
            'sponsor_id' => $this->legacySponsor->user_code,
            'email_verified_at' => now(),
        ]);

        $this->assertMatchesRegularExpression('/^CB\d{7}$/', $member->user_code);
        $this->assertNotEquals('CB' . ($member->id + 100001), $member->user_code);
        $this->assertNotEquals('CB' . ($member->id + 100000), $member->user_code);
    }

    /**
     * 5: Normal registration generates a random 7-digit CB Member ID.
     */
    public function test_normal_registration_generates_random_member_id(): void
    {
        $email = 'normal_reg@randidtest.com';
        Cache::put('otp_' . $email, '123456', now()->addMinutes(5));

        $response = $this->postJson('/api/register', [
            'sponsor_id' => $this->legacySponsor->user_code,
            'name' => 'Normal Reg User',
            'email' => $email,
            'password' => 'secret123',
            'otp' => '123456',
            'terms_accepted' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $userCode = $response->json('user.user_code');
        $this->assertNotEmpty($userCode);
        $this->assertMatchesRegularExpression('/^CB\d{7}$/', $userCode);

        $created = User::where('email', $email)->first();
        $this->assertNotNull($created);
        $this->assertSame($userCode, $created->user_code);
        $this->assertNotEquals('CB' . ($created->id + 100001), $created->user_code);
    }

    /**
     * 4: Google registration generates a random 7-digit CB Member ID.
     */
    public function test_google_registration_generates_random_member_id(): void
    {
        $mock = Mockery::mock(GoogleAuthService::class);
        $mock->shouldReceive('verifyGoogleUser')->andReturn([
            'sub' => 'google_sub_randid_001',
            'email' => 'google_reg@randidtest.com',
            'name' => 'Google Reg User',
            'avatar' => 'https://example.com/avatar.png',
        ]);
        $this->app->instance(GoogleAuthService::class, $mock);

        $response = $this->postJson('/api/auth/google', [
            'code' => 'mock_auth_code',
            'mode' => 'register',
            'sponsor_id' => $this->legacySponsor->user_code,
            'terms_accepted' => true,
        ], [
            'X-Requested-With' => 'XMLHttpRequest',
            'Origin' => 'http://localhost:5174',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $userCode = $response->json('user.user_code');
        $this->assertMatchesRegularExpression('/^CB\d{7}$/', $userCode);

        $created = User::where('email', 'google_reg@randidtest.com')->first();
        $this->assertNotNull($created);
        $this->assertSame($userCode, $created->user_code);
        $this->assertNotEquals('CB' . ($created->id + 100001), $created->user_code);
    }

    /**
     * 6: Direct / Admin-style User::create or service creation generates random CB Member ID.
     */
    public function test_direct_and_service_member_creation_generates_random_member_id(): void
    {
        $service = app(MemberIdGeneratorService::class);
        $adminCreated = $service->createMemberWithUniqueId([
            'name' => 'Admin Created Member',
            'email' => 'admin_created@randidtest.com',
            'password' => Hash::make('secret123'),
            'sponsor_id' => $this->legacySponsor->user_code,
            'email_verified_at' => now(),
        ]);

        $this->assertMatchesRegularExpression('/^CB\d{7}$/', $adminCreated->user_code);
        $this->assertNotEquals('CB' . ($adminCreated->id + 100001), $adminCreated->user_code);
    }

    /**
     * 7: Collision detection skips occupied IDs and retries up to bounded limit.
     */
    public function test_collision_detection_generates_another_id_and_enforces_retry_limit(): void
    {
        $existingUser = User::create([
            'name' => 'Existing Collision Holder',
            'email' => 'collision_holder@randidtest.com',
            'password' => Hash::make('secret123'),
            'user_code' => 'CB8888881',
            'email_verified_at' => now(),
        ]);

        $service = app(MemberIdGeneratorService::class);

        $sequence = ['CB8888881', 'CB8888881', 'CB8888882'];
        $idx = 0;
        $uniqueCode = $service->generateUniqueCode(5, function () use (&$sequence, &$idx) {
            return $sequence[$idx++] ?? 'CB8888883';
        });

        $this->assertSame('CB8888882', $uniqueCode);
        $this->assertNotEquals($existingUser->user_code, $uniqueCode);

        // Exhausted retries throw controlled RuntimeException
        $this->expectException(RuntimeException::class);
        $service->generateUniqueCode(3, fn () => 'CB8888881');
    }

    /**
     * 8: Duplicate IDs are strictly prevented by database UNIQUE constraint.
     */
    public function test_duplicate_user_code_is_blocked_by_database_unique_constraint(): void
    {
        User::create([
            'name' => 'First Holder',
            'email' => 'dup_first@randidtest.com',
            'password' => Hash::make('secret123'),
            'user_code' => 'CB7777771',
            'email_verified_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        DB::table('users')->insert([
            'name' => 'Duplicate Holder',
            'email' => 'dup_second@randidtest.com',
            'password' => Hash::make('secret123'),
            'user_code' => 'CB7777771',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * 9: Concurrent collision during insert is retried cleanly, and exhausted retries return 503.
     */
    public function test_concurrent_collision_retries_with_new_id_and_returns_controlled_error_when_exhausted(): void
    {
        // Pre-seed a code that our mock pre-check will pretend didn't exist on attempt 1
        // Wait: test createMemberWithUniqueId's QueryException catch using a subclass/spy
        $existing = User::create([
            'name' => 'Race Winner',
            'email' => 'race_winner@randidtest.com',
            'password' => Hash::make('secret123'),
            'user_code' => 'CB6543210',
            'email_verified_at' => now(),
        ]);

        $partialMock = Mockery::mock(MemberIdGeneratorService::class)->makePartial();
        // First generateUniqueCode returns the colliding code 'CB6543210' (simulating concurrent race after exists() check),
        // second attempt returns an unused valid code 'CB6543219'.
        $partialMock->shouldReceive('generateUniqueCode')
            ->twice()
            ->andReturn($existing->user_code, 'CB6543219');

        $winner = $partialMock->createMemberWithUniqueId([
            'name' => 'Race Retried Member',
            'email' => 'race_retried@randidtest.com',
            'password' => Hash::make('secret123'),
            'email_verified_at' => now(),
        ]);

        $this->assertSame('CB6543219', $winner->user_code);

        // Now verify controller returns controlled 503 when ID generation cannot complete
        $failingService = Mockery::mock(MemberIdGeneratorService::class);
        $failingService->shouldReceive('createMemberWithUniqueId')
            ->once()
            ->andThrow(new RuntimeException('Exhausted retries'));
        $this->app->instance(MemberIdGeneratorService::class, $failingService);

        $email = 'exhausted@randidtest.com';
        Cache::put('otp_' . $email, '654321', now()->addMinutes(5));

        $resp = $this->postJson('/api/register', [
            'sponsor_id' => $this->legacySponsor->user_code,
            'name' => 'Exhausted User',
            'email' => $email,
            'password' => 'secret123',
            'otp' => '654321',
            'terms_accepted' => true,
        ]);

        $resp->assertStatus(503)
            ->assertJsonPath('status', 'error');
    }

    /**
     * 10, 11 & 12: Existing IDs stay unchanged; sponsor validation, onboarding, direct team, login & search work for both old & new IDs.
     */
    public function test_existing_ids_preserved_and_sponsor_login_search_compatible_with_random_ids(): void
    {
        $legacyCodeBefore = $this->legacySponsor->user_code;

        // Create a random-ID sponsor under the legacy sponsor
        $randomSponsor = User::create([
            'name' => 'Random Sponsor',
            'email' => 'random_sponsor@randidtest.com',
            'password' => Hash::make('password123'),
            'sponsor_id' => $this->legacySponsor->user_code,
            'sponsor_onboarding_status' => 'completed',
            'email_verified_at' => now(),
        ]);

        $this->assertMatchesRegularExpression('/^CB\d{7}$/', $randomSponsor->user_code);

        // Confirm legacy member ID was NOT mutated
        $this->legacySponsor->refresh();
        $this->assertSame($legacyCodeBefore, $this->legacySponsor->user_code);

        // Verify sponsor validation works with both legacy ID and new random ID
        $this->postJson('/api/verify-sponsor', ['sponsor_id' => $this->legacySponsor->user_code])
            ->assertStatus(200)
            ->assertJsonPath('verified', true)
            ->assertJsonPath('sponsor.user_code', 'CB1000012');

        $this->postJson('/api/verify-sponsor', ['sponsor_id' => $randomSponsor->user_code])
            ->assertStatus(200)
            ->assertJsonPath('verified', true)
            ->assertJsonPath('sponsor.user_code', $randomSponsor->user_code);

        // Verify member lookup / auto-fill works with new random ID
        $this->postJson('/api/verify-member', ['member_id' => $randomSponsor->user_code])
            ->assertStatus(200)
            ->assertJsonPath('verified', true)
            ->assertJsonPath('member.user_code', $randomSponsor->user_code);

        // Register a child member under the new random ID via normal registration
        $childEmail = 'child_under_random@randidtest.com';
        Cache::put('otp_' . $childEmail, '112233', now()->addMinutes(5));
        $childResp = $this->postJson('/api/register', [
            'sponsor_id' => $randomSponsor->user_code,
            'name' => 'Child Under Random',
            'email' => $childEmail,
            'password' => 'secret123',
            'otp' => '112233',
            'terms_accepted' => true,
        ]);

        $childResp->assertStatus(201);
        $childCode = $childResp->json('user.user_code');
        $this->assertMatchesRegularExpression('/^CB\d{7}$/', $childCode);
        $this->assertSame($randomSponsor->user_code, $childResp->json('user.sponsor_id'));

        // Verify Google Sponsor Onboarding works with random sponsor ID
        $pendingGoogleUser = User::create([
            'name' => 'Pending Google User',
            'email' => 'pending_google@randidtest.com',
            'password' => Hash::make('secret123'),
            'sponsor_id' => null,
            'sponsor_onboarding_status' => 'pending',
            'provider' => 'google',
            'provider_id' => 'sub_pending_random_test',
            'email_verified_at' => now(),
        ]);
        $this->assertMatchesRegularExpression('/^CB\d{7}$/', $pendingGoogleUser->user_code);

        $onboardingResp = $this->actingAs($pendingGoogleUser, 'sanctum')
            ->postJson('/api/user/complete-sponsor-onboarding', [
                'sponsor_id' => $randomSponsor->user_code,
            ]);
        $onboardingResp->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('user.sponsor_id', $randomSponsor->user_code);

        // Verify direct connections, level team & genealogy tree include the new random-ID children
        $directResp = $this->actingAs($randomSponsor, 'sanctum')
            ->getJson('/api/user/network/direct?user_code=' . $randomSponsor->user_code);
        $directResp->assertStatus(200);
        $directIds = collect($directResp->json('directMembers'))->pluck('id')->all();
        $this->assertContains($childCode, $directIds);
        $this->assertContains($pendingGoogleUser->user_code, $directIds);

        // Verify level-wise team under legacy sponsor includes randomSponsor (Level 1) and childCode (Level 2)
        $teamResp = $this->actingAs($this->legacySponsor, 'sanctum')
            ->getJson('/api/user/network/team?user_code=' . $this->legacySponsor->user_code);
        $teamResp->assertStatus(200);
        $teamIds = collect($teamResp->json('teamMembers'))->pluck('id')->all();
        $this->assertContains($randomSponsor->user_code, $teamIds);
        $this->assertContains($childCode, $teamIds);

        // Verify genealogy tree under legacy sponsor includes randomSponsor node
        $treeResp = $this->actingAs($this->legacySponsor, 'sanctum')
            ->getJson('/api/user/network/genealogy?user_code=' . $this->legacySponsor->user_code);
        $treeResp->assertStatus(200);
        $childNodeIds = collect($treeResp->json('tree.children'))->pluck('id')->all();
        $this->assertContains($randomSponsor->user_code, $childNodeIds);

        // Verify user profile endpoint returns new random user_code
        $profileResp = $this->actingAs($randomSponsor, 'sanctum')
            ->getJson('/api/user/profile?user_code=' . $randomSponsor->user_code);
        $profileResp->assertStatus(200)
            ->assertJsonPath('user.user_code', $randomSponsor->user_code);

        // Verify Login still works
        $loginResp = $this->postJson('/api/login', [
            'email' => 'random_sponsor@randidtest.com',
            'password' => 'password123',
        ]);
        $loginResp->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('user.user_code', $randomSponsor->user_code);

        // Verify Admin Member search works by new random user_code and legacy user_code
        $searchNew = $this->getJson('/api/admin/users?search=' . $randomSponsor->user_code);
        $searchNew->assertStatus(200);
        $this->assertTrue(collect($searchNew->json('users'))->contains('id', $randomSponsor->user_code));

        $searchOld = $this->getJson('/api/admin/users?search=CB1000012');
        $searchOld->assertStatus(200);
        $this->assertTrue(collect($searchOld->json('users'))->contains('id', 'CB1000012'));
    }
}
