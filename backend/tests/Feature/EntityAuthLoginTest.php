<?php

namespace Tests\Feature;

use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\FreelancerEntity;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class EntityAuthLoginTest extends TestCase
{
    use DatabaseTransactions;

    protected EntityCategory $category;
    protected BusinessEntity $business1;
    protected BusinessEntity $business2;
    protected FreelancerEntity $freelancer1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = EntityCategory::first() ?? EntityCategory::create([
            'name' => 'General Commerce',
            'slug' => 'general-commerce-' . uniqid(),
        ]);

        // Business 1 with known credentials
        $this->business1 = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Apex Solar Technologies',
            'owner_name' => 'Sunil Gupta',
            'email' => 'apex_' . uniqid() . '@example.com',
            'phone' => '98' . rand(10000000, 99999999),
            'registration_no' => 'REG-APEX-' . rand(1000, 9999),
            'password' => Hash::make('ApexSecure2026!'),
            'verification_status' => 'verified',
        ]);

        // Business 2 with different credentials
        $this->business2 = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'BlueWave Logistics Ltd',
            'owner_name' => 'Vikram Malhotra',
            'email' => 'bluewave_' . uniqid() . '@example.com',
            'phone' => '99' . rand(10000000, 99999999),
            'registration_no' => 'REG-BW-' . rand(1000, 9999),
            'password' => Hash::make('BlueWavePass999!'),
            'verification_status' => 'verified',
        ]);

        // Freelancer 1 with known credentials
        $this->freelancer1 = FreelancerEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Kavita Sharma',
            'title' => 'UI/UX Lead Designer',
            'email' => 'kavita_' . uniqid() . '@example.com',
            'phone' => '97' . rand(10000000, 99999999),
            'password' => Hash::make('KavitaCreative!'),
            'verification_status' => 'verified',
        ]);
    }

    /**
     * Test Scenario 1: Correct registered email + correct password → successful Business Entity login.
     * No pre-login entity selection required.
     */
    public function test_correct_business_credentials_direct_login_without_entity_selection(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'email' => $this->business1->email,
            'password' => 'ApexSecure2026!',
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertTrue($data['success']);
        $this->assertEquals('success', $data['status']);
        $this->assertNotEmpty($data['token']);
        $this->assertEquals($this->business1->email, $data['user']['email']);
        $this->assertEquals('business', $data['user']['entity_details']['entity_type']);
        $this->assertEquals($this->business1->id, $data['user']['entity_details']['entity_id']);
        $this->assertEquals('Apex Solar Technologies', $data['user']['entity_details']['business_name']);
    }

    /**
     * Test Scenario 1b: Correct registered email + correct password → successful Freelancer Entity login.
     * No pre-login entity selection required.
     */
    public function test_correct_freelancer_credentials_direct_login_without_entity_selection(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'email' => $this->freelancer1->email,
            'password' => 'KavitaCreative!',
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertTrue($data['success']);
        $this->assertEquals('success', $data['status']);
        $this->assertNotEmpty($data['token']);
        $this->assertEquals('freelancer', $data['user']['entity_details']['entity_type']);
        $this->assertEquals($this->freelancer1->id, $data['user']['entity_details']['entity_id']);
        $this->assertEquals('Kavita Sharma', $data['user']['entity_details']['business_name']);
    }

    /**
     * Test Scenario 2: Incorrect password → login rejected with safe 401 error.
     */
    public function test_incorrect_password_is_rejected_with_safe_generic_message(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'email' => $this->business1->email,
            'password' => 'WrongPassword123!',
        ]);

        $response->assertStatus(401);
        $data = $response->json();

        $this->assertFalse($data['success']);
        $this->assertEquals('Invalid email or password credentials.', $data['message']);
    }

    /**
     * Test Scenario 3: Unregistered email → login rejected safely with identical 401 error.
     */
    public function test_unregistered_email_is_rejected_safely_preventing_enumeration(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'email' => 'totally_nonexistent_' . uniqid() . '@example.com',
            'password' => 'ApexSecure2026!',
        ]);

        $response->assertStatus(401);
        $data = $response->json();

        $this->assertFalse($data['success']);
        $this->assertEquals('Invalid email or password credentials.', $data['message']);
    }

    /**
     * Test Scenario 4: Empty email → validation shown with 422.
     */
    public function test_empty_email_shows_validation_error(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'email' => '',
            'password' => 'ApexSecure2026!',
        ]);

        $response->assertStatus(422);
        $data = $response->json();

        $this->assertFalse($data['success']);
        $this->assertArrayHasKey('email', $data['errors']);
    }

    /**
     * Test Scenario 5: Empty password → validation shown with 422.
     */
    public function test_empty_password_shows_validation_error(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'email' => $this->business1->email,
            'password' => '',
        ]);

        $response->assertStatus(422);
        $data = $response->json();

        $this->assertFalse($data['success']);
        $this->assertArrayHasKey('password', $data['errors']);
    }

    /**
     * Test Scenario 6: Leading/trailing spaces and mixed case in email → normalized correctly.
     */
    public function test_email_with_whitespace_and_mixed_case_is_normalized_correctly(): void
    {
        $emailWithSpaces = '  ' . strtoupper($this->business1->email) . '  ';

        $response = $this->postJson('/api/entity/login', [
            'email' => $emailWithSpaces,
            'password' => 'ApexSecure2026!',
        ]);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertTrue($data['success']);
        $this->assertEquals($this->business1->email, $data['user']['email']);
    }

    /**
     * Test Scenario 7: Inactive Entity → access denied (HTTP 403).
     */
    public function test_inactive_or_rejected_entity_login_is_denied(): void
    {
        $rejectedBusiness = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Rejected Corp',
            'owner_name' => 'Rejected Owner',
            'email' => 'rejected_' . uniqid() . '@example.com',
            'phone' => '91' . rand(10000000, 99999999),
            'password' => Hash::make('RejectedPass123!'),
            'verification_status' => 'rejected',
        ]);

        $response = $this->postJson('/api/entity/login', [
            'email' => $rejectedBusiness->email,
            'password' => 'RejectedPass123!',
        ]);

        $response->assertStatus(403);
        $data = $response->json();
        $this->assertFalse($data['success']);
        $this->assertStringContainsString('rejected', $data['message']);
    }

    /**
     * Test Scenario 8: Unverified Entity (status = 'pending') → existing verification restrictions preserved.
     */
    public function test_unverified_pending_entity_preserves_verification_restrictions(): void
    {
        $pendingBusiness = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Pending Verification LLC',
            'owner_name' => 'Pending Owner',
            'email' => 'pending_' . uniqid() . '@example.com',
            'phone' => '92' . rand(10000000, 99999999),
            'password' => Hash::make('PendingPass123!'),
            'verification_status' => 'pending',
        ]);

        $response = $this->postJson('/api/entity/login', [
            'email' => $pendingBusiness->email,
            'password' => 'PendingPass123!',
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertTrue($data['success']);
        $this->assertEquals('pending', $data['user']['entity_details']['verification_status']);
    }

    /**
     * Test Scenario 9 & 10: Valid login opens session, and refresh maintains authenticated session.
     */
    public function test_valid_login_returns_token_and_maintains_authenticated_session(): void
    {
        $loginRes = $this->postJson('/api/entity/login', [
            'email' => $this->business1->email,
            'password' => 'ApexSecure2026!',
            'remember' => true,
        ]);

        $loginRes->assertStatus(200);
        $token = $loginRes->json('token');
        $this->assertNotEmpty($token);

        // Access protected entity profile with bearer token
        $meRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/entity/me');

        $meRes->assertStatus(200);
        $meData = $meRes->json();
        $this->assertEquals('success', $meData['status']);
        $this->assertEquals($this->business1->id, $meData['user']['id']);
        $this->assertEquals('business', $meData['user']['entity_details']['entity_type']);
    }

    /**
     * Test Scenario 11: Logout invalidates token and protected entity pages become inaccessible.
     */
    public function test_logout_revokes_token_and_protected_pages_become_inaccessible(): void
    {
        $loginRes = $this->postJson('/api/entity/login', [
            'email' => $this->business1->email,
            'password' => 'ApexSecure2026!',
        ]);

        $token = $loginRes->json('token');

        // Logout
        $logoutRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/entity/logout');
        $logoutRes->assertStatus(200);

        // Clear auth guard cache
        $this->app['auth']->forgetGuards();

        // Subsequent access should fail with 401
        $subsequentRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/entity/me');
        $subsequentRes->assertStatus(401);
    }

    /**
     * Test Scenario 12: Direct API request without a valid token → HTTP 401.
     */
    public function test_direct_api_request_without_valid_token_returns_401(): void
    {
        $response = $this->getJson('/api/entity/me');
        $response->assertStatus(401);
    }

    /**
     * Test Scenario 13: Entity cannot access another Entity's protected records by modifying browser parameters.
     */
    public function test_entity_cannot_spoof_another_entity_by_passing_entity_id(): void
    {
        // Business 1 logs in, but an attacker tries to pass Business 2's entity_id
        $response = $this->postJson('/api/entity/login', [
            'email' => $this->business1->email,
            'password' => 'ApexSecure2026!',
            'entity_id' => $this->business2->id,
            'entity_type' => 'business',
        ]);

        // Backend refuses the mismatched parameter tampering
        $response->assertStatus(401);
        $data = $response->json();
        $this->assertFalse($data['success']);
    }

    /**
     * Test Scenario 14: Rate limiting protects against repeated brute force attempts.
     */
    public function test_rate_limiting_protects_against_brute_force(): void
    {
        $testEmail = 'ratelimit_' . uniqid() . '@example.com';
        $throttleKey = 'entity_login_' . strtolower($testEmail) . '|127.0.0.1';
        RateLimiter::clear($throttleKey);

        for ($i = 0; $i < 5; $i++) {
            $res = $this->postJson('/api/entity/login', [
                'email' => $testEmail,
                'password' => 'WrongPassword!',
            ]);
            $res->assertStatus(401);
        }

        // 6th attempt triggers 429 Too Many Requests
        $res6 = $this->postJson('/api/entity/login', [
            'email' => $testEmail,
            'password' => 'WrongPassword!',
        ]);
        $res6->assertStatus(429);
        $this->assertStringContainsString('Too many login attempts', $res6->json('message'));

        RateLimiter::clear($throttleKey);
    }

    /**
     * Test Scenario 15: Existing eligible Entity account from current database logs in directly.
     * Tests real account mlm@dev.com from current database without creating fake accounts.
     */
    public function test_existing_eligible_database_entity_can_login_directly_with_email_and_password(): void
    {
        $existing = BusinessEntity::where('email', 'mlm@dev.com')->first();
        if ($existing) {
            $response = $this->postJson('/api/entity/login', [
                'email' => 'mlm@dev.com',
                'password' => '12345678',
            ]);

            $response->assertStatus(200);
            $data = $response->json();

            $this->assertTrue($data['success']);
            $this->assertEquals('success', $data['status']);
            $this->assertEquals('mlm@dev.com', $data['user']['email']);
            $this->assertEquals($existing->id, $data['user']['id']);
            $this->assertEquals('MLM SOFTWARE', $data['user']['name']);
            $this->assertEquals('verified', $data['user']['entity_details']['verification_status']);
        } else {
            $this->markTestSkipped('mlm@dev.com not in current test database');
        }
    }
}
