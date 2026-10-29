<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\EntityCommissionSetting;
use App\Models\Product;
use App\Models\Service;
use App\Models\SalesRecord;
use App\Models\SalePayment;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EntityCommissionSettingTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        config(['database.connections.mysql.database' => 'ad_net']);
        config(['database.default' => 'mysql']);
        \Illuminate\Support\Facades\DB::purge('mysql');

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Super Administrator',
            'username' => 'test_admin_' . uniqid(),
            'email' => 'admin_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);
    }

    public function test_entity_commission_settings_index_returns_correct_defaults_for_business(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/entity-commission-settings?entity_type=business');

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        // Find a business entity with default settings (e.g. entity_id 2 or 3)
        $defaultEntity = collect($data)->firstWhere('is_configured', false);
        $this->assertNotNull($defaultEntity, 'Should have at least one unconfigured business entity using defaults');

        $this->assertEquals(10.0, (float)$defaultEntity['direct_percent']);
        $this->assertEquals(4.0, (float)$defaultEntity['level_2_percent']);
        $this->assertEquals(3.0, (float)$defaultEntity['level_3_percent']);
        $this->assertEquals(2.0, (float)$defaultEntity['level_4_percent']);
        $this->assertEquals(1.0, (float)$defaultEntity['level_5_percent']);
        $this->assertEquals(5.0, (float)$defaultEntity['reward_percent']);

        // Verify Level 1 is completely absent
        $this->assertArrayNotHasKey('level_1_percent', $defaultEntity);
    }

    public function test_entity_commission_settings_index_returns_correct_defaults_for_freelancer(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/entity-commission-settings?entity_type=freelancer');

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $data = $response->json('data');
        $this->assertNotEmpty($data);

        // Find a freelancer entity with default settings (e.g. Sneha Kapoor, entity_id 2)
        $defaultFreelancer = collect($data)->firstWhere('is_configured', false);
        $this->assertNotNull($defaultFreelancer, 'Should have at least one unconfigured freelancer using defaults');

        $this->assertEquals(10.0, (float)$defaultFreelancer['direct_percent']);
        $this->assertEquals(4.0, (float)$defaultFreelancer['level_2_percent']);
        $this->assertEquals(3.0, (float)$defaultFreelancer['level_3_percent']);
        $this->assertEquals(2.0, (float)$defaultFreelancer['level_4_percent']);
        $this->assertEquals(1.0, (float)$defaultFreelancer['level_5_percent']);
        $this->assertEquals(5.0, (float)$defaultFreelancer['reward_percent']);
        $this->assertArrayNotHasKey('level_1_percent', $defaultFreelancer);
    }

    public function test_customized_settings_are_preserved_and_not_overwritten(): void
    {
        // Business Entity 1 (Apex Financial Advisory) has customized settings
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/entity-commission-settings?entity_type=business');

        $data = $response->json('data');
        $customEntity = collect($data)->firstWhere('entity_id', 1);

        $this->assertNotNull($customEntity);
        $this->assertTrue((bool)$customEntity['is_configured']);
        $this->assertEquals(8.5, (float)$customEntity['direct_percent']);
        $this->assertEquals(2.5, (float)$customEntity['level_2_percent']);
        $this->assertEquals(1.5, (float)$customEntity['level_3_percent']);
        $this->assertEquals(0.5, (float)$customEntity['level_4_percent']);
        $this->assertEquals(1.0, (float)$customEntity['level_5_percent']);
        $this->assertEquals(2.0, (float)$customEntity['reward_percent']);
        $this->assertArrayNotHasKey('level_1_percent', $customEntity);
    }

    public function test_new_business_entity_registration_succeeds_independently_without_forced_commission_attachment(): void
    {
        $category = EntityCategory::first() ?? EntityCategory::create(['name' => 'General Business', 'slug' => 'general-business']);

        $newBiz = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Automated Test Enterprise',
            'owner_name' => 'Test Director',
            'email' => 'automated_test_' . uniqid() . '@example.com',
            'phone' => '+91 9123456789',
        ]);

        $this->assertNotNull($newBiz->id, 'Business registration must succeed independently');

        // Setting row is NOT forced upon registration
        $explicitSetting = EntityCommissionSetting::where('entity_type', 'business')
            ->where('entity_id', $newBiz->id)
            ->first();
        $this->assertNull($explicitSetting, 'Commission setting row must NOT be forced during registration');

        // Resolving commission for this entity gracefully falls back to system defaults
        $resolved = EntityCommissionSetting::resolveForEntity('business', $newBiz->name, $newBiz->id);
        $this->assertEquals(10.00, (float)$resolved['direct_percent']);
        $this->assertEquals(4.00, (float)$resolved['level_2_percent']);
        $this->assertEquals(3.00, (float)$resolved['level_3_percent']);
        $this->assertEquals(2.00, (float)$resolved['level_4_percent']);
        $this->assertEquals(1.00, (float)$resolved['level_5_percent']);
        $this->assertEquals(5.00, (float)$resolved['reward_percent']);
        $this->assertFalse((bool)$resolved['is_custom']);

        // Clean up test entity
        $newBiz->delete();
    }

    public function test_admin_can_update_commission_settings(): void
    {
        $category = EntityCategory::first() ?? EntityCategory::create(['name' => 'General Business', 'slug' => 'general-business']);

        $biz = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Update Test Enterprise',
            'owner_name' => 'Test Owner',
            'email' => 'update_test_' . uniqid() . '@example.com',
            'phone' => '+91 9111122222',
        ]);

        $payload = [
            'entity_type' => 'business',
            'entity_id' => $biz->id,
            'direct_percent' => 15.5,
            'level_2_percent' => 6.0,
            'level_3_percent' => 4.5,
            'level_4_percent' => 2.5,
            'level_5_percent' => 1.5,
            'reward_percent' => 7.0,
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/entity-commission-settings', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'direct_percent' => 15.5,
                    'level_2_percent' => 6.0,
                    'level_3_percent' => 4.5,
                    'level_4_percent' => 2.5,
                    'level_5_percent' => 1.5,
                    'reward_percent' => 7.0,
                    'is_configured' => true,
                ],
            ]);

        $this->assertArrayNotHasKey('level_1_percent', $response->json('data'));

        // Verify stored in DB
        $dbSetting = EntityCommissionSetting::where('entity_type', 'business')
            ->where('entity_id', $biz->id)
            ->first();

        $this->assertEquals(15.5, (float)$dbSetting->direct_percent);
        $this->assertEquals(6.0, (float)$dbSetting->level_2_percent);
        $this->assertEquals(4.5, (float)$dbSetting->level_3_percent);
        $this->assertEquals(2.5, (float)$dbSetting->level_4_percent);
        $this->assertEquals(1.5, (float)$dbSetting->level_5_percent);
        $this->assertEquals(7.0, (float)$dbSetting->reward_percent);
        $this->assertTrue((bool)$dbSetting->is_custom);

        // Clean up
        $dbSetting->delete();
        $biz->delete();
    }

    public function test_validation_rejects_negative_or_exceeding_percentages(): void
    {
        $payload = [
            'entity_type' => 'business',
            'entity_id' => 1,
            'direct_percent' => -5,
            'level_2_percent' => 105,
            'level_3_percent' => 3,
            'level_4_percent' => 2,
            'level_5_percent' => 1,
            'reward_percent' => 5,
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/entity-commission-settings', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['direct_percent', 'level_2_percent']);
    }

    public function test_product_creation_resolves_and_attaches_commission_configuration(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/catalog/products', [
                'name' => 'Test Accounting Software ' . uniqid(),
                'category' => 'Software & IT',
                'owner_type' => 'business',
                'owner_name' => 'Skyline Technologies Pvt Ltd',
                'price' => 5000,
            ]);

        $response->assertStatus(201)
            ->assertJson(['status' => 'success']);

        $productData = $response->json('product');
        $this->assertNotNull($productData);
        $this->assertArrayHasKey('commission_settings', $productData);
        $this->assertEquals(10.0, (float)$productData['commission_settings']['direct_percent']);
        $this->assertEquals(4.0, (float)$productData['commission_settings']['level_2_percent']);
        $this->assertEquals(3.0, (float)$productData['commission_settings']['level_3_percent']);
        $this->assertEquals(2.0, (float)$productData['commission_settings']['level_4_percent']);
        $this->assertEquals(1.0, (float)$productData['commission_settings']['level_5_percent']);
        $this->assertEquals(5.0, (float)$productData['commission_settings']['reward_percent']);
    }

    public function test_product_inherits_custom_commission_rates(): void
    {
        // Apex Financial Advisory Pvt Ltd (business id 1) has custom rates:
        // direct 8.5%, l2 2.5%, l3 1.5%, l4 0.5%, l5 1.0%, reward 2.0%
        $response = $this->actingAs($this->admin)
            ->postJson('/api/catalog/products', [
                'name' => 'Apex Premium Tax Tool ' . uniqid(),
                'category' => 'Software & IT',
                'owner_type' => 'business',
                'owner_name' => 'Apex Financial Advisory Pvt Ltd',
                'price' => 8000,
            ]);

        $response->assertStatus(201)
            ->assertJson(['status' => 'success']);

        $productData = $response->json('product');
        $this->assertNotNull($productData);
        $this->assertTrue((bool)$productData['commission_settings']['is_custom']);
        $this->assertEquals(8.5, (float)$productData['commission_settings']['direct_percent']);
        $this->assertEquals(2.5, (float)$productData['commission_settings']['level_2_percent']);
        $this->assertEquals(1.5, (float)$productData['commission_settings']['level_3_percent']);
        $this->assertEquals(0.5, (float)$productData['commission_settings']['level_4_percent']);
        $this->assertEquals(1.0, (float)$productData['commission_settings']['level_5_percent']);
        $this->assertEquals(2.0, (float)$productData['commission_settings']['reward_percent']);
    }

    public function test_service_creation_resolves_and_attaches_commission_configuration(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/catalog/services', [
                'name' => 'Custom Legal Advisory ' . uniqid(),
                'category' => 'Legal & Compliance',
                'owner_type' => 'business',
                'owner_name' => 'ChhotaBusiness Tax Advisory',
                'price' => 3500,
            ]);

        $response->assertStatus(201)
            ->assertJson(['status' => 'success']);

        $serviceData = $response->json('service');
        $this->assertNotNull($serviceData);
        $this->assertArrayHasKey('commission_settings', $serviceData);
        $this->assertEquals(10.0, (float)$serviceData['commission_settings']['direct_percent']);
        $this->assertEquals(4.0, (float)$serviceData['commission_settings']['level_2_percent']);
        $this->assertEquals(3.0, (float)$serviceData['commission_settings']['level_3_percent']);
        $this->assertEquals(2.0, (float)$serviceData['commission_settings']['level_4_percent']);
        $this->assertEquals(1.0, (float)$serviceData['commission_settings']['level_5_percent']);
        $this->assertEquals(5.0, (float)$serviceData['commission_settings']['reward_percent']);
    }

    public function test_sales_record_calculates_commission_using_configured_rates(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/sales', [
                'item' => 'Test Commission Audit Service',
                'item_type' => 'service',
                'category' => 'Legal & Compliance',
                'unit_price' => 10000,
                'quantity' => 1,
                'gross_amount' => 10000,
                'advance_payment' => 10000,
                'customer_name' => 'Test Client',
                'customer_user_code' => 'CB100001',
                'entity_name' => 'ChhotaBusiness Tax Advisory',
                'entity_type' => 'business',
            ]);

        $response->assertStatus(201)
            ->assertJson(['status' => 'success']);

        $sale = $response->json('sale');
        // Default direct commission = 10% of 10000 = 1000
        $this->assertEquals(1000.0, (float)$sale['direct_commission']);
        // Default level commissions = 4+3+2+1 = 10% of 10000 = 1000
        $this->assertEquals(1000.0, (float)$sale['level_commissions_total']);
    }

    public function test_double_distribution_guard(): void
    {
        $sale = SalesRecord::create([
            'invoice_number' => 'INV-TEST-' . uniqid(),
            'date' => now()->toDateString(),
            'customer_name' => 'Guard Test User',
            'item' => 'Test Item',
            'unit_price' => 1000,
            'quantity' => 1,
            'gross_amount' => 1000,
            'advance_payment' => 1000,
            'balance_due' => 0,
            'admin_commission_percent' => 20,
            'admin_commission_cut' => 200,
            'net_entity_payout' => 800,
            'status' => 'completed',
            'network_distribution_status' => 'distributed',
            'commission_distributed' => true,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $sale->id,
            'invoice_number' => $sale->invoice_number,
            'entity_name' => 'Guard Biz',
            'customer_name' => 'Guard Test User',
            'amount' => 1000,
            'admin_commission_percent' => 20,
            'admin_commission_cut' => 200,
            'net_entity_amount' => 800,
            'payment_date' => now(),
            'network_distribution_status' => 'distributed',
            'commission_distributed' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/payments/{$payment->id}/distribute", [
                'referral_percent' => 40,
                'team_percent' => 20,
                'bp_percent' => 20,
            ]);

        $response->assertStatus(400)
            ->assertJson(['status' => 'error', 'message' => 'Commission has already been distributed for this payment receipt.']);
    }
}
