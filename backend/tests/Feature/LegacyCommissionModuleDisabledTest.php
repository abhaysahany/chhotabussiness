<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class LegacyCommissionModuleDisabledTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Legacy Disable Test Admin',
            'username' => 'legadmin_' . uniqid(),
            'email' => 'legadmin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('leg_admin_token', ['admin'])->plainTextToken;

        $this->user = User::first() ?? User::create([
            'name' => 'Legacy Test Buyer',
            'email' => 'leguser_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);
    }

    /**
     * Test 1: Legacy Payment Distribute Endpoint Returns HTTP 410 Gone
     */
    public function test_legacy_payment_distribute_api_returns_410_gone(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-LEG-1-' . rand(10000, 99999),
            'item' => 'Solar Power Unit',
            'gross_amount' => 50000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 7500.00,
            'advance_payment' => 20000.00,
            'balance_due' => 30000.00,
            'customer_name' => $this->user->name,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        // Attempt calling legacy admin payment distribute endpoint
        $response1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/distribute", [
                'referral_percent' => 40,
                'team_percent' => 20,
                'bp_percent' => 20,
            ]);

        $response1->assertStatus(410);
        $response1->assertJson([
            'status' => 'error',
            'code' => 'LEGACY_MODULE_DISABLED',
        ]);

        // Attempt calling public/fallback legacy payment distribute endpoint
        $response2 = $this->postJson("/api/payments/{$payment->id}/distribute");
        $response2->assertStatus(410);
        $response2->assertJson([
            'status' => 'error',
            'code' => 'LEGACY_MODULE_DISABLED',
        ]);

        // Verify NO commission balance was credited to user
        $payment->refresh();
        $this->assertEquals('pending', $payment->income_distribution_status);
    }

    /**
     * Test 2: Legacy Order Distribute Endpoint Returns HTTP 410 Gone
     */
    public function test_legacy_order_distribute_api_returns_410_gone(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-LEG-2-' . rand(10000, 99999),
            'item' => 'Solar Commercial Plant',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'advance_payment' => 40000.00,
            'balance_due' => 60000.00,
            'customer_name' => $this->user->name,
        ]);

        // Attempt calling legacy admin order distribute endpoint
        $response1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/distribute");

        $response1->assertStatus(410);
        $response1->assertJson([
            'status' => 'error',
            'code' => 'LEGACY_MODULE_DISABLED',
        ]);

        // Attempt calling legacy sales distribute endpoint
        $response2 = $this->postJson("/api/sales/{$order->id}/distribute");
        $response2->assertStatus(410);
        $response2->assertJson([
            'status' => 'error',
            'code' => 'LEGACY_MODULE_DISABLED',
        ]);
    }

    /**
     * Test 3: Order Management 40/40/20 Distribution Workflow Remains 100% Active
     */
    public function test_order_management_distribution_remains_fully_active(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-ACT-1-' . rand(10000, 99999),
            'item' => 'Industrial Solar Generator',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'status' => 'partial',
            'income_distribution_status' => 'pending',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'net_entity_amount' => 17000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        // 1. Preview via active endpoint
        $previewResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/payments/{$payment->id}/income-allocation");
        $previewResponse->assertStatus(200);
        $this->assertEquals(3000.00, (float) $previewResponse->json('allocation.payment_admin_cut'));
        $this->assertEquals(1200.00, (float) $previewResponse->json('allocation.direct_income_amount'));
        $this->assertEquals(1200.00, (float) $previewResponse->json('allocation.level_income_amount'));
        $this->assertEquals(600.00, (float) $previewResponse->json('allocation.reward_income_amount'));

        // 2. Execute allocation via active endpoint
        $allocateResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");
        $allocateResponse->assertStatus(200);

        // 3. Verify payment updated in place
        $payment->refresh();
        $this->assertEquals('completed', $payment->income_distribution_status);
        $this->assertEquals(3000.00, (float) $payment->distributed_admin_cut_amount);
        $this->assertEquals(1200.00, (float) $payment->direct_income_amount);
        $this->assertEquals(1200.00, (float) $payment->level_income_amount);
        $this->assertEquals(600.00, (float) $payment->reward_income_amount);

        // 4. Verify parent order aggregate synchronized
        $order->refresh();
        $this->assertEquals('completed', $order->income_distribution_status);
        $this->assertEquals(3000.00, (float) $order->distributed_admin_cut_amount);
    }

    /**
     * Test 4: Payment Receipts & History Displays Completed Payment and Hides Pending
     */
    public function test_payment_receipts_history_shows_only_completed(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-ACT-2-' . rand(10000, 99999),
            'item' => 'Solar Microgrid System',
            'gross_amount' => 80000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 12000.00,
            'advance_payment' => 40000.00,
            'balance_due' => 40000.00,
            'customer_name' => $this->user->name,
        ]);

        $completedPayment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'direct_income_amount' => 1200.00,
            'level_income_amount' => 1200.00,
            'reward_income_amount' => 600.00,
            'distributed_admin_cut_amount' => 3000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'completed',
        ]);

        $pendingPayment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'payment_type' => 'balance',
            'income_distribution_status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $response->assertStatus(200);

        $returnedIds = collect($response->json('payments'))->pluck('id')->all();

        // Completed MUST appear
        $this->assertContains($completedPayment->id, $returnedIds);

        // Pending MUST NOT appear
        $this->assertNotContains($pendingPayment->id, $returnedIds);
    }
}