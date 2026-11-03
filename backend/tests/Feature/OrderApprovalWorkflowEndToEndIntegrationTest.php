<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class OrderApprovalWorkflowEndToEndIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $sponsor;
    protected User $buyer;
    protected BusinessEntity $entityA;
    protected BusinessEntity $entityB;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Authenticated Admin for approval and distribution workflows
        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Super Administrator',
            'username' => 'superadmin_' . uniqid(),
            'email' => 'admin_e2e_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('admin_e2e_token', ['admin'])->plainTextToken;

        // 2. Sponsor (Upline)
        $this->sponsor = User::create([
            'name' => 'E2E Test Sponsor',
            'email' => 'e2e_sponsor_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);

        // 3. Buyer (Downline)
        $this->buyer = User::create([
            'name' => 'E2E Test Buyer',
            'email' => 'e2e_buyer_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'sponsor_id' => $this->sponsor->user_code,
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);

        // 4. Business Entities for ownership isolation
        $category = EntityCategory::first() ?? EntityCategory::create(['name' => 'Solar Energy', 'slug' => 'solar-energy-' . uniqid()]);

        $this->entityA = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Apex Solar Power Pvt Ltd',
            'owner_name' => 'Apex Director',
            'email' => 'apex_' . uniqid() . '@example.com',
            'phone' => '98' . rand(10000000, 99999999),
            'verification_status' => 'verified',
        ]);

        $this->entityB = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Horizon Infra Engineering',
            'owner_name' => 'Horizon Director',
            'email' => 'horizon_' . uniqid() . '@example.com',
            'phone' => '99' . rand(10000000, 99999999),
            'verification_status' => 'verified',
        ]);
    }

    /**
     * Test Complete End-to-End Workflow: Scenarios A through F
     * Scenario A: Entity Creates Order (₹1,00,000 gross, ₹20,000 advance, 20% provisional)
     * Scenario B: Admin Confirms with 15% Approved Commission (Recalculates advance cut to ₹3,000, credits PV/BV)
     * Scenario C: Confirmed Order Visible in Admin Order Management & Entity Orders
     * Scenario D: Subsequent Balance Payment of ₹20,000 (New receipt created with 15% rate, parent order totals updated)
     * Scenario E: Income Allocation on First Payment (40/40/20 split: Direct ₹1,200, Level ₹1,200, Reward ₹600)
     * Scenario F: Read-Only Payment Receipts & History (Distributed receipt visible, pending hidden, order-level totals)
     */
    public function test_scenarios_a_through_f_complete_happy_path_workflow(): void
    {
        // -------------------------------------------------------------
        // SCENARIO A: Entity Creates a New Order
        // -------------------------------------------------------------
        $createPayload = [
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'entity_type' => 'business',
            'item' => 'Commercial Rooftop Solar 10kW',
            'item_type' => 'product',
            'customer_user_code' => $this->buyer->user_code,
            'customer_name' => $this->buyer->name,
            'sponsor' => $this->sponsor->user_code,
            'unit_price' => 100000.00,
            'quantity' => 1,
            'gross_amount' => 100000.00,
            'advance_payment' => 20000.00,
            'admin_commission_percent' => 20.00, // Provisional catalog rate
            'payment_method' => 'Bank Transfer / NEFT',
            'reference_no' => 'NEFT-E2E-001',
        ];

        $createResponse = $this->postJson('/api/orders', $createPayload);
        $createResponse->assertStatus(201);
        $createResponse->assertJsonPath('status', 'success');

        $orderId = $createResponse->json('order.id');
        $invoiceNumber = $createResponse->json('order.invoice_number') ?? $createResponse->json('order.invoiceNumber');
        $this->assertNotNull($orderId);
        $this->assertNotNull($invoiceNumber);

        // Verify Database: orders
        $order = Order::find($orderId);
        $this->assertNotNull($order);
        $this->assertEquals('pending', $order->approval_status);
        $this->assertEquals(100000.00, (float) $order->gross_amount);
        $this->assertEquals(20000.00, (float) $order->advance_payment);
        $this->assertEquals(80000.00, (float) $order->balance_due);
        $this->assertEquals('partial', $order->status); // Independent payment status

        // Verify Database: sale_payments (Exactly 1 initial payment receipt)
        $payments = SalePayment::where('sales_record_id', $orderId)->get();
        $this->assertCount(1, $payments);
        $initialPayment = $payments->first();
        $this->assertEquals(20000.00, (float) $initialPayment->amount);
        $this->assertEquals('advance', $initialPayment->payment_type);
        $this->assertEquals('pending', $initialPayment->income_distribution_status);
        $this->assertEquals('NEFT-E2E-001', $initialPayment->reference_no);

        // Verify PV/BV: No credits while pending
        $this->buyer->refresh();
        $this->sponsor->refresh();
        $this->assertEquals(0, (float) $this->buyer->personal_pv, 'Buyer personal PV must remain 0 while order is pending');
        $this->assertEquals(0, (float) $this->sponsor->group_pv, 'Sponsor group PV must remain 0 while order is pending');

        // -------------------------------------------------------------
        // SCENARIO B: Admin Reviews and Confirms the Order
        // -------------------------------------------------------------
        // 1. Verify it appears in Admin Pending Orders
        $pendingListResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=pending');
        $pendingListResponse->assertStatus(200);
        $pendingOrders = $pendingListResponse->json('orders') ?? $pendingListResponse->json('data') ?? [];
        $pendingOrderIds = collect($pendingOrders)->pluck('id')->all();
        $this->assertContains($orderId, $pendingOrderIds, 'New order must appear in Admin Pending Orders');

        // 2. Admin confirms order setting approved commission to 15%
        $confirmResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$orderId}/confirm", [
                'admin_commission_percent' => 15.00,
            ]);
        $confirmResponse->assertStatus(200);
        $confirmResponse->assertJsonPath('status', 'success');

        // Verify Database: orders updated
        $order->refresh();
        $this->assertEquals('confirmed', $order->approval_status);
        $this->assertEquals(15.00, (float) $order->admin_commission_percent);
        $this->assertEquals(15000.00, (float) $order->admin_commission_cut);
        $this->assertEquals($this->admin->id, $order->admin_confirmed_by);
        $this->assertNotNull($order->admin_confirmed_at);

        // Verify Database: initial payment receipt updated with 15% rate
        $initialPayment->refresh();
        $this->assertEquals(15.00, (float) $initialPayment->admin_commission_percent);
        $this->assertEquals(3000.00, (float) $initialPayment->admin_commission_cut); // 20000 * 15% = 3000
        $this->assertEquals(17000.00, (float) $initialPayment->net_entity_amount);   // 20000 - 3000 = 17000
        $this->assertEquals(1, SalePayment::where('sales_record_id', $orderId)->count(), 'No duplicate receipt created');

        // Verify PV/BV credited once on confirmation
        $this->buyer->refresh();
        $this->sponsor->refresh();
        $this->assertGreaterThan(0, (float) $this->buyer->personal_pv, 'Buyer personal PV must be credited on confirmation');

        // -------------------------------------------------------------
        // SCENARIO C: Confirmed Order Appears Everywhere Correctly
        // -------------------------------------------------------------
        // 1. Disappears from Admin Pending Orders
        $pendingListResponse2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=pending');
        $pendingListResponse2->assertStatus(200);
        $pendingOrders2 = $pendingListResponse2->json('orders') ?? $pendingListResponse2->json('data') ?? [];
        $pendingOrderIds2 = collect($pendingOrders2)->pluck('id')->all();
        $this->assertNotContains($orderId, $pendingOrderIds2, 'Confirmed order must disappear from Pending Orders');

        // 2. Appears in Admin Confirmed Order Management
        $confirmedOrdersResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders');
        $confirmedOrdersResponse->assertStatus(200);
        $confirmedList = $confirmedOrdersResponse->json('orders') ?? $confirmedOrdersResponse->json('data') ?? [];
        $confirmedOrderIds = collect($confirmedList)->pluck('id')->all();
        $this->assertContains($orderId, $confirmedOrderIds, 'Confirmed order must appear in Admin Order Management');

        // 3. Entity My Orders shows confirmed status
        $entityOrdersResponse = $this->getJson("/api/orders?entity=" . urlencode($this->entityA->name));
        $entityOrdersResponse->assertStatus(200);
        $entityOrderList = $entityOrdersResponse->json('data') ?? $entityOrdersResponse->json('orders') ?? $entityOrdersResponse->json();
        $foundOrder = collect($entityOrderList)->firstWhere('id', $orderId);
        $this->assertNotNull($foundOrder);
        $this->assertEquals('confirmed', $foundOrder['approval_status'] ?? $foundOrder['approvalStatus'] ?? null);

        // -------------------------------------------------------------
        // SCENARIO D: Subsequent Balance Payment (₹20,000 installment)
        // -------------------------------------------------------------
        $receiveBalanceResponse = $this->postJson("/api/orders/{$orderId}/receive-balance", [
            'amount' => 20000.00,
            'payment_method' => 'Cheque / DD',
            'reference_no' => 'CHQ-E2E-002',
            'notes' => 'Second installment milestone',
        ]);
        $receiveBalanceResponse->assertStatus(200);
        $receiveBalanceResponse->assertJsonPath('status', 'success');

        // Verify Database: sale_payments now has 2 distinct receipts
        $allPayments = SalePayment::where('sales_record_id', $orderId)->orderBy('id', 'asc')->get();
        $this->assertCount(2, $allPayments);

        $secondPayment = $allPayments->last();
        $this->assertEquals(20000.00, (float) $secondPayment->amount);
        $this->assertEquals(15.00, (float) $secondPayment->admin_commission_percent);
        $this->assertEquals(3000.00, (float) $secondPayment->admin_commission_cut);
        $this->assertEquals(17000.00, (float) $secondPayment->net_entity_amount);
        $this->assertEquals('balance', $secondPayment->payment_type);
        $this->assertEquals('pending', $secondPayment->income_distribution_status);

        // Verify parent order totals updated
        $order->refresh();
        $this->assertEquals(100000.00, (float) $order->gross_amount);
        $this->assertEquals(40000.00, (float) $order->advance_payment); // 20k + 20k
        $this->assertEquals(60000.00, (float) $order->balance_due);     // 100k - 40k
        $this->assertEquals(15000.00, (float) $order->admin_commission_cut); // Total expected = 15k

        // First payment receipt must remain intact
        $initialPayment->refresh();
        $this->assertEquals(20000.00, (float) $initialPayment->amount);
        $this->assertEquals(3000.00, (float) $initialPayment->admin_commission_cut);
        $this->assertEquals('pending', $initialPayment->income_distribution_status);

        // -------------------------------------------------------------
        // SCENARIO E: Pending and Confirmed Payment Distribution
        // -------------------------------------------------------------
        // Distribute the first payment receipt (Admin Cut = ₹3,000)
        // Expected: 40% Direct = ₹1,200; 40% Level = ₹1,200; 20% Reward = ₹600
        $distributeResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$initialPayment->id}/income-allocation");
        $distributeResponse->assertStatus(200);
        $distributeResponse->assertJsonPath('status', 'success');

        // Verify first payment receipt updated in database
        $initialPayment->refresh();
        $this->assertEquals('completed', $initialPayment->income_distribution_status);
        $this->assertEquals(3000.00, (float) $initialPayment->distributed_admin_cut_amount);
        $this->assertEquals(1200.00, (float) $initialPayment->direct_income_amount);
        $this->assertEquals(1200.00, (float) $initialPayment->level_income_amount);
        $this->assertEquals(600.00, (float) $initialPayment->reward_income_amount);

        // Verify second payment receipt remains strictly pending
        $secondPayment->refresh();
        $this->assertEquals('pending', $secondPayment->income_distribution_status);
        $this->assertEquals(0.00, (float) $secondPayment->distributed_admin_cut_amount);

        // Verify protection against duplicate distribution
        $dupDistributeResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$initialPayment->id}/income-allocation");
        $dupDistributeResponse->assertStatus(422);

        // -------------------------------------------------------------
        // SCENARIO F: Payment Receipts & History (Read-Only)
        // -------------------------------------------------------------
        $historyResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $historyResponse->assertStatus(200);

        $historyPayments = collect($historyResponse->json('payments'));
        $historyIds = $historyPayments->pluck('id')->all();

        // Distributed payment MUST appear
        $this->assertContains($initialPayment->id, $historyIds);
        $foundHistoryPayment = $historyPayments->firstWhere('id', $initialPayment->id);
        $this->assertEquals(20000.00, (float) $foundHistoryPayment['amount']);
        $this->assertEquals(3000.00, (float) $foundHistoryPayment['admin_commission_cut']);
        $this->assertEquals(1200.00, (float) $foundHistoryPayment['direct_income_amount']);
        $this->assertEquals(1200.00, (float) $foundHistoryPayment['level_income_amount']);
        $this->assertEquals(600.00, (float) $foundHistoryPayment['reward_income_amount']);

        // Order-level accounting columns
        $this->assertEquals(100000.00, (float) $foundHistoryPayment['total_project_cost']);
        $this->assertEquals(15000.00, (float) $foundHistoryPayment['total_admin_amount']);

        // Undistributed second payment MUST NOT appear
        $this->assertNotContains($secondPayment->id, $historyIds, 'Pending payment must not appear in history');
    }

    /**
     * Scenario G: Admin Cancels a Pending Order
     */
    public function test_scenario_g_admin_cancels_pending_order(): void
    {
        // 1. Create order with ₹50,000 project amount and ₹5,000 advance
        $createResponse = $this->postJson('/api/orders', [
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'entity_type' => 'business',
            'item' => 'Solar Water Heater 200L',
            'item_type' => 'product',
            'customer_user_code' => $this->buyer->user_code,
            'customer_name' => $this->buyer->name,
            'sponsor' => $this->sponsor->user_code,
            'unit_price' => 50000.00,
            'quantity' => 1,
            'gross_amount' => 50000.00,
            'advance_payment' => 5000.00,
            'admin_commission_percent' => 20.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UPI-CANC-001',
        ]);
        $createResponse->assertStatus(201);
        $orderId = $createResponse->json('order.id');

        // 2. Admin cancels order with mandatory reason
        $cancelReason = 'Client site inspection failed — structural safety issues';
        $cancelResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$orderId}/cancel", [
                'cancellation_reason' => $cancelReason,
            ]);
        $cancelResponse->assertStatus(200);
        $cancelResponse->assertJsonPath('status', 'success');

        // 3. Verify Database: orders updated to cancelled
        $order = Order::find($orderId);
        $this->assertEquals('cancelled', $order->approval_status);
        $this->assertEquals('partial', $order->status); // Payment status remains partial
        $this->assertEquals($cancelReason, $order->cancellation_reason);
        $this->assertEquals($this->admin->id, $order->admin_cancelled_by);
        $this->assertNotNull($order->admin_cancelled_at);

        // 4. Verify Advance payment receipt preserved without automatic refund
        $payment = SalePayment::where('sales_record_id', $orderId)->first();
        $this->assertNotNull($payment);
        $this->assertEquals(5000.00, (float) $payment->amount);
        $this->assertEquals('pending', $payment->income_distribution_status);

        // 5. Verify order disappears from Admin Pending and does NOT appear in Confirmed
        $pendingListResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders?approval_status=pending');
        $pendingList = $pendingListResponse->json('orders') ?? $pendingListResponse->json('data') ?? [];
        $this->assertNotContains($orderId, collect($pendingList)->pluck('id')->all());

        $confirmedListResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders');
        $confirmedList = $confirmedListResponse->json('orders') ?? $confirmedListResponse->json('data') ?? [];
        $this->assertNotContains($orderId, collect($confirmedList)->pluck('id')->all());

        // 6. Entity can query this in Cancelled Orders
        $cancelledResponse = $this->getJson("/api/orders?entity_id={$this->entityA->id}&approval_status=cancelled");
        $cancelledResponse->assertStatus(200);
        $cancelledData = $cancelledResponse->json('data') ?? $cancelledResponse->json('orders') ?? $cancelledResponse->json();
        $this->assertContains($orderId, collect($cancelledData)->pluck('id')->all());
    }

    /**
     * Scenario H: Payment and Approval Guardrails (Negative Tests)
     */
    public function test_scenario_h_payment_and_approval_guardrails(): void
    {
        // 1. Pending Order setup
        $pendingOrder = Order::create([
            'invoice_number' => 'INV-GUARD-PEND-' . uniqid(),
            'item' => 'Guardrail Project',
            'gross_amount' => 60000.00,
            'advance_payment' => 10000.00,
            'balance_due' => 50000.00,
            'admin_commission_percent' => 20.00,
            'approval_status' => 'pending',
            'status' => 'partial',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
        ]);

        $pendingPayment = SalePayment::create([
            'sales_record_id' => $pendingOrder->id,
            'invoice_number' => $pendingOrder->invoice_number,
            'customer_name' => $this->buyer->name,
            'amount' => 10000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 2000.00,
            'net_entity_amount' => 8000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        // Guardrail 1: Pending order balance payment BLOCKED
        $res1 = $this->postJson("/api/orders/{$pendingOrder->id}/receive-balance", ['amount' => 5000.00]);
        $res1->assertStatus(422);
        $this->assertStringContainsString('Cannot collect balance payment for an unconfirmed order', $res1->json('message'));

        // Guardrail 2: Pending order allocation execution BLOCKED
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$pendingPayment->id}/income-allocation");
        $res2->assertStatus(422);
        $this->assertStringContainsString('not confirmed', $res2->json('message'));

        // 2. Cancelled Order setup
        $cancelledOrder = Order::create([
            'invoice_number' => 'INV-GUARD-CANC-' . uniqid(),
            'item' => 'Cancelled Guardrail Project',
            'gross_amount' => 40000.00,
            'advance_payment' => 5000.00,
            'balance_due' => 35000.00,
            'approval_status' => 'cancelled',
            'status' => 'cancelled',
            'cancellation_reason' => 'Test reason',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
        ]);

        $cancelledPayment = SalePayment::create([
            'sales_record_id' => $cancelledOrder->id,
            'invoice_number' => $cancelledOrder->invoice_number,
            'customer_name' => $this->buyer->name,
            'amount' => 5000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 1000.00,
            'net_entity_amount' => 4000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        // Guardrail 3: Cancelled order balance payment BLOCKED
        $res3 = $this->postJson("/api/orders/{$cancelledOrder->id}/receive-balance", ['amount' => 5000.00]);
        $res3->assertStatus(422);

        // Guardrail 4: Cancelled order allocation execution BLOCKED
        $res4 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$cancelledPayment->id}/income-allocation");
        $res4->assertStatus(422);

        // Guardrail 5: Repeated confirmation on already confirmed order REJECTED
        $confirmedOrder = Order::create([
            'invoice_number' => 'INV-GUARD-CONF-' . uniqid(),
            'item' => 'Confirmed Project',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'gross_amount' => 30000.00,
            'approval_status' => 'confirmed',
            'status' => 'completed',
        ]);
        $res5 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$confirmedOrder->id}/confirm", ['admin_commission_percent' => 15.00]);
        $res5->assertStatus(422);
        $this->assertStringContainsString('already confirmed', $res5->json('message'));

        // Guardrail 6: Repeated cancellation on already cancelled order REJECTED
        $res6 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$cancelledOrder->id}/cancel", ['cancellation_reason' => 'Duplicate reason']);
        $res6->assertStatus(422);
        $this->assertStringContainsString('already cancelled', $res6->json('message'));

        // Guardrail 7: Cancellation requires mandatory reason
        $res7 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$pendingOrder->id}/cancel", ['cancellation_reason' => '']);
        $res7->assertStatus(422);

        // Guardrail 8: Unauthorized / Unauthenticated confirmation REJECTED
        $this->flushHeaders();
        $res8 = $this->postJson("/api/admin/orders/{$pendingOrder->id}/confirm", ['admin_commission_percent' => 15.00]);
        $res8->assertStatus(401);
    }

    /**
     * Scenario I: Historical Orders Preservation
     */
    public function test_scenario_i_historical_orders_compatibility(): void
    {
        // Create an order simulating historical migration (pre-Phase 2)
        $historicalOrder = Order::create([
            'invoice_number' => 'INV-HIST-COMPAT-' . uniqid(),
            'item' => 'Legacy Commercial Solar Unit',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'gross_amount' => 75000.00,
            'advance_payment' => 75000.00,
            'balance_due' => 0.00,
            'admin_commission_percent' => 25.00,
            'admin_commission_cut' => 18750.00,
            'net_entity_payout' => 56250.00,
            'status' => 'completed',
            'approval_status' => 'confirmed',
            'income_distribution_status' => 'completed',
        ]);

        $historicalPayment = SalePayment::create([
            'sales_record_id' => $historicalOrder->id,
            'invoice_number' => $historicalOrder->invoice_number,
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'amount' => 75000.00,
            'admin_commission_percent' => 25.00,
            'admin_commission_cut' => 18750.00,
            'distributed_admin_cut_amount' => 18750.00,
            'direct_income_amount' => 7500.00,
            'level_income_amount' => 7500.00,
            'reward_income_amount' => 3750.00,
            'income_distribution_status' => 'completed',
            'payment_type' => 'advance',
        ]);

        // Historical order must appear in Confirmed Orders
        $confirmedListResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/orders');
        $confirmedListResponse->assertStatus(200);
        $confirmedList = $confirmedListResponse->json('orders') ?? $confirmedListResponse->json('data') ?? [];
        $confirmedIds = collect($confirmedList)->pluck('id')->all();
        $this->assertContains($historicalOrder->id, $confirmedIds);

        // Historical payment must appear in Payment History
        $historyResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $historyResponse->assertStatus(200);
        $historyIds = collect($historyResponse->json('payments'))->pluck('id')->all();
        $this->assertContains($historicalPayment->id, $historyIds);
    }

    /**
     * Scenario J: Entity Ownership Isolation
     */
    public function test_scenario_j_entity_ownership_isolation(): void
    {
        // Entity A order
        $orderA = Order::create([
            'invoice_number' => 'INV-OWN-A-' . uniqid(),
            'item' => 'Entity A Product',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'gross_amount' => 50000.00,
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'approval_status' => 'confirmed',
            'status' => 'completed',
        ]);

        // Entity B order
        $orderB = Order::create([
            'invoice_number' => 'INV-OWN-B-' . uniqid(),
            'item' => 'Entity B Product',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'gross_amount' => 80000.00,
            'entity_id' => $this->entityB->id,
            'entity_name' => $this->entityB->name,
            'approval_status' => 'confirmed',
            'status' => 'completed',
        ]);

        // Query Entity A
        $resA = $this->getJson("/api/orders?entity_id={$this->entityA->id}");
        $resA->assertStatus(200);
        $invoicesA = collect($resA->json('data') ?? $resA->json('orders') ?? $resA->json())->pluck('invoice_number')->all();
        $this->assertContains($orderA->invoice_number, $invoicesA);
        $this->assertNotContains($orderB->invoice_number, $invoicesA);

        // Query Entity B
        $resB = $this->getJson("/api/orders?entity_id={$this->entityB->id}");
        $resB->assertStatus(200);
        $invoicesB = collect($resB->json('data') ?? $resB->json('orders') ?? $resB->json())->pluck('invoice_number')->all();
        $this->assertContains($orderB->invoice_number, $invoicesB);
        $this->assertNotContains($orderA->invoice_number, $invoicesB);
    }
}
