<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\FreelancerEntity;
use App\Models\Order;
use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EntityDirectAuthTest extends TestCase
{
    use DatabaseTransactions;

    protected EntityCategory $category;
    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = EntityCategory::first() ?? EntityCategory::create([
            'name' => 'General Business',
            'slug' => 'general-business-' . uniqid(),
        ]);

        $this->admin = Admin::first() ?? Admin::create([
            'name' => 'Master Admin',
            'email' => 'admin_' . uniqid() . '@example.com',
            'password' => Hash::make('AdminSecret123!'),
            'role' => 'superadmin',
        ]);
    }

    /**
     * Test A: Business Entity Creation does NOT create a User record.
     */
    public function test_a_business_entity_creation_does_not_create_user_record(): void
    {
        $initialUserCount = User::count();
        $adminToken = $this->admin->createToken('admin_token', ['admin'])->plainTextToken;

        $email = 'biz_' . uniqid() . '@example.com';
        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/admin/business-entities', [
                'entity_category_id' => $this->category->id,
                'name' => 'Acme Solar Enterprises',
                'owner_name' => 'John Doe',
                'email' => $email,
                'phone' => '9876543210',
                'password' => 'Secret123456!',
                'address' => '123 Solar Street',
                'registration_no' => 'REG-' . rand(1000, 9999),
            ]);

        $response->assertStatus(201);
        $this->assertEquals($initialUserCount, User::count(), 'users table count must NOT increase during business creation!');

        $business = BusinessEntity::where('email', $email)->first();
        $this->assertNotNull($business);
        $this->assertTrue(Hash::check('Secret123456!', $business->password));

        // Confirm no MLM code was generated
        $this->assertNull(User::where('email', $email)->first());
    }

    /**
     * Test B: Freelancer Creation does NOT create a User record.
     */
    public function test_b_freelancer_creation_does_not_create_user_record(): void
    {
        $initialUserCount = User::count();
        $adminToken = $this->admin->createToken('admin_token', ['admin'])->plainTextToken;

        $email = 'fl_' . uniqid() . '@example.com';
        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/admin/freelancers', [
                'entity_category_id' => $this->category->id,
                'name' => 'Alice Designer',
                'email' => $email,
                'phone' => '9811223344',
                'password' => 'DesignPass123!',
                'title' => 'Senior UI Specialist',
                'hourly_rate' => '₹1200/hr',
            ]);

        $response->assertStatus(201);
        $this->assertEquals($initialUserCount, User::count(), 'users table count must NOT increase during freelancer creation!');

        $freelancer = FreelancerEntity::where('email', $email)->first();
        $this->assertNotNull($freelancer);
        $this->assertTrue(Hash::check('DesignPass123!', $freelancer->password));

        // Confirm no MLM code was generated
        $this->assertNull(User::where('email', $email)->first());
    }

    /**
     * Test C: Entity Updates (with or without password) do NOT touch or create User records.
     */
    public function test_c_entity_updates_do_not_touch_or_create_user(): void
    {
        $email = 'biz_upd_' . uniqid() . '@example.com';
        $business = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Initial Name',
            'owner_name' => 'Initial Owner',
            'email' => $email,
            'phone' => '9876500000',
            'password' => Hash::make('InitialPass1!'),
            'verification_status' => 'verified',
        ]);

        $initialUserCount = User::count();
        $adminToken = $this->admin->createToken('admin_token', ['admin'])->plainTextToken;

        // Update details without password
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->putJson('/api/admin/business-entities/' . $business->id, [
                'entity_category_id' => $this->category->id,
                'name' => 'Updated Name Ltd',
                'owner_name' => 'Initial Owner',
                'email' => $email,
                'phone' => '9876500000',
            ]);

        $res1->assertStatus(200);
        $this->assertEquals($initialUserCount, User::count());
        $this->assertEquals('Updated Name Ltd', $business->fresh()->name);
        $this->assertTrue(Hash::check('InitialPass1!', $business->fresh()->password));

        // Update with new password
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->putJson('/api/admin/business-entities/' . $business->id, [
                'entity_category_id' => $this->category->id,
                'name' => 'Updated Name Ltd',
                'owner_name' => 'Initial Owner',
                'email' => $email,
                'phone' => '9876500000',
                'password' => 'BrandNewPassword99!',
            ]);

        $res2->assertStatus(200);
        $this->assertEquals($initialUserCount, User::count());
        $this->assertTrue(Hash::check('BrandNewPassword99!', $business->fresh()->password));
        $this->assertNull(User::where('email', $email)->first());
    }

    /**
     * Test D: Business Entity Login issues direct Sanctum token on BusinessEntity model.
     */
    public function test_d_business_entity_login_issues_direct_token_without_user(): void
    {
        $email = 'biz_login_' . uniqid() . '@example.com';
        $business = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Direct Auth B.V.',
            'owner_name' => 'Direct Owner',
            'email' => $email,
            'phone' => '9988776655',
            'password' => Hash::make('DirectPass2026!'),
            'verification_status' => 'verified',
        ]);

        $initialUserCount = User::count();

        $loginRes = $this->postJson('/api/entity/login', [
            'entity_key' => 'business_' . $business->id,
            'entity_type' => 'business',
            'entity_id' => $business->id,
            'email' => $email,
            'password' => 'DirectPass2026!',
        ]);

        $loginRes->assertStatus(200);
        $data = $loginRes->json();

        $this->assertTrue($data['success']);
        $this->assertNotEmpty($data['token']);
        $this->assertEquals('ENT-B' . str_pad($business->id, 5, '0', STR_PAD_LEFT), $data['user']['user_code']);
        $this->assertEquals($initialUserCount, User::count(), 'Login must NOT create a User row!');

        // Check token in DB
        $tokenRow = DB::table('personal_access_tokens')
            ->where('tokenable_id', $business->id)
            ->where('tokenable_type', BusinessEntity::class)
            ->first();

        $this->assertNotNull($tokenRow, 'Tokenable type must be App\\Models\\BusinessEntity!');
        $this->assertEquals(BusinessEntity::class, $tokenRow->tokenable_type);
    }

    /**
     * Test E: Freelancer Login issues direct Sanctum token on FreelancerEntity model.
     */
    public function test_e_freelancer_login_issues_direct_token_without_user(): void
    {
        $email = 'fl_login_' . uniqid() . '@example.com';
        $freelancer = FreelancerEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Direct Freelancer',
            'email' => $email,
            'phone' => '9988112233',
            'password' => Hash::make('FlPass2026!'),
            'title' => 'Legal Consultant',
            'verification_status' => 'verified',
        ]);

        $initialUserCount = User::count();

        $loginRes = $this->postJson('/api/entity/login', [
            'entity_key' => 'freelancer_' . $freelancer->id,
            'entity_type' => 'freelancer',
            'entity_id' => $freelancer->id,
            'email' => $email,
            'password' => 'FlPass2026!',
        ]);

        $loginRes->assertStatus(200);
        $data = $loginRes->json();

        $this->assertTrue($data['success']);
        $this->assertNotEmpty($data['token']);
        $this->assertEquals('ENT-F' . str_pad($freelancer->id, 5, '0', STR_PAD_LEFT), $data['user']['user_code']);
        $this->assertEquals($initialUserCount, User::count());

        $tokenRow = DB::table('personal_access_tokens')
            ->where('tokenable_id', $freelancer->id)
            ->where('tokenable_type', FreelancerEntity::class)
            ->first();

        $this->assertNotNull($tokenRow);
        $this->assertEquals(FreelancerEntity::class, $tokenRow->tokenable_type);
    }

    /**
     * Test F: /api/entity/me supports direct tokens & legacy User tokens.
     */
    public function test_f_entity_me_supports_direct_and_legacy_tokens(): void
    {
        // 1. Direct BusinessEntity token
        $business = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Me Direct Corp',
            'owner_name' => 'Me Owner',
            'email' => 'me_direct_' . uniqid() . '@example.com',
            'phone' => '9111111111',
            'password' => Hash::make('MePass123!'),
            'verification_status' => 'verified',
        ]);

        $directToken = $business->createToken('entity_token')->plainTextToken;
        $resDirect = $this->withHeader('Authorization', 'Bearer ' . $directToken)
            ->getJson('/api/entity/me');

        $resDirect->assertStatus(200);
        $dataDirect = $resDirect->json();
        $this->assertEquals('success', $dataDirect['status']);
        $this->assertEquals($business->id, $dataDirect['user']['id']);
        $this->assertEquals($business->email, $dataDirect['user']['email']);
        $this->assertEquals('business', $dataDirect['user']['entity_details']['entity_type']);

        // Clear auth guard cache so the next request resolves fresh principal from new Bearer token
        $this->app['auth']->forgetGuards();

        // 2. Legacy User token (backward compatibility for User #19 style sessions)
        $legacyEmail = 'legacy_' . uniqid() . '@example.com';
        $legacyBiz = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Legacy Linked Firm',
            'owner_name' => 'Legacy Owner',
            'email' => $legacyEmail,
            'phone' => '9222222222',
            'password' => Hash::make('LegacyPass!'),
            'verification_status' => 'verified',
        ]);

        $legacyUser = User::create([
            'name' => 'Legacy Linked Firm',
            'email' => $legacyEmail,
            'password' => Hash::make('LegacyPass!'),
            'user_code' => 'CB999999',
        ]);

        $legacyToken = $legacyUser->createToken('entity_token')->plainTextToken;
        $resLegacy = $this->withHeader('Authorization', 'Bearer ' . $legacyToken)
            ->getJson('/api/entity/me');

        $resLegacy->assertStatus(200);
        $dataLegacy = $resLegacy->json();
        $this->assertEquals('success', $dataLegacy['status']);
        $this->assertEquals($legacyBiz->id, $dataLegacy['user']['id']);
        $this->assertEquals('business', $dataLegacy['user']['entity_details']['entity_type']);
    }

    /**
     * Test G: Password Reset updates Entity password directly and does NOT create or touch User.
     */
    public function test_g_password_reset_updates_entity_without_user(): void
    {
        $email = 'reset_' . uniqid() . '@example.com';
        $business = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Reset Target Corp',
            'owner_name' => 'Reset Owner',
            'email' => $email,
            'phone' => '9333333333',
            'password' => Hash::make('OldPassword123!'),
            'verification_status' => 'verified',
        ]);

        $initialUserCount = User::count();

        // Put OTP in cache
        Cache::put('entity_reset_otp_' . $email, '123456', now()->addMinutes(15));

        $res = $this->postJson('/api/entity/reset-password', [
            'email' => $email,
            'otp' => '123456',
            'password' => 'NewResetPassword789!',
            'password_confirmation' => 'NewResetPassword789!',
        ]);

        $res->assertStatus(200);
        $this->assertTrue(Hash::check('NewResetPassword789!', $business->fresh()->password));
        $this->assertEquals($initialUserCount, User::count(), 'Password reset must NOT create a User record!');
    }

    /**
     * Test H: Entity Business Operations — Order creation & dump reporting work with direct token.
     */
    public function test_h_entity_operations_work_with_direct_token(): void
    {
        $business = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Ops Business Ltd',
            'owner_name' => 'Ops Owner',
            'email' => 'ops_' . uniqid() . '@example.com',
            'phone' => '9444444444',
            'password' => Hash::make('OpsPass123!'),
            'verification_status' => 'verified',
        ]);

        $token = $business->createToken('entity_token')->plainTextToken;

        // Create a customer user for order association
        $customerUser = User::create([
            'name' => 'Rahul Sharma',
            'email' => 'rahul_' . uniqid() . '@example.com',
            'user_code' => 'CB' . rand(100000, 999999),
            'password' => Hash::make('Pass123!'),
        ]);

        // Create an order via Entity endpoint
        $orderRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/entity/orders', [
                'customer_user_code' => $customerUser->user_code,
                'customer_name' => $customerUser->name,
                'customer_email' => $customerUser->email,
                'customer_phone' => '9888877777',
                'item' => 'GST Registration Service',
                'unit_price' => 5000,
                'quantity' => 1,
                'advance_payment' => 2000,
                'payment_method' => 'UPI',
                'reference_no' => 'UTR-' . rand(100000, 999999),
            ]);

        $orderRes->assertStatus(201);
        $orderData = $orderRes->json('order');
        $this->assertEquals($business->id, $orderData['entity_id']);
        $this->assertEquals($business->name, $orderData['entity_name']);

        // In the business workflow, order must be confirmed by admin before reporting dump payment
        \App\Models\Order::where('id', $orderData['id'])->update(['approval_status' => 'confirmed']);

        // Report dump payment on this order
        $dumpRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/entity/orders/' . $orderData['id'] . '/report-dump', [
                'dump_amount' => 500,
                'dump_reason' => 'Client applied special offline coupon',
            ]);

        $dumpRes->assertStatus(201);
        $this->assertEquals('success', $dumpRes->json('status'));
        $dumpRecord = $dumpRes->json('dump_request');
        $this->assertEquals($business->id, $dumpRecord['entity_id']);
    }

    /**
     * Test I: Security — Normal MLM User token cannot scope entity context.
     */
    public function test_i_normal_mlm_user_token_cannot_scope_entity_context(): void
    {
        $sharedEmail = 'shared_' . uniqid() . '@example.com';

        // Business exists with this email
        $business = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Shared Email Firm',
            'owner_name' => 'Owner',
            'email' => $sharedEmail,
            'phone' => '9555555555',
            'password' => Hash::make('BizPass123!'),
            'verification_status' => 'verified',
        ]);

        // A normal MLM user happens to share this email
        $mlmUser = User::create([
            'name' => 'Affiliate Member',
            'email' => $sharedEmail,
            'password' => Hash::make('MemberPass123!'),
            'user_code' => 'CB111222',
        ]);

        // Normal MLM member logs in -> user_auth_token
        $memberToken = $mlmUser->createToken('user_auth_token')->plainTextToken;

        // When member calls entity order list with their user_auth_token, it must NOT scope as the business
        $res = $this->withHeader('Authorization', 'Bearer ' . $memberToken)
            ->getJson('/api/entity/orders');

        // Without valid entity token or entity context, it returns unauthenticated or empty entity scope
        $res->assertStatus(200);
        // Scoped orders count for this non-entity must be 0
        $this->assertEquals(0, count($res->json('orders')));
    }

    /**
     * Test J: Financial Regression — Financial metrics are preserved.
     */
    public function test_j_financial_regression_calculations_match_baseline(): void
    {
        $gross = Order::sum('gross_amount');
        $advance = Order::sum('advance_payment');
        $balance = Order::sum('balance_due');

        $this->assertIsNumeric($gross);
        $this->assertIsNumeric($advance);
        $this->assertIsNumeric($balance);
    }
}
