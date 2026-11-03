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

class EntityOrderApprovalWorkflowTest extends TestCase
{
    use DatabaseTransactions;

    protected User $sponsor;
    protected User $buyer;
    protected BusinessEntity $entityA;
    protected BusinessEntity $entityB;

    protected function setUp(): void
    {
        parent::setUp();

        $category = EntityCategory::first() ?? EntityCategory::create(['name' => 'General Business', 'slug' => 'general-business-' . uniqid()]);

        // 1. Sponsor user
        $this->sponsor = User::create([
            'name' => 'Entity Test Sponsor',
            'email' => 'ent_sponsor_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);

        // 2. Buyer user sponsored by upline
        $this->buyer = User::create([
            'name' => 'Entity Test Buyer',
            'email' => 'ent_buyer_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'sponsor_id' => $this->sponsor->user_code,
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);

        // 3. Business Entity A
        $this->entityA = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Alpha Solar Works Pvt Ltd',
            'owner_name' => 'Alpha Owner',
            'email' => 'alpha_' . uniqid() . '@example.com',
            'phone' => '98' . rand(10000000, 99999999),
            'verification_status' => 'verified',
        ]);

        // 4. Business Entity B
        $this->entityB = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Beta Industrial Solutions',
            'owner_name' => 'Beta Owner',
            'email' => 'beta_' . uniqid() . '@example.com',
            'phone' => '99' . rand(10000000, 99999999),
            'verification_status' => 'verified',
        ]);
    }

    /**
     * Test 1 — Newly created entity order has approval_status = 'pending' and does not credit PV
     */
    public function test_1_newly_created_entity_order_is_pending_and_does_not_credit_pv(): void
    {
        $payload = [
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'entity_type' => 'business',
            'item' => 'Commercial Rooftop Solar 10kW',
            'item_type' => 'product',
            'customer_user_code' => $this->buyer->user_code,
            'customer_name' => $this->buyer->name,
            'sponsor' => $this->sponsor->user_code,
            'unit_price' => 200000.00,
            'quantity' => 1,
            'gross_amount' => 200000.00,
            'advance_payment' => 50000.00,
            'admin_commission_percent' => 20.00,
            'payment_method' => 'Bank Transfer / NEFT',
            'reference_no' => 'NEFT-' . rand(100000, 999999),
        ];

        $response = $this->postJson('/api/orders', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('order.approval_status', 'pending');

        $orderId = $response->json('order.id');
        $order = Order::find($orderId);
        $this->assertNotNull($order);
        $this->assertEquals('pending', $order->approval_status);

        // Verify buyer and sponsor have 0 PV (no credit prior to confirmation)
        $this->buyer->refresh();
        $this->sponsor->refresh();
        $this->assertEquals(0, (float) $this->buyer->personal_pv, 'Buyer personal PV must remain 0 while pending');
        $this->assertEquals(0, (float) $this->sponsor->group_pv, 'Sponsor group PV must remain 0 while pending');
    }

    /**
     * Test 2 — Pending order rejects balance collection via /receive-balance
     */
    public function test_2_pending_order_rejects_balance_collection(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-PEND-' . uniqid(),
            'date' => now()->toDateString(),
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'entity_type' => 'business',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'item' => 'Pending Project Unit',
            'item_type' => 'product',
            'unit_price' => 100000.00,
            'quantity' => 1,
            'gross_amount' => 100000.00,
            'taxable_amount' => 100000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 20000.00,
            'net_entity_payout' => 80000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'payment_method' => 'UPI',
            'status' => 'partial',
            'approval_status' => 'pending',
            'network_distribution_status' => 'pending',
        ]);

        $initialPaymentCount = $order->payments()->count();

        $response = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 10000.00,
            'payment_method' => 'Bank Transfer',
            'reference_no' => 'TXN-BLOCKED-01',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('status', 'error');
        $this->assertStringContainsString('Cannot collect balance payment for an unconfirmed order', $response->json('message'));

        // Confirm balance remained unchanged and no new payment row was created
        $order->refresh();
        $this->assertEquals(80000.00, (float) $order->balance_due);
        $this->assertEquals($initialPaymentCount, $order->payments()->count());
    }

    /**
     * Test 3 — Confirmed order allows balance collection via /receive-balance
     */
    public function test_3_confirmed_order_allows_balance_collection(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-CONF-' . uniqid(),
            'date' => now()->toDateString(),
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'entity_type' => 'business',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'item' => 'Confirmed Project Unit',
            'item_type' => 'product',
            'unit_price' => 100000.00,
            'quantity' => 1,
            'gross_amount' => 100000.00,
            'taxable_amount' => 100000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 20000.00,
            'net_entity_payout' => 80000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'payment_method' => 'UPI',
            'status' => 'partial',
            'approval_status' => 'confirmed',
            'admin_confirmed_at' => now(),
            'network_distribution_status' => 'pending',
        ]);

        $response = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 30000.00,
            'payment_method' => 'Cheque / DD',
            'reference_no' => 'CHQ-SUCCESS-01',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');

        $order->refresh();
        $this->assertEquals(50000.00, (float) $order->balance_due);

        // Verify newly recorded payment
        $payment = $order->payments()
            ->where('payment_type', 'balance')
            ->first();

        $this->assertNotNull($payment);
        $this->assertEquals(30000.00, (float) $payment->amount);
        $this->assertEquals('pending', $payment->income_distribution_status);
    }

    /**
     * Test 4 — Cancelled order rejects balance collection via /receive-balance
     */
    public function test_4_cancelled_order_rejects_balance_collection(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-CANC-' . uniqid(),
            'date' => now()->toDateString(),
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'entity_type' => 'business',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'item' => 'Cancelled Project Unit',
            'item_type' => 'product',
            'unit_price' => 100000.00,
            'quantity' => 1,
            'gross_amount' => 100000.00,
            'taxable_amount' => 100000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 20000.00,
            'net_entity_payout' => 80000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'payment_method' => 'UPI',
            'status' => 'cancelled',
            'approval_status' => 'cancelled',
            'cancellation_reason' => 'Customer requested cancellation during verification',
            'admin_cancelled_at' => now(),
            'network_distribution_status' => 'pending',
        ]);

        $response = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 10000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'TXN-CANC-BLOCKED',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('status', 'error');
        $this->assertStringContainsString('Cannot collect balance payment for an unconfirmed order', $response->json('message'));
    }

    /**
     * Test 5 — Entity query with ?approval_status=cancelled returns only cancelled orders
     */
    public function test_5_entity_query_with_approval_status_cancelled_returns_only_cancelled(): void
    {
        // Order 1: Pending
        $pendingOrder = Order::create([
            'invoice_number' => 'INV-FLT-PEND-' . uniqid(),
            'date' => now()->toDateString(),
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'customer_name' => 'Filter Customer 1',
            'item' => 'Filter Solar Item',
            'gross_amount' => 50000.00,
            'approval_status' => 'pending',
            'status' => 'partial',
        ]);

        // Order 2: Confirmed
        $confirmedOrder = Order::create([
            'invoice_number' => 'INV-FLT-CONF-' . uniqid(),
            'date' => now()->toDateString(),
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'customer_name' => 'Filter Customer 2',
            'item' => 'Filter Solar Item',
            'gross_amount' => 60000.00,
            'approval_status' => 'confirmed',
            'status' => 'partial',
        ]);

        // Order 3: Cancelled
        $cancelledOrder = Order::create([
            'invoice_number' => 'INV-FLT-CANC-' . uniqid(),
            'date' => now()->toDateString(),
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'customer_name' => 'Filter Customer 3',
            'item' => 'Filter Solar Item',
            'gross_amount' => 70000.00,
            'approval_status' => 'cancelled',
            'cancellation_reason' => 'Invalid project scope provided by client',
            'admin_cancelled_at' => now(),
            'status' => 'cancelled',
        ]);

        $response = $this->getJson("/api/orders?entity=" . urlencode($this->entityA->name) . "&approval_status=cancelled");

        $response->assertStatus(200);
        $data = $response->json('data') ?? $response->json('orders') ?? $response->json();
        $this->assertIsArray($data);

        $returnedInvoices = collect($data)->pluck('invoice_number')->all();

        $this->assertContains($cancelledOrder->invoice_number, $returnedInvoices);
        $this->assertNotContains($pendingOrder->invoice_number, $returnedInvoices, 'Pending orders must not appear in cancelled query');
        $this->assertNotContains($confirmedOrder->invoice_number, $returnedInvoices, 'Confirmed orders must not appear in cancelled query');

        // All returned records must have approval_status = 'cancelled'
        foreach ($data as $row) {
            $this->assertEquals('cancelled', $row['approval_status'] ?? $row['approvalStatus'] ?? null);
        }
    }

    /**
     * Test 6 — Entity ownership isolation prevents viewing other entity's cancelled orders
     */
    public function test_6_entity_ownership_isolation(): void
    {
        // Cancelled order for Entity A
        $orderAlpha = Order::create([
            'invoice_number' => 'INV-ISO-ALPHA-' . uniqid(),
            'date' => now()->toDateString(),
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'customer_name' => 'Customer Alpha',
            'item' => 'Alpha Solar Kit',
            'gross_amount' => 80000.00,
            'approval_status' => 'cancelled',
            'cancellation_reason' => 'Entity Alpha site inspection failed',
            'admin_cancelled_at' => now(),
            'status' => 'cancelled',
        ]);

        // Cancelled order for Entity B
        $orderBeta = Order::create([
            'invoice_number' => 'INV-ISO-BETA-' . uniqid(),
            'date' => now()->toDateString(),
            'entity_id' => $this->entityB->id,
            'entity_name' => $this->entityB->name,
            'customer_name' => 'Customer Beta',
            'item' => 'Beta Industrial Gear',
            'gross_amount' => 150000.00,
            'approval_status' => 'cancelled',
            'cancellation_reason' => 'Entity Beta out of stock',
            'admin_cancelled_at' => now(),
            'status' => 'cancelled',
        ]);

        // Query strictly for Entity Alpha
        $responseAlpha = $this->getJson("/api/orders?entity_id={$this->entityA->id}&approval_status=cancelled");
        $responseAlpha->assertStatus(200);

        $alphaData = $responseAlpha->json('data') ?? $responseAlpha->json('orders') ?? $responseAlpha->json();
        $alphaInvoices = collect($alphaData)->pluck('invoice_number')->all();

        $this->assertContains($orderAlpha->invoice_number, $alphaInvoices);
        $this->assertNotContains($orderBeta->invoice_number, $alphaInvoices, 'Entity A must never see Entity B orders');

        // Query strictly for Entity Beta
        $responseBeta = $this->getJson("/api/orders?entity_id={$this->entityB->id}&approval_status=cancelled");
        $responseBeta->assertStatus(200);

        $betaData = $responseBeta->json('data') ?? $responseBeta->json('orders') ?? $responseBeta->json();
        $betaInvoices = collect($betaData)->pluck('invoice_number')->all();

        $this->assertContains($orderBeta->invoice_number, $betaInvoices);
        $this->assertNotContains($orderAlpha->invoice_number, $betaInvoices, 'Entity B must never see Entity A orders');
    }
}
