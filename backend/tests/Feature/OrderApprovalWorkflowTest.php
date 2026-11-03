<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class OrderApprovalWorkflowTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $sponsor;
    protected User $buyer;

    protected function setUp(): void
    {
        parent::setUp();

        // Isolated Admin for approval testing
        $this->admin = Admin::create([
            'name' => 'Approval Test Admin',
            'username' => 'appr_admin_' . uniqid(),
            'email' => 'appr_admin_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('admin_approval_token', ['admin'])->plainTextToken;

        // Upline sponsor
        $this->sponsor = User::create([
            'name' => 'Approval Test Sponsor',
            'email' => 'sponsor_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);

        // Buyer sponsored by upline
        $this->buyer = User::create([
            'name' => 'Approval Test Buyer',
            'email' => 'buyer_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'sponsor_id' => $this->sponsor->user_code,
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);
    }

    /**
     * Test 1 — New Order Is Pending
     */
    public function test_1_new_order_is_pending(): void
    {
        $payload = [
            'item' => 'Solar Power System 5kW',
            'item_type' => 'product',
            'customer_user_code' => $this->buyer->user_code,
            'customer_name' => $this->buyer->name,
            'sponsor' => $this->sponsor->user_code,
            'unit_price' => 100000.00,
            'quantity' => 1,
            'gross_amount' => 100000.00,
            'advance_payment' => 20000.00,
            'admin_commission_percent' => 20.00,
            'payment_method' => 'UPI / QR Code',
            'reference_no' => 'UTR-' . rand(100000, 999999),
        ];

        $response = $this->postJson('/api/orders', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('order.approval_status', 'pending');
        $response->assertJsonPath('order.status', 'partial'); // payment settlement remains partial

        $orderId = $response->json('order.id');
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'approval_status' => 'pending',
            'status' => 'partial',
            'gross_amount' => 100000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
        ]);
    }

    /**
     * Test 2 — Historical Orders Stay Confirmed
     */
    public function test_2_historical_orders_stay_confirmed(): void
    {
        $historical = Order::create([
            'invoice_number' => 'INV-HIST-' . uniqid(),
            'item' => 'Historical Order',
            'gross_amount' => 75000.00,
            'advance_payment' => 75000.00,
            'balance_due' => 0.00,
            'status' => 'completed',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        $this->assertEquals('confirmed', $historical->approval_status);
        $this->assertDatabaseHas('orders', [
            'id' => $historical->id,
            'approval_status' => 'confirmed',
        ]);
    }

    /**
     * Test 3 — Initial Advance Payment Is Preserved without premature PV credit
     */
    public function test_3_initial_advance_payment_is_preserved_no_pv_credit(): void
    {
        $initialBuyerPv = (int) $this->buyer->fresh()->personal_pv;
        $initialSponsorPv = (int) $this->sponsor->fresh()->group_pv;

        $payload = [
            'item' => 'Website Development Package',
            'item_type' => 'service',
            'customer_user_code' => $this->buyer->user_code,
            'customer_name' => $this->buyer->name,
            'sponsor' => $this->sponsor->user_code,
            'unit_price' => 50000.00,
            'quantity' => 1,
            'gross_amount' => 50000.00,
            'advance_payment' => 15000.00,
            'admin_commission_percent' => 20.00,
            'payment_method' => 'Bank Transfer',
            'reference_no' => 'UTR-ADV-7890',
        ];

        $response = $this->postJson('/api/orders', $payload);
        $response->assertStatus(201);
        $orderId = $response->json('order.id');

        // Check payment record exists and is preserved
        $payment = SalePayment::where('sales_record_id', $orderId)->first();
        $this->assertNotNull($payment);
        $this->assertEquals(15000.00, (float) $payment->amount);
        $this->assertEquals('UTR-ADV-7890', $payment->reference_no);
        $this->assertEquals('pending', $payment->income_distribution_status);

        // Check that NO PV was credited prior to confirmation
        $this->assertEquals($initialBuyerPv, (int) $this->buyer->fresh()->personal_pv);
        $this->assertEquals($initialSponsorPv, (int) $this->sponsor->fresh()->group_pv);
    }

    /**
     * Test 4 — Confirmation Changes Admin Commission
     */
    public function test_4_confirmation_changes_admin_commission(): void
    {
        // 1. Create pending order with 20% provisional catalog commission
        $order = Order::create([
            'invoice_number' => 'INV-CONFIRM-' . uniqid(),
            'item' => 'Enterprise Consulting',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 20000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'status' => 'partial',
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 4000.00,
            'net_entity_amount' => 16000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        // 2. Admin confirms with 15% approved commission
        $confirmResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => 15.00,
            ]);

        $confirmResponse->assertStatus(200);
        $confirmResponse->assertJsonPath('order.approval_status', 'confirmed');
        $confirmResponse->assertJsonPath('order.admin_commission_percent', 15);
        $confirmResponse->assertJsonPath('order.admin_commission_cut', 15000);

        // 3. Verify order and payment snapshot in database
        $freshOrder = $order->fresh();
        $this->assertEquals('confirmed', $freshOrder->approval_status);
        $this->assertEquals(15.00, (float) $freshOrder->admin_commission_percent);
        $this->assertEquals(15000.00, (float) $freshOrder->admin_commission_cut);
        $this->assertEquals($this->admin->id, $freshOrder->admin_confirmed_by);
        $this->assertNotNull($freshOrder->admin_confirmed_at);

        // Payment receipt updated with 15% rate (Admin cut ₹3,000, Net Entity ₹17,000)
        $freshPayment = $payment->fresh();
        $this->assertEquals(15.00, (float) $freshPayment->admin_commission_percent);
        $this->assertEquals(3000.00, (float) $freshPayment->admin_commission_cut);
        $this->assertEquals(17000.00, (float) $freshPayment->net_entity_amount);

        // No duplicate payment receipt created
        $this->assertEquals(1, SalePayment::where('sales_record_id', $order->id)->count());
    }

    /**
     * Test 5 — PV Credited Only Once
     */
    public function test_5_pv_credited_only_once(): void
    {
        $initialBuyerPv = (int) $this->buyer->fresh()->personal_pv;
        $initialSponsorPv = (int) $this->sponsor->fresh()->group_pv;

        $order = Order::create([
            'invoice_number' => 'INV-PV-' . uniqid(),
            'item' => 'PV Test Item',
            'gross_amount' => 50000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 30000.00,
            'status' => 'partial',
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
        ]);

        SalePayment::create([
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

        // Confirmation 1: Success, PV is credited
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => 15.00,
            ]);
        $res1->assertStatus(200);

        $this->assertEquals($initialBuyerPv + 20000, (int) $this->buyer->fresh()->personal_pv);
        $this->assertEquals($initialSponsorPv + 20000, (int) $this->sponsor->fresh()->group_pv);

        // Confirmation 2: Repeated confirmation is rejected, no duplicate PV
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => 15.00,
            ]);
        $res2->assertStatus(422);
        $res2->assertJsonPath('status', 'error');

        // PV remains exactly the same as after Confirmation 1
        $this->assertEquals($initialBuyerPv + 20000, (int) $this->buyer->fresh()->personal_pv);
        $this->assertEquals($initialSponsorPv + 20000, (int) $this->sponsor->fresh()->group_pv);
    }

    /**
     * Test 6 — Cancellation With Advance
     */
    public function test_6_cancellation_with_advance(): void
    {
        $initialBuyerPv = (int) $this->buyer->fresh()->personal_pv;

        $order = Order::create([
            'invoice_number' => 'INV-CANCEL-' . uniqid(),
            'item' => 'Cancelled Custom Software',
            'gross_amount' => 60000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 40000.00,
            'status' => 'partial',
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        $cancelRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'cancellation_reason' => 'Client withdrew requirement before work started.',
            ]);

        $cancelRes->assertStatus(200);
        $cancelRes->assertJsonPath('order.approval_status', 'cancelled');
        $this->assertStringContainsString('offline settlement/refund', $cancelRes->json('warning'));

        $fresh = $order->fresh();
        $this->assertEquals('cancelled', $fresh->approval_status);
        $this->assertEquals($this->admin->id, $fresh->admin_cancelled_by);
        $this->assertNotNull($fresh->admin_cancelled_at);
        $this->assertEquals('Client withdrew requirement before work started.', $fresh->cancellation_reason);

        // Payment record is NOT silently deleted
        $this->assertNotNull($payment->fresh());
        // No PV was credited
        $this->assertEquals($initialBuyerPv, (int) $this->buyer->fresh()->personal_pv);
    }

    /**
     * Test 7 — Pending Order Cannot Collect Balance
     */
    public function test_7_pending_order_cannot_collect_balance(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-BAL-PEND-' . uniqid(),
            'item' => 'Pending Project',
            'gross_amount' => 80000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 60000.00,
            'status' => 'partial',
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        $res = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 10000.00,
            'payment_method' => 'UPI',
        ]);

        $res->assertStatus(422);
        $res->assertJsonPath('status', 'error');
        $this->assertStringContainsString('unconfirmed order', $res->json('message'));

        // Balance due is unchanged
        $this->assertEquals(60000.00, (float) $order->fresh()->balance_due);
        $this->assertEquals(0, SalePayment::where('sales_record_id', $order->id)->where('payment_type', 'balance')->count());
    }

    /**
     * Test 8 — Confirmed Order Can Collect Balance
     */
    public function test_8_confirmed_order_can_collect_balance(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-BAL-CONF-' . uniqid(),
            'item' => 'Confirmed Project',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'advance_payment' => 30000.00,
            'balance_due' => 70000.00,
            'status' => 'partial',
            'approval_status' => 'confirmed',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
        ]);

        $res = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 20000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-BAL-555',
        ]);

        $res->assertStatus(200);
        $res->assertJsonPath('status', 'success');

        $fresh = $order->fresh();
        $this->assertEquals(50000.00, (float) $fresh->advance_payment);
        $this->assertEquals(50000.00, (float) $fresh->balance_due);

        // Separate payment record created with 15% rate
        $balancePayment = SalePayment::where('sales_record_id', $order->id)->where('payment_type', 'balance')->first();
        $this->assertNotNull($balancePayment);
        $this->assertEquals(20000.00, (float) $balancePayment->amount);
        $this->assertEquals(15.00, (float) $balancePayment->admin_commission_percent);
        $this->assertEquals(3000.00, (float) $balancePayment->admin_commission_cut);
    }

    /**
     * Test 9 — Distribution Is Blocked Before Confirmation
     */
    public function test_9_distribution_is_blocked_before_confirmation(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-DIST-BLOCK-' . uniqid(),
            'item' => 'Distribution Block Test Item',
            'gross_amount' => 40000.00,
            'admin_commission_cut' => 6000.00,
            'advance_payment' => 40000.00,
            'balance_due' => 0.00,
            'status' => 'completed',
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 40000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 6000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        // Preview fails with 422
        $previewRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson("/api/admin/payments/{$payment->id}/income-allocation");
        $previewRes->assertStatus(422);

        // Execution fails with 422
        $execRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");
        $execRes->assertStatus(422);

        // No allocation values changed
        $this->assertEquals('pending', $payment->fresh()->income_distribution_status);
        $this->assertEquals(0.00, (float) $payment->fresh()->distributed_admin_cut_amount);
    }

    /**
     * Test 10 — Distribution Works After Confirmation
     */
    public function test_10_distribution_works_after_confirmation(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-DIST-OK-' . uniqid(),
            'item' => 'Distribution OK Test Item',
            'gross_amount' => 50000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 10000.00,
            'advance_payment' => 50000.00,
            'balance_due' => 0.00,
            'status' => 'completed',
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 50000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 10000.00,
            'payment_type' => 'full',
            'income_distribution_status' => 'pending',
        ]);

        // 1. Confirm order
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => 20.00,
            ])
            ->assertStatus(200);

        // 2. Allocate payment
        $allocRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $allocRes->assertStatus(200);
        $allocRes->assertJsonPath('status', 'success');
        $allocRes->assertJsonPath('allocated.direct_income_amount', 4000); // 40% of 10,000
        $allocRes->assertJsonPath('allocated.level_income_amount', 4000);  // 40% of 10,000
        $allocRes->assertJsonPath('allocated.reward_income_amount', 2000); // 20% of 10,000

        $freshPayment = $payment->fresh();
        $this->assertEquals('completed', $freshPayment->income_distribution_status);
        $this->assertEquals(10000.00, (float) $freshPayment->distributed_admin_cut_amount);
    }

    /**
     * Test 11 — Cancelled Order Cannot Be Distributed
     */
    public function test_11_cancelled_order_cannot_be_distributed(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-DIST-CANC-' . uniqid(),
            'item' => 'Cancelled Test Item',
            'gross_amount' => 40000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 20000.00,
            'status' => 'partial',
            'approval_status' => 'cancelled',
            'cancellation_reason' => 'Cancelled test',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_cut' => 3000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $res->assertStatus(422);
    }

    /**
     * Test 12 — Admin Authentication
     */
    public function test_12_admin_authentication(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-AUTH-' . uniqid(),
            'item' => 'Auth Test Item',
            'gross_amount' => 50000.00,
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        // 1. Unauthenticated request rejected
        $this->postJson("/api/admin/orders/{$order->id}/confirm", ['admin_commission_percent' => 15.00])
            ->assertStatus(401);

        $this->postJson("/api/admin/orders/{$order->id}/cancel", ['cancellation_reason' => 'Reason'])
            ->assertStatus(401);

        // 2. Regular user (buyer) token rejected
        $userToken = $this->buyer->createToken('user_token')->plainTextToken;
        $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", ['admin_commission_percent' => 15.00])
            ->assertStatus(401);

        $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->postJson("/api/admin/orders/{$order->id}/cancel", ['cancellation_reason' => 'Reason'])
            ->assertStatus(401);

        // 3. Admin token succeeds
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", ['admin_commission_percent' => 15.00])
            ->assertStatus(200);
    }

    /**
     * Test 13 — Order Listing Status Filters
     */
    public function test_13_order_listing_status_filters(): void
    {
        $pendingOrder = Order::create([
            'invoice_number' => 'INV-LIST-PEND-' . uniqid(),
            'item' => 'Pending Filter Item',
            'gross_amount' => 10000.00,
            'approval_status' => 'pending',
            'customer_name' => 'Pending Client',
            'customer_user_code' => $this->buyer->user_code,
        ]);

        $confirmedOrder = Order::create([
            'invoice_number' => 'INV-LIST-CONF-' . uniqid(),
            'item' => 'Confirmed Filter Item',
            'gross_amount' => 20000.00,
            'approval_status' => 'confirmed',
            'customer_name' => 'Confirmed Client',
            'customer_user_code' => $this->buyer->user_code,
        ]);

        $cancelledOrder = Order::create([
            'invoice_number' => 'INV-LIST-CANC-' . uniqid(),
            'item' => 'Cancelled Filter Item',
            'gross_amount' => 30000.00,
            'approval_status' => 'cancelled',
            'cancellation_reason' => 'Cancelled test',
            'customer_name' => 'Cancelled Client',
            'customer_user_code' => $this->buyer->user_code,
        ]);

        // Filter: pending only
        $resPending = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=pending');
        $resPending->assertStatus(200);
        $pendingIds = collect($resPending->json('orders'))->pluck('id')->all();
        $this->assertContains($pendingOrder->id, $pendingIds);
        $this->assertNotContains($confirmedOrder->id, $pendingIds);
        $this->assertNotContains($cancelledOrder->id, $pendingIds);

        // Filter: confirmed only
        $resConfirmed = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=confirmed');
        $resConfirmed->assertStatus(200);
        $confirmedIds = collect($resConfirmed->json('orders'))->pluck('id')->all();
        $this->assertContains($confirmedOrder->id, $confirmedIds);
        $this->assertNotContains($pendingOrder->id, $confirmedIds);
        $this->assertNotContains($cancelledOrder->id, $confirmedIds);

        // Filter: cancelled only
        $resCancelled = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=cancelled');
        $resCancelled->assertStatus(200);
        $cancelledIds = collect($resCancelled->json('orders'))->pluck('id')->all();
        $this->assertContains($cancelledOrder->id, $cancelledIds);
        $this->assertNotContains($pendingOrder->id, $cancelledIds);
        $this->assertNotContains($confirmedOrder->id, $cancelledIds);

        // Default Admin listing (no filter) defaults to confirmed only (protecting existing UI)
        $resDefault = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders');
        $resDefault->assertStatus(200);
        $defaultIds = collect($resDefault->json('orders'))->pluck('id')->all();
        $this->assertContains($confirmedOrder->id, $defaultIds);
        $this->assertNotContains($pendingOrder->id, $defaultIds);
        $this->assertNotContains($cancelledOrder->id, $defaultIds);
    }
}
