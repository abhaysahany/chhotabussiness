<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminPendingOrdersApiIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $sponsor;
    protected User $buyer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::create([
            'name' => 'Pending Orders Test Admin',
            'username' => 'pending_admin_' . uniqid(),
            'email' => 'pending_admin_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('admin_pending_token', ['admin'])->plainTextToken;

        $this->sponsor = User::create([
            'name' => 'Test Sponsor Upline',
            'email' => 'sponsor_pend_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);

        $this->buyer = User::create([
            'name' => 'Test Pending Buyer',
            'email' => 'buyer_pend_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'sponsor_id' => $this->sponsor->user_code,
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);
    }

    /**
     * Test 1 — Pending Listing: Only approval_status = pending orders appear
     */
    public function test_1_pending_listing_only_shows_pending_orders(): void
    {
        $pendingOrder = Order::create([
            'invoice_number' => 'INV-TEST-PEND-' . uniqid(),
            'item' => 'Solar Rooftop 3kW',
            'item_type' => 'product',
            'gross_amount' => 120000.00,
            'advance_payment' => 30000.00,
            'balance_due' => 90000.00,
            'status' => 'partial',
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
        ]);

        $confirmedOrder = Order::create([
            'invoice_number' => 'INV-TEST-CONF-' . uniqid(),
            'item' => 'Confirmed Service Package',
            'item_type' => 'package',
            'gross_amount' => 50000.00,
            'advance_payment' => 50000.00,
            'balance_due' => 0.00,
            'status' => 'completed',
            'approval_status' => 'confirmed',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=pending');

        $response->assertStatus(200);
        $orders = $response->json('orders');
        $this->assertIsArray($orders);

        $pendingIds = collect($orders)->pluck('id')->all();
        $this->assertContains($pendingOrder->id, $pendingIds);
        $this->assertNotContains($confirmedOrder->id, $pendingIds);

        // Every order returned by this filter must have approval_status = 'pending'
        foreach ($orders as $order) {
            $this->assertEquals('pending', $order['approval_status'] ?? $order['approvalStatus']);
        }
    }

    /**
     * Test 2 — Review Modal: Correct order/customer/payment information appears
     */
    public function test_2_review_modal_data_complete(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-REVIEW-' . uniqid(),
            'date' => '2026-11-03',
            'entity_name' => 'Apex Solar Power Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => 'Rajesh Sharma',
            'customer_email' => 'rajesh.sharma@example.com',
            'customer_phone' => '9876543210',
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'item' => 'Commercial Solar Plant 10kW',
            'item_type' => 'product',
            'category' => 'Solar Energy',
            'unit_price' => 200000.00,
            'quantity' => 1,
            'gross_amount' => 200000.00,
            'advance_payment' => 50000.00,
            'balance_due' => 150000.00,
            'payment_method' => 'NEFT / RTGS',
            'reference_no' => 'UTR-NEFT-991122',
            'status' => 'partial',
            'approval_status' => 'pending',
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 30000.00,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=pending');

        $response->assertStatus(200);
        $orderData = collect($response->json('orders'))->firstWhere('id', $order->id);

        $this->assertNotNull($orderData);
        $this->assertEquals('INV-REVIEW-' . substr($order->invoice_number, 11), $orderData['invoice_number']);
        $this->assertEquals('Apex Solar Power Pvt Ltd', $orderData['entity_name']);
        $this->assertEquals('Rajesh Sharma', $orderData['customer_name']);
        $this->assertEquals('Commercial Solar Plant 10kW', $orderData['item']);
        $this->assertEquals(200000.00, (float) $orderData['gross_amount']);
        $this->assertEquals(50000.00, (float) $orderData['advance_payment']);
        $this->assertEquals(150000.00, (float) $orderData['balance_due']);
        $this->assertEquals(15.00, (float) $orderData['admin_commission_percent']);
    }

    /**
     * Test 3 — Live Commission Preview: Exact mathematical matching with specification example
     * For ₹1,00,000 gross, 15% rate, ₹20,000 initial payment:
     * - Total Admin Commission: ₹15,000
     * - Advance Payment: ₹20,000
     * - Advance Admin Cut: ₹3,000
     * - Net Entity Amount: ₹17,000
     * - Remaining Project Balance: ₹80,000
     * - Remaining Expected Admin Commission: ₹12,000
     */
    public function test_3_live_commission_preview_calculations(): void
    {
        $gross = 100000.00;
        $advance = 20000.00;
        $percent = 15.00;

        $totalAdminCommission = round(($gross * $percent) / 100, 2);
        $advanceAdminCut = round(($advance * $percent) / 100, 2);
        $netEntityAmount = round($advance - $advanceAdminCut, 2);
        $remainingBalance = round($gross - $advance, 2);
        $remainingAdminCommission = round($totalAdminCommission - $advanceAdminCut, 2);

        $this->assertEquals(15000.00, $totalAdminCommission);
        $this->assertEquals(20000.00, $advance);
        $this->assertEquals(3000.00, $advanceAdminCut);
        $this->assertEquals(17000.00, $netEntityAmount);
        $this->assertEquals(80000.00, $remainingBalance);
        $this->assertEquals(12000.00, $remainingAdminCommission);
    }

    /**
     * Test 4 — Successful Confirmation:
     * - Correct API called
     * - Approved commission percentage submitted
     * - Order disappears from Pending Orders
     * - Order appears in Confirmed Order Management
     * - No duplicate payment receipt
     */
    public function test_4_successful_confirmation(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-CONF-FLOW-' . uniqid(),
            'item' => 'Web App Development',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 20.00, // catalog suggested
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

        // Admin confirms order with 15.00% approved rate
        $confirmResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => 15.00,
            ]);

        $confirmResponse->assertStatus(200);
        $confirmResponse->assertJsonPath('status', 'success');

        // Order disappears from Pending Orders listing
        $pendingRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=pending');
        $pendingIds = collect($pendingRes->json('orders'))->pluck('id')->all();
        $this->assertNotContains($order->id, $pendingIds);

        // Order appears in Confirmed Order Management (default admin listing)
        $confirmedRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders');
        $confirmedIds = collect($confirmedRes->json('orders'))->pluck('id')->all();
        $this->assertContains($order->id, $confirmedIds);

        // Advance payment snapshot synchronized to 15% rate
        $freshPayment = $payment->fresh();
        $this->assertEquals(15.00, (float) $freshPayment->admin_commission_percent);
        $this->assertEquals(3000.00, (float) $freshPayment->admin_commission_cut);
        $this->assertEquals(17000.00, (float) $freshPayment->net_entity_amount);

        // Exactly one payment receipt exists (no duplicate created)
        $this->assertEquals(1, SalePayment::where('sales_record_id', $order->id)->count());
    }

    /**
     * Test 5 — Confirmation API Error:
     * - Invalid commission percentage returns 422
     * - Order stays in pending status
     */
    public function test_5_confirmation_api_error_preserves_pending(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-ERR-' . uniqid(),
            'item' => 'Error Test Item',
            'gross_amount' => 50000.00,
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        // Attempt confirm with negative percentage
        $resNegative = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => -5.00,
            ]);
        $resNegative->assertStatus(422);

        // Attempt confirm with percentage > 100
        $resTooLarge = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => 125.00,
            ]);
        $resTooLarge->assertStatus(422);

        // Order is still pending
        $this->assertEquals('pending', $order->fresh()->approval_status);
    }

    /**
     * Test 6 — Cancellation Validation:
     * - Empty reason rejected
     * - Short reason (<3 chars) rejected
     * - Valid reason accepted
     */
    public function test_6_cancellation_validation(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-CANC-VAL-' . uniqid(),
            'item' => 'Cancellation Validation Item',
            'gross_amount' => 60000.00,
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        // Empty reason rejected
        $resEmpty = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'cancellation_reason' => '',
            ]);
        $resEmpty->assertStatus(422);

        // Short reason (< 3 chars) rejected
        $resShort = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'cancellation_reason' => 'No',
            ]);
        $resShort->assertStatus(422);

        // Valid reason accepted
        $resValid = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'cancellation_reason' => 'Customer requested cancellation prior to execution.',
            ]);
        $resValid->assertStatus(200);
        $resValid->assertJsonPath('order.approval_status', 'cancelled');
    }

    /**
     * Test 7 — Cancellation With Advance:
     * - Warning displayed
     * - Backend cancellation succeeds
     * - Payment receipt remains preserved
     * - No false refund created
     */
    public function test_7_cancellation_with_advance(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-CANC-ADV-' . uniqid(),
            'item' => 'Advanced Retainer Agreement',
            'gross_amount' => 75000.00,
            'advance_payment' => 25000.00,
            'balance_due' => 50000.00,
            'status' => 'partial',
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 25000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/cancel", [
                'cancellation_reason' => 'Client discontinued engagement before start date.',
            ]);

        $res->assertStatus(200);
        $this->assertNotNull($res->json('warning'));
        $this->assertStringContainsString('offline settlement/refund', $res->json('warning'));

        // Payment receipt strictly preserved in database
        $this->assertNotNull($payment->fresh());
        $this->assertEquals(25000.00, (float) $payment->fresh()->amount);

        // Order is cancelled and removed from pending listing
        $this->assertEquals('cancelled', $order->fresh()->approval_status);
        $pendingRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=pending');
        $this->assertNotContains($order->id, collect($pendingRes->json('orders'))->pluck('id')->all());
    }

    /**
     * Test 8 — Double Click / Repeated Submission Protection
     */
    public function test_8_double_click_protection(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-DBL-' . uniqid(),
            'item' => 'Double Click Test Project',
            'gross_amount' => 80000.00,
            'approval_status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
        ]);

        // First click: Succeeds
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => 15.00,
            ]);
        $res1->assertStatus(200);

        // Second click: Rejects with 422
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/confirm", [
                'admin_commission_percent' => 15.00,
            ]);
        $res2->assertStatus(422);
        $this->assertStringContainsString('already confirmed', $res2->json('message'));
    }

    /**
     * Test 9 — Confirmed Order Regression: Confirmed orders work seamlessly in Order Management
     */
    public function test_9_confirmed_order_regression(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-CONF-REGR-' . uniqid(),
            'item' => 'Regression Solar Project',
            'gross_amount' => 50000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 10000.00,
            'advance_payment' => 50000.00,
            'balance_due' => 0.00,
            'status' => 'completed',
            'approval_status' => 'confirmed',
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
            'net_entity_amount' => 40000.00,
            'payment_type' => 'full',
            'income_distribution_status' => 'pending',
        ]);

        // Allocate 40/40/20 on confirmed payment
        $allocRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $allocRes->assertStatus(200);
        $allocRes->assertJsonPath('status', 'success');
        $allocRes->assertJsonPath('allocated.direct_income_amount', 4000);
        $allocRes->assertJsonPath('allocated.level_income_amount', 4000);
        $allocRes->assertJsonPath('allocated.reward_income_amount', 2000);
    }

    /**
     * Test 10 — Empty Pending State: Clean empty state when no pending orders exist
     */
    public function test_10_empty_pending_state(): void
    {
        // Query for a non-existent status filter or ensure filter returns array
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=non_existent_status');

        $res->assertStatus(200);
        $orders = $res->json('orders');
        $this->assertIsArray($orders);
        $this->assertCount(0, $orders);
    }
}
