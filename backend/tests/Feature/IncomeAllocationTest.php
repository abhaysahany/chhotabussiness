<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Services\AdminIncomeAllocationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class IncomeAllocationTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Test Super Admin',
            'username' => 'testadmin_' . uniqid(),
            'email' => 'testadmin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('test_admin_token', ['admin'])->plainTextToken;

        $this->user = User::first() ?? User::create([
            'name' => 'Test Member',
            'email' => 'testmember_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);
    }

    /**
     * Test 1: New order with no received payment has no allocatable Admin Cut.
     */
    public function test_new_order_with_no_received_payment_has_no_allocatable_admin_cut(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'customer' => "{$this->user->name} ({$this->user->user_code})",
            'sponsor' => 'CB100001',
            'item' => 'Ad Package',
            'item_type' => 'service',
            'gross_amount' => 100000.00,
            'advance_payment' => 0.00,
            'balance_due' => 100000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 0.00,
            'status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/orders/{$order->id}/income-allocation");

        $response->assertStatus(200);
        $data = $response->json('allocation');

        $this->assertEquals(0.0, $data['total_admin_cut']);
        $this->assertEquals(0.0, $data['eligible_admin_cut']);
        $this->assertEquals(0.0, $data['previously_allocated']);
        $this->assertEquals('pending', $data['distribution_status']);
        $this->assertFalse($data['can_allocate']);
    }

    /**
     * Test 2 & 3: Advance payment of ₹20,000 at 15% produces ₹3,000 eligible Admin Cut
     * and live preview calculates 40% Direct (₹1,200), 40% Level (₹1,200), 20% Reward (₹600).
     */
    public function test_advance_payment_produces_exact_three_income_amounts(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'customer' => "{$this->user->name} ({$this->user->user_code})",
            'sponsor' => 'CB100001',
            'item' => 'Ad Package',
            'item_type' => 'service',
            'gross_amount' => 100000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 3000.00, // 15% of 20000
            'status' => 'partial',
        ]);

        SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 3000.00,
            'net_entity_amount' => 17000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'advance',
            'payment_date' => now(),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/orders/{$order->id}/income-allocation");

        $response->assertStatus(200);
        $data = $response->json('allocation');

        $this->assertEquals(3000.0, $data['total_admin_cut']);
        $this->assertEquals(0.0, $data['previously_allocated']);
        $this->assertEquals(3000.0, $data['eligible_admin_cut']);
        $this->assertEquals(1200.0, $data['direct_income_amount']); // 40%
        $this->assertEquals(1200.0, $data['level_income_amount']);  // 40%
        $this->assertEquals(600.0, $data['reward_income_amount']);   // 20%
        $this->assertEquals(3000.0, $data['total_allocation']);     // 100%
        $this->assertEquals('pending', $data['distribution_status']);
        $this->assertTrue($data['can_allocate']);
    }

    /**
     * Test 4 & 5: Confirming allocation persists amounts and repeated clicks are idempotent (safe from double allocation).
     */
    public function test_confirm_allocation_persists_and_prevents_duplicate_allocation(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'customer' => "{$this->user->name} ({$this->user->user_code})",
            'sponsor' => 'CB100001',
            'item' => 'Ad Package',
            'item_type' => 'service',
            'gross_amount' => 100000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 3000.00,
            'status' => 'partial',
        ]);

        SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 3000.00,
            'net_entity_amount' => 17000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'advance',
            'payment_date' => now(),
        ]);

        // First Confirm
        $confirmResponse1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/income-allocation");

        $confirmResponse1->assertStatus(200);
        $order->refresh();

        $this->assertEquals(1200.0, (float) $order->direct_income_amount);
        $this->assertEquals(1200.0, (float) $order->level_income_amount);
        $this->assertEquals(600.0, (float) $order->reward_income_amount);
        $this->assertEquals(3000.0, (float) $order->distributed_admin_cut_amount);
        $this->assertEquals('completed', $order->income_distribution_status);
        $this->assertNotNull($order->income_distributed_at);

        // Second Confirm (Must fail with 422 - No double allocation)
        $confirmResponse2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/income-allocation");

        $confirmResponse2->assertStatus(422);

        // Ensure order amounts did not double
        $order->refresh();
        $this->assertEquals(1200.0, (float) $order->direct_income_amount);
        $this->assertEquals(1200.0, (float) $order->level_income_amount);
        $this->assertEquals(600.0, (float) $order->reward_income_amount);
        $this->assertEquals(3000.0, (float) $order->distributed_admin_cut_amount);
    }

    /**
     * Test 6, 7 & 8: Second payment of ₹40,000 at 15% makes only ₹6,000 newly eligible,
     * accumulating to Direct ₹3,600, Level ₹3,600, Reward ₹1,800, Distributed Admin Cut ₹9,000.
     */
    public function test_subsequent_balance_payment_accumulates_income_amounts(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'customer' => "{$this->user->name} ({$this->user->user_code})",
            'sponsor' => 'CB100001',
            'item' => 'Ad Package',
            'item_type' => 'service',
            'gross_amount' => 100000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 3000.00,
            'status' => 'partial',
        ]);

        SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 3000.00,
            'net_entity_amount' => 17000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'advance',
            'payment_date' => now(),
        ]);

        // First allocation of ₹3,000
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/income-allocation")
            ->assertStatus(200);

        // Now, a subsequent balance payment of ₹40,000 is received
        SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 40000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 6000.00, // 15% of 40000
            'net_entity_amount' => 34000.00,
            'payment_method' => 'Bank Transfer',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'balance',
            'payment_date' => now(),
        ]);

        $order->update([
            'advance_payment' => 60000.00,
            'balance_due' => 40000.00,
            'admin_commission_cut' => 9000.00, // 3000 + 6000
            'income_distribution_status' => 'partial',
        ]);

        // Preview should now show only ₹6,000 eligible
        $previewResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/orders/{$order->id}/income-allocation");

        $previewResponse->assertStatus(200);
        $previewData = $previewResponse->json('allocation');

        $this->assertEquals(9000.0, $previewData['total_admin_cut']);
        $this->assertEquals(3000.0, $previewData['previously_allocated']);
        $this->assertEquals(6000.0, $previewData['eligible_admin_cut']); // Exactly ₹6,000, NOT ₹9,000
        $this->assertEquals(2400.0, $previewData['direct_income_amount']); // 40% of 6000
        $this->assertEquals(2400.0, $previewData['level_income_amount']);  // 40% of 6000
        $this->assertEquals(1200.0, $previewData['reward_income_amount']); // 20% of 6000
        $this->assertEquals(6000.0, $previewData['total_allocation']);
        $this->assertEquals('partial', $previewData['distribution_status']);

        // Second Confirm
        $secondConfirm = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/income-allocation");

        $secondConfirm->assertStatus(200);
        $order->refresh();

        // Exact expected accumulated totals:
        // Direct: 1200 + 2400 = 3600
        // Level: 1200 + 2400 = 3600
        // Reward: 600 + 1200 = 1800
        // Distributed Admin Cut: 3000 + 6000 = 9000
        $this->assertEquals(3600.0, (float) $order->direct_income_amount);
        $this->assertEquals(3600.0, (float) $order->level_income_amount);
        $this->assertEquals(1800.0, (float) $order->reward_income_amount);
        $this->assertEquals(9000.0, (float) $order->distributed_admin_cut_amount);
        $this->assertEquals('completed', $order->income_distribution_status);
    }

    /**
     * Test 9: Decimal-safe rounding handles 1-paisa remainders deterministically.
     */
    public function test_decimal_rounding_always_sums_to_exact_eligible_admin_cut(): void
    {
        $service = app(AdminIncomeAllocationService::class);

        // Case 1: ₹33.33 -> 40% is 13.332, 20% is 6.666
        $split1 = $service->calculateSplit(33.33);
        $this->assertEquals(13.33, $split1['direct_amount']);
        $this->assertEquals(13.33, $split1['level_amount']);
        $this->assertEquals(6.67, $split1['reward_amount']);
        $this->assertEquals(33.33, round($split1['direct_amount'] + $split1['level_amount'] + $split1['reward_amount'], 2));

        // Case 2: ₹100.01
        $split2 = $service->calculateSplit(100.01);
        $this->assertEquals(100.01, round($split2['direct_amount'] + $split2['level_amount'] + $split2['reward_amount'], 2));

        // Case 3: ₹0.03
        $split3 = $service->calculateSplit(0.03);
        $this->assertEquals(0.03, round($split3['direct_amount'] + $split3['level_amount'] + $split3['reward_amount'], 2));
    }

    /**
     * Test 10: Non-admin request is rejected with 401 Unauthorized.
     */
    public function test_unauthorized_caller_cannot_access_income_allocation(): void
    {
        $userToken = $this->user->createToken('user_token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->getJson("/api/admin/orders/1/income-allocation")
            ->assertStatus(401);

        $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->postJson("/api/admin/orders/1/income-allocation")
            ->assertStatus(401);
    }

    /**
     * Test 11: Allocation never alters user wallet balances, PV, BV, or payouts.
     */
    public function test_allocation_does_not_modify_user_wallets_or_mlm_balances(): void
    {
        $initialCommission = (float) $this->user->commission_balance;
        $initialTeamBiz = (float) $this->user->team_biz_balance;
        $initialPv = (float) $this->user->personal_pv;

        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'customer' => "{$this->user->name} ({$this->user->user_code})",
            'sponsor' => 'CB100001',
            'item' => 'Ad Package',
            'item_type' => 'service',
            'gross_amount' => 5000.00,
            'advance_payment' => 5000.00,
            'balance_due' => 0.00,
            'admin_commission_percent' => 20.0,
            'admin_commission_cut' => 1000.00,
            'status' => 'completed',
        ]);

        SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 5000.00,
            'admin_commission_percent' => 20.0,
            'admin_commission_cut' => 1000.00,
            'net_entity_amount' => 4000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'full',
            'payment_date' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/income-allocation")
            ->assertStatus(200);

        $this->user->refresh();
        $this->assertEquals($initialCommission, (float) $this->user->commission_balance);
        $this->assertEquals($initialTeamBiz, (float) $this->user->team_biz_balance);
        $this->assertEquals($initialPv, (float) $this->user->personal_pv);
    }

    /**
     * Test 12: Incremental payment allocation scenario (Specification Scenario: ₹75k order, ₹30k advance + ₹20k balance).
     * Tests per-payment independence, dynamic reopening to 'partial', and cumulative Order totals.
     */
    public function test_payment_level_allocation_scenario_with_dynamic_status_reopening(): void
    {
        // 1. Create Order: ₹75,000 Project Value, 15% Admin Commission rate
        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'customer' => "{$this->user->name} ({$this->user->user_code})",
            'sponsor' => 'CB100001',
            'item' => 'Ad Package Pro',
            'item_type' => 'service',
            'gross_amount' => 75000.00,
            'advance_payment' => 30000.00,
            'balance_due' => 45000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 4500.00, // 15% of 30,000
            'status' => 'partial',
            'dump_amount' => 0.00,
            'income_distribution_status' => 'pending',
        ]);

        // 2. First Payment receipt: ₹30,000 advance -> Admin Cut ₹4,500
        $payment1 = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 30000.00,
            'admin_commission_percent' => 15.0,
            'admin_commission_cut' => 4500.00,
            'net_entity_amount' => 25500.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'advance',
            'payment_date' => now(),
            'income_distribution_status' => 'pending',
            'distributed_admin_cut_amount' => 0.00,
        ]);

        // 3. Preview Payment 1 Allocation
        $previewRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/payments/{$payment1->id}/income-allocation");

        $previewRes->assertStatus(200);
        $preview1 = $previewRes->json('allocation');
        $this->assertEquals(4500.0, $preview1['payment_admin_cut']);
        $this->assertEquals(4500.0, $preview1['eligible_admin_cut']);
        $this->assertEquals(1800.0, $preview1['direct_income_amount']); // 40% of 4500
        $this->assertEquals(1800.0, $preview1['level_income_amount']);  // 40% of 4500
        $this->assertEquals(900.0, $preview1['reward_income_amount']);   // 20% of 4500
        $this->assertEquals(4500.0, $preview1['total_allocation']);     // 100%
        $this->assertTrue($preview1['can_allocate']);

        // 4. Confirm Payment 1 Allocation
        $alloc1Res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment1->id}/income-allocation");

        $alloc1Res->assertStatus(200);
        $payment1->refresh();
        $order->refresh();

        $this->assertEquals('completed', $payment1->income_distribution_status);
        $this->assertEquals(4500.0, (float) $payment1->distributed_admin_cut_amount);
        $this->assertEquals(1800.0, (float) $payment1->direct_income_amount);
        $this->assertEquals(1800.0, (float) $payment1->level_income_amount);
        $this->assertEquals(900.0, (float) $payment1->reward_income_amount);

        // Order summary totals after payment 1
        $this->assertEquals(4500.0, (float) $order->distributed_admin_cut_amount);
        $this->assertEquals(1800.0, (float) $order->direct_income_amount);
        $this->assertEquals(1800.0, (float) $order->level_income_amount);
        $this->assertEquals(900.0, (float) $order->reward_income_amount);
        $this->assertEquals('completed', $order->income_distribution_status);

        // 5. Duplicate Allocation Attempt on Payment 1 must fail with 422
        $dupRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment1->id}/income-allocation");
        $dupRes->assertStatus(422);

        // 6. Entity receives subsequent balance payment: ₹20,000
        $balanceRes = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 20000.00,
            'payment_method' => 'Bank Transfer',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'notes' => 'Second installment received',
        ]);
        $balanceRes->assertStatus(200);

        $order->refresh();
        // Payment 2 was created
        $this->assertCount(2, $order->payments);
        $payment2 = $order->payments()->orderBy('id', 'desc')->first();

        $this->assertEquals(20000.0, (float) $payment2->amount);
        $this->assertEquals(3000.0, (float) $payment2->admin_commission_cut); // 15% of 20000
        $this->assertEquals('pending', $payment2->income_distribution_status);
        $this->assertEquals(0.0, (float) $payment2->distributed_admin_cut_amount);

        // CRITICAL CHECK: Order status dynamically reopened from 'completed' to 'partial'!
        $this->assertEquals('partial', $order->income_distribution_status);

        // 7. Preview Payment 2 Allocation: Uses ONLY Payment 2's Admin Cut (₹3,000), not whole order
        $preview2Res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/payments/{$payment2->id}/income-allocation");

        $preview2Res->assertStatus(200);
        $preview2 = $preview2Res->json('allocation');
        $this->assertEquals(3000.0, $preview2['payment_admin_cut']);
        $this->assertEquals(3000.0, $preview2['eligible_admin_cut']);
        $this->assertEquals(1200.0, $preview2['direct_income_amount']); // 40% of 3000
        $this->assertEquals(1200.0, $preview2['level_income_amount']);  // 40% of 3000
        $this->assertEquals(600.0, $preview2['reward_income_amount']);   // 20% of 3000
        $this->assertEquals(3000.0, $preview2['total_allocation']);     // 100% of 3000
        $this->assertTrue($preview2['can_allocate']);

        // 8. Confirm Payment 2 Allocation
        $alloc2Res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment2->id}/income-allocation");

        $alloc2Res->assertStatus(200);
        $payment2->refresh();
        $order->refresh();

        $this->assertEquals('completed', $payment2->income_distribution_status);
        $this->assertEquals(3000.0, (float) $payment2->distributed_admin_cut_amount);
        $this->assertEquals(1200.0, (float) $payment2->direct_income_amount);
        $this->assertEquals(1200.0, (float) $payment2->level_income_amount);
        $this->assertEquals(600.0, (float) $payment2->reward_income_amount);

        // CRITICAL CHECK: Cumulative Order totals accumulated accurately:
        // Direct: 1,800 + 1,200 = 3,000
        // Level:  1,800 + 1,200 = 3,000
        // Reward:   900 +   600 = 1,500
        // Total Distributed Admin Cut: 4,500 + 3,000 = 7,500
        $this->assertEquals(3000.0, (float) $order->direct_income_amount);
        $this->assertEquals(3000.0, (float) $order->level_income_amount);
        $this->assertEquals(1500.0, (float) $order->reward_income_amount);
        $this->assertEquals(7500.0, (float) $order->distributed_admin_cut_amount);
        $this->assertEquals('completed', $order->income_distribution_status);
    }

    /**
     * Test 13: Order Dump Amount CRUD and complete isolation from income allocation math.
     */
    public function test_order_dump_amount_crud_and_isolation_from_allocation_math(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'customer' => "{$this->user->name} ({$this->user->user_code})",
            'sponsor' => 'CB100001',
            'item' => 'Ad Package Pro',
            'item_type' => 'service',
            'gross_amount' => 50000.00,
            'advance_payment' => 10000.00,
            'balance_due' => 40000.00,
            'admin_commission_percent' => 10.0,
            'admin_commission_cut' => 1000.00,
            'status' => 'partial',
            'dump_amount' => 0.00,
            'income_distribution_status' => 'pending',
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 10000.00,
            'admin_commission_percent' => 10.0,
            'admin_commission_cut' => 1000.00,
            'net_entity_amount' => 9000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'advance',
            'payment_date' => now(),
            'income_distribution_status' => 'pending',
            'distributed_admin_cut_amount' => 0.00,
        ]);

        // Default is 0.00
        $this->assertEquals(0.0, (float) $order->dump_amount);

        // Update dump amount to ₹2,500.50 via PUT
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/admin/orders/{$order->id}/dump-amount", [
                'dump_amount' => 2500.50,
            ]);

        $updateRes->assertStatus(200);
        $order->refresh();
        $this->assertEquals(2500.50, (float) $order->dump_amount);

        // Negative dump amount must be rejected with 422
        $negRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/admin/orders/{$order->id}/dump-amount", [
                'dump_amount' => -100,
            ]);
        $negRes->assertStatus(422);

        // Allocation preview must NOT subtract or change based on dump amount
        $previewRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/payments/{$payment->id}/income-allocation");

        $previewRes->assertStatus(200);
        $preview = $previewRes->json('allocation');
        $this->assertEquals(1000.0, $preview['payment_admin_cut']);
        $this->assertEquals(1000.0, $preview['eligible_admin_cut']);
        $this->assertEquals(400.0, $preview['direct_income_amount']); // exactly 40%
        $this->assertEquals(400.0, $preview['level_income_amount']);  // exactly 40%
        $this->assertEquals(200.0, $preview['reward_income_amount']); // exactly 20%
        $this->assertEquals(1000.0, $preview['total_allocation']);
    }
}
