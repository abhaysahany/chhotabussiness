<?php

namespace Tests\Feature;

use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\FreelancerEntity;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
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
     * Test Case 1 & 2: Entity dropdown loads registered entities dynamically.
     */
    public function test_selectable_entities_endpoint_loads_registered_entities_dynamically(): void
    {
        $response = $this->getJson('/api/entity/selectable-entities');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertEquals('success', $data['status']);
        $this->assertNotEmpty($data['entities']);
        $this->assertGreaterThanOrEqual(3, count($data['entities']));

        // Verify structure has keys needed by dropdown
        $first = $data['entities'][0];
        $this->assertArrayHasKey('value', $first);
        $this->assertArrayHasKey('id', $first);
        $this->assertArrayHasKey('type', $first);
        $this->assertArrayHasKey('name', $first);
        $this->assertArrayHasKey('label', $first);
        $this->assertArrayHasKey('identifier', $first);

        // Verify password is NOT exposed in response
        $this->assertArrayNotHasKey('password', $first);
    }

    /**
     * Test Case 3 & 4: Correct entity selection + email + password allows login.
     */
    public function test_correct_business_credentials_and_selection_allows_login(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'entity_key' => 'business_' . $this->business1->id,
            'entity_type' => 'business',
            'entity_id' => $this->business1->id,
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
    }

    /**
     * Test Case 4b: Correct freelancer credentials and selection allows login.
     */
    public function test_correct_freelancer_credentials_and_selection_allows_login(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'entity_key' => 'freelancer_' . $this->freelancer1->id,
            'entity_type' => 'freelancer',
            'entity_id' => $this->freelancer1->id,
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
    }

    /**
     * Test Case 5: Incorrect password is rejected with 401.
     */
    public function test_incorrect_password_is_rejected(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'entity_key' => 'business_' . $this->business1->id,
            'entity_type' => 'business',
            'entity_id' => $this->business1->id,
            'email' => $this->business1->email,
            'password' => 'WrongPassword123!',
        ]);

        $response->assertStatus(401);
        $data = $response->json();

        $this->assertFalse($data['success']);
        $this->assertStringContainsString('Invalid password', $data['message']);
    }

    /**
     * Test Case 6: Incorrect username/email is rejected with 401.
     */
    public function test_incorrect_username_or_email_is_rejected(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'entity_key' => 'business_' . $this->business1->id,
            'entity_type' => 'business',
            'entity_id' => $this->business1->id,
            'email' => 'totally_nonexistent_' . uniqid() . '@example.com',
            'password' => 'ApexSecure2026!',
        ]);

        $response->assertStatus(401);
        $data = $response->json();

        $this->assertFalse($data['success']);
        $this->assertStringContainsString('do not belong to the selected', $data['message']);
    }

    /**
     * Test Case 7: Credentials belonging to another entity cannot authenticate the selected entity.
     */
    public function test_credentials_of_another_entity_cannot_authenticate_selected_entity(): void
    {
        // Selected Business 1, but passed Business 2's email and password
        $response = $this->postJson('/api/entity/login', [
            'entity_key' => 'business_' . $this->business1->id,
            'entity_type' => 'business',
            'entity_id' => $this->business1->id,
            'email' => $this->business2->email,
            'password' => 'BlueWavePass999!',
        ]);

        $response->assertStatus(401);
        $data = $response->json();

        $this->assertFalse($data['success']);
        $this->assertStringContainsString('do not belong to the selected', $data['message']);
    }

    /**
     * Test Case 8: Missing entity selection is handled with 422 error.
     */
    public function test_missing_entity_selection_is_handled_correctly(): void
    {
        $response = $this->postJson('/api/entity/login', [
            'email' => $this->business1->email,
            'password' => 'ApexSecure2026!',
        ]);

        $response->assertStatus(422);
        $data = $response->json();

        $this->assertFalse($data['success']);
        $this->assertStringContainsString('select your registered entity', $data['message']);
    }

    /**
     * Test Case 9 & 10: Authenticated entity can access /api/entity/me and maintains session.
     */
    public function test_authenticated_entity_can_access_protected_entity_profile(): void
    {
        // Login first
        $loginRes = $this->postJson('/api/entity/login', [
            'entity_key' => 'business_' . $this->business1->id,
            'entity_type' => 'business',
            'entity_id' => $this->business1->id,
            'email' => $this->business1->email,
            'password' => 'ApexSecure2026!',
        ]);

        $token = $loginRes->json('token');
        $this->assertNotEmpty($token);

        // Fetch /api/entity/me
        $meRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/entity/me');

        $meRes->assertStatus(200);
        $meData = $meRes->json();

        $this->assertEquals('success', $meData['status']);
        $this->assertEquals($this->business1->email, $meData['user']['email']);
        $this->assertEquals('business', $meData['user']['entity_details']['entity_type']);
        $this->assertEquals($this->business1->id, $meData['user']['entity_details']['entity_id']);
    }

    /**
     * Test Case 11: Unauthenticated request to /api/entity/me is rejected with 401.
     */
    public function test_unauthenticated_request_to_entity_me_is_rejected(): void
    {
        $response = $this->getJson('/api/entity/me');
        $response->assertStatus(401);
    }
}
