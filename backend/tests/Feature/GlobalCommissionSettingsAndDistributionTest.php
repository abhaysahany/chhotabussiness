<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\CommissionSetting;
use App\Models\DirectIncome;
use App\Models\EntityCategory;
use App\Models\FreelancerEntity;
use App\Models\LevelIncome;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\WalletTransfer;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class GlobalCommissionSettingsAndDistributionTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $u5;
    protected User $u4;
    protected User $u3;
    protected User $u2;
    protected User $u1;
    protected User $buyer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Global Commission Test Admin',
            'username' => 'comm_admin_' . uniqid(),
            'email' => 'comm_admin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);
        $this->adminToken = $this->admin->createToken('admin_comm_test', ['admin'])->plainTextToken;

        // Hierarchy: Root -> u5 (L5) -> u4 (L4) -> u3 (L3) -> u2 (L2) -> u1 (L1 / Direct Sponsor) -> buyer
        $this->u5 = User::create([
            'name' => 'Level 5 Member',
            'email' => 'u5_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => 'Root',
            'commission_balance' => 0.00,
        ]);

        $this->u4 = User::create([
            'name' => 'Level 4 Member',
            'email' => 'u4_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => $this->u5->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->u3 = User::create([
            'name' => 'Level 3 Member',
            'email' => 'u3_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => $this->u4->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->u2 = User::create([
            'name' => 'Level 2 Member',
            'email' => 'u2_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => $this->u3->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->u1 = User::create([
            'name' => 'Level 1 Direct Sponsor',
            'email' => 'u1_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => $this->u2->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->buyer = User::create([
            'name' => 'Buyer Member',
            'email' => 'buyer_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => $this->u1->user_code,
            'commission_balance' => 0.00,
        ]);
    }

    protected function createConfirmedOrderWithPayment(float $grossAmount, float $adminPercent, float $paymentAmount): array
    {
        $adminCut = round(($paymentAmount * $adminPercent) / 100, 2);
        $expectedCut = round(($grossAmount * $adminPercent) / 100, 2);
        $netEntity = round($paymentAmount - $adminCut, 2);

        $order = Order::create([
            'invoice_number' => 'INV-GLB-' . random_int(10000, 99999) . '-' . substr(uniqid(), -3),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Test Vendor Entity',
            'entity_type' => 'business',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'customer' => "{$this->buyer->name} ({$this->buyer->user_code})",
            'sponsor' => $this->u1->user_code,
            'item' => 'Enterprise Suite',
            'item_type' => 'service',
            'gross_amount' => $grossAmount,
            'advance_payment' => $paymentAmount,
            'balance_due' => max(0.0, $grossAmount - $paymentAmount),
            'admin_commission_percent' => $adminPercent,
            'admin_commission_cut' => $expectedCut,
            'net_entity_payout' => $netEntity,
            'status' => ($grossAmount <= $paymentAmount) ? 'completed' : 'partial',
            'approval_status' => 'confirmed',
            'income_distribution_status' => 'pending',
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => $paymentAmount,
            'admin_commission_percent' => $adminPercent,
            'admin_commission_cut' => $adminCut,
            'net_entity_amount' => $netEntity,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . random_int(100000, 999999),
            'payment_type' => ($grossAmount <= $paymentAmount) ? 'full' : 'advance',
            'payment_date' => now(),
            'income_distribution_status' => 'pending',
        ]);

        return [$order, $payment];
    }

    public function test_admin_can_fetch_single_global_commission_settings_with_dynamic_levels(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/commission-settings');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'exists' => true,
            ]);

        $data = $response->json('data');
        $this->assertEquals('global', $data['setting_key']);
        $this->assertEquals(100.0, (float) $data['total_percent']);
        $this->assertIsArray($data['levels']);
        $this->assertCount(5, $data['levels']);
        $this->assertEquals(1, CommissionSetting::count());
    }

    public function test_saving_global_commission_settings_updates_same_singleton_row_and_supports_decimals(): void
    {
        $existingId = CommissionSetting::where('setting_key', 'global')->value('id');

        $payload = [
            'direct_percent' => 37.5,
            'level_1_percent' => 12.5,
            'level_2_percent' => 10.0,
            'level_3_percent' => 10.0,
            'level_4_percent' => 5.0,
            'level_5_percent' => 5.0,
            'reward_level_1_percent' => 15.0,
            'reward_level_2_percent' => 5.0,
        ];

        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', $payload);

        $res1->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $existingId,
                    'setting_key' => 'global',
                    'updated_by_admin_id' => $this->admin->id,
                ],
            ]);

        $d1 = $res1->json('data');
        $this->assertEquals(37.5, (float) $d1['direct_percent']);
        $this->assertEquals(12.5, (float) $d1['level_1_percent']);
        $this->assertEquals(10.0, (float) $d1['level_2_percent']);
        $this->assertEquals(10.0, (float) $d1['level_3_percent']);
        $this->assertEquals(5.0, (float) $d1['level_4_percent']);
        $this->assertEquals(5.0, (float) $d1['level_5_percent']);
        $this->assertEquals(20.0, (float) $d1['reward_percent']);
        $this->assertEquals(42.5, (float) $d1['level_total_percent']);
        $this->assertEquals(100.0, (float) $d1['total_percent']);

        // Second save updates the exact same row rather than creating duplicates
        $payload2 = [
            'direct_percent' => 40,
            'level_1_percent' => 15,
            'level_2_percent' => 10,
            'level_3_percent' => 15,
            'level_4_percent' => 0,
            'level_5_percent' => 0,
            'reward_level_1_percent' => 15,
            'reward_level_2_percent' => 5,
        ];

        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson('/api/admin/commission-settings', $payload2);

        $res2->assertStatus(200)
            ->assertJsonPath('data.id', $existingId);

        $this->assertEquals(1, CommissionSetting::count());
    }

    public function test_validation_rejects_negative_over_100_empty_and_non_100_totals(): void
    {
        // Negative and > 100
        $resBadBounds = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => -5,
                'level_1_percent' => 105,
                'level_2_percent' => 0,
                'level_3_percent' => 0,
                'level_4_percent' => 0,
                'level_5_percent' => 0,
                'reward_level_1_percent' => 0,
                'reward_level_2_percent' => 0,
            ]);
        $resBadBounds->assertStatus(422)
            ->assertJsonValidationErrors(['direct_percent', 'level_1_percent']);

        // Total below 100% (95%)
        $resBelow = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => 40,
                'level_1_percent' => 15,
                'level_2_percent' => 10,
                'level_3_percent' => 10,
                'level_4_percent' => 0,
                'level_5_percent' => 0,
                'reward_level_1_percent' => 15,
                'reward_level_2_percent' => 5,
            ]);
        $resBelow->assertStatus(422)
            ->assertJsonValidationErrors(['total_percent']);

        // Total above 100% (105%)
        $resAbove = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => 45,
                'level_1_percent' => 15,
                'level_2_percent' => 10,
                'level_3_percent' => 15,
                'level_4_percent' => 0,
                'level_5_percent' => 0,
                'reward_level_1_percent' => 15,
                'reward_level_2_percent' => 5,
            ]);
        $resAbove->assertStatus(422)
            ->assertJsonValidationErrors(['total_percent']);

        // Missing fields
        $resEmpty = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', []);
        $resEmpty->assertStatus(422)
            ->assertJsonValidationErrors(['direct_percent', 'level_1_percent', 'reward_level_1_percent', 'reward_level_2_percent']);
    }

    public function test_unauthorized_user_and_entities_cannot_view_or_update_commission_settings(): void
    {
        $userToken = $this->buyer->createToken('user_token', ['user'])->plainTextToken;
        $category = EntityCategory::first() ?? EntityCategory::create(['name' => 'General', 'slug' => 'general']);

        $biz = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Unauthorized Biz',
            'owner_name' => 'Owner',
            'email' => 'unauth_biz_' . uniqid() . '@example.com',
            'phone' => '9999999999',
        ]);
        $bizToken = $biz->createToken('entity_token', ['entity'])->plainTextToken;

        $freelancer = FreelancerEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Unauthorized Freelancer',
            'title' => 'Consultant',
            'email' => 'unauth_free_' . uniqid() . '@example.com',
            'phone' => '8888888888',
        ]);
        $freeToken = $freelancer->createToken('freelancer_token', ['entity'])->plainTextToken;

        $validPayload = [
            'direct_percent' => 40,
            'level_1_percent' => 15,
            'level_2_percent' => 10,
            'level_3_percent' => 15,
            'level_4_percent' => 0,
            'level_5_percent' => 0,
            'reward_level_1_percent' => 15,
            'reward_level_2_percent' => 5,
        ];

        // Unauthenticated
        $this->getJson('/api/admin/commission-settings')->assertStatus(401);
        $this->postJson('/api/admin/commission-settings', $validPayload)->assertStatus(401);

        // User
        $this->withHeader('Authorization', 'Bearer ' . $userToken)->getJson('/api/admin/commission-settings')->assertStatus(403);
        $this->withHeader('Authorization', 'Bearer ' . $userToken)->postJson('/api/admin/commission-settings', $validPayload)->assertStatus(403);

        // Business Entity
        $this->withHeader('Authorization', 'Bearer ' . $bizToken)->getJson('/api/admin/commission-settings')->assertStatus(403);
        $this->withHeader('Authorization', 'Bearer ' . $bizToken)->postJson('/api/admin/commission-settings', $validPayload)->assertStatus(403);

        // Freelancer Entity
        $this->withHeader('Authorization', 'Bearer ' . $freeToken)->getJson('/api/admin/commission-settings')->assertStatus(403);
        $this->withHeader('Authorization', 'Bearer ' . $freeToken)->postJson('/api/admin/commission-settings', $validPayload)->assertStatus(403);
    }

    public function test_dynamic_distribution_uses_saved_settings_and_preserves_historical_records(): void
    {
        // Step 1: Save Configuration A (40% Direct, L1=15%, L2=10%, L3=15%, L4=0%, L5=0%, Reward L1=15%, Reward L2=5%)
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => 40,
                'level_1_percent' => 15,
                'level_2_percent' => 10,
                'level_3_percent' => 15,
                'level_4_percent' => 0,
                'level_5_percent' => 0,
                'reward_level_1_percent' => 15,
                'reward_level_2_percent' => 5,
            ])->assertStatus(200);

        // Order/Payment 1 with ₹10,000 distributable Admin Cut (₹50,000 * 20%)
        [$order1, $payment1] = $this->createConfirmedOrderWithPayment(50000.00, 20.00, 50000.00);

        $allocRes1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment1->id}/income-allocation");

        $allocRes1->assertStatus(200)
            ->assertJsonPath('allocated.direct_income_amount', 4000)
            ->assertJsonPath('allocated.level_income_amount', 4000)
            ->assertJsonPath('allocated.reward_income_amount', 2000)
            ->assertJsonPath('allocated.total_allocated', 10000);

        // Verify exact per-recipient credits for Config A on ₹10,000 base:
        // Direct Sponsor u1 receives ₹4,000 Direct + ₹1,500 Level 1 = ₹5,500
        $this->u1->refresh();
        $this->u2->refresh();
        $this->u3->refresh();
        $this->u4->refresh();
        $this->u5->refresh();

        $this->assertEquals(5500.00, (float) $this->u1->commission_balance);
        $this->assertEquals(1000.00, (float) $this->u2->commission_balance); // Level 2 = 10%
        $this->assertEquals(1500.00, (float) $this->u3->commission_balance); // Level 3 = 15%
        $this->assertEquals(0.00, (float) $this->u4->commission_balance);    // Level 4 = 0%
        $this->assertEquals(0.00, (float) $this->u5->commission_balance);    // Level 5 = 0%

        $p1DirectRow = DirectIncome::where('user_code', $this->u1->user_code)->latest('id')->first();
        $this->assertNotNull($p1DirectRow);
        $this->assertEquals(4000.00, (float) $p1DirectRow->total_amount);

        $p1L1Row = LevelIncome::where('user_code', $this->u1->user_code)->where('level', 1)->first();
        $this->assertNotNull($p1L1Row);
        $this->assertEquals(1500.00, (float) $p1L1Row->total_amount);

        // Duplicate call must be blocked (idempotency preserved)
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment1->id}/income-allocation")
            ->assertStatus(422);

        // Step 2: Update Configuration to Configuration B (25% Direct, L1=5%, L2=20%, L3=15%, L4=10%, L5=10%, Reward L1=10%, Reward L2=5%)
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => 25,
                'level_1_percent' => 5,
                'level_2_percent' => 20,
                'level_3_percent' => 15,
                'level_4_percent' => 10,
                'level_5_percent' => 10,
                'reward_level_1_percent' => 10,
                'reward_level_2_percent' => 5,
            ])->assertStatus(200);

        // Historical data protection check: Payment 1 & prior rows MUST remain completely untouched!
        $payment1->refresh();
        $order1->refresh();
        $p1DirectRow->refresh();
        $p1L1Row->refresh();
        $this->assertEquals(4000.00, (float) $payment1->direct_income_amount);
        $this->assertEquals(4000.00, (float) $payment1->level_income_amount);
        $this->assertEquals(2000.00, (float) $payment1->reward_income_amount);
        $this->assertEquals(4000.00, (float) $order1->direct_income_amount);
        $this->assertEquals(4000.00, (float) $p1DirectRow->total_amount);
        $this->assertEquals(1500.00, (float) $p1L1Row->total_amount);

        // Preview on already-completed Payment 1 must preserve stored historical amounts
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/payments/{$payment1->id}/income-allocation")
            ->assertStatus(200)
            ->assertJsonPath('allocation.direct_income_amount', 4000)
            ->assertJsonPath('allocation.level_income_amount', 4000)
            ->assertJsonPath('allocation.reward_income_amount', 2000);

        // Step 3: Allocate Payment 2 (also ₹10,000 Admin Cut) under Configuration B
        [$order2, $payment2] = $this->createConfirmedOrderWithPayment(50000.00, 20.00, 50000.00);

        $allocRes2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment2->id}/income-allocation");

        $allocRes2->assertStatus(200)
            ->assertJsonPath('allocated.direct_income_amount', 2500)
            ->assertJsonPath('allocated.level_income_amount', 6000)
            ->assertJsonPath('allocated.reward_income_amount', 1500)
            ->assertJsonPath('allocated.total_allocated', 10000);

        $this->u1->refresh();
        $this->u2->refresh();
        $this->u3->refresh();
        $this->u4->refresh();
        $this->u5->refresh();

        // u1 gained ₹2,500 Direct + ₹500 L1 = +₹3,000 => total ₹8,500
        $this->assertEquals(8500.00, (float) $this->u1->commission_balance);
        // u2 gained +₹2,000 => total ₹3,000
        $this->assertEquals(3000.00, (float) $this->u2->commission_balance);
        // u3 gained +₹1,500 => total ₹3,000
        $this->assertEquals(3000.00, (float) $this->u3->commission_balance);
        // u4 gained +₹1,000
        $this->assertEquals(1000.00, (float) $this->u4->commission_balance);
        // u5 gained +₹1,000
        $this->assertEquals(1000.00, (float) $this->u5->commission_balance);
    }

    public function test_missing_or_invalid_global_configuration_fails_safely_without_hardcoded_fallback(): void
    {
        [$order, $payment] = $this->createConfirmedOrderWithPayment(50000.00, 20.00, 50000.00);

        // Case 1: Invalid total in DB (sum != 100%)
        DB::table('commission_settings')
            ->where('setting_key', 'global')
            ->update(['direct_percent' => 10.00]); // sum now 70%

        $resInvalid = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $resInvalid->assertStatus(422);
        $this->assertEquals('pending', $payment->fresh()->income_distribution_status);
        $this->assertEquals(0.00, (float) $this->u1->fresh()->commission_balance);

        // Case 2: Missing configuration row completely
        DB::table('commission_settings')->delete();

        $resMissing = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $resMissing->assertStatus(422);
        $this->assertEquals('pending', $payment->fresh()->income_distribution_status);
        $this->assertEquals(0.00, (float) $this->u1->fresh()->commission_balance);
    }
}
