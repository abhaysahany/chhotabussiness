<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\Order;
use App\Models\OrderPaymentDump;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EntityInvoiceCalculationTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected BusinessEntity $entity;
    protected string $entityToken;
    protected User $buyer;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => env('DB_DATABASE', 'chhotabiz_test'),
        ]);

        $this->admin = Admin::create([
            'name' => 'Invoice Test Admin',
            'username' => 'inv_admin_' . uniqid(),
            'email' => 'inv_admin_' . uniqid() . '@invoicetest.com',
            'password' => Hash::make('secret123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);
        $this->adminToken = $this->admin->createToken('admin_token', ['admin'])->plainTextToken;

        $category = EntityCategory::first() ?? EntityCategory::create([
            'name' => 'Invoice Test Category ' . uniqid(),
            'slug' => 'inv-cat-' . uniqid(),
            'status' => 'active',
        ]);

        $this->entity = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Invoice Test Entity ' . uniqid(),
            'owner_name' => 'Test Owner',
            'email' => 'inv_entity_' . uniqid() . '@invoicetest.com',
            'phone' => '9876543210',
            'password' => Hash::make('secret123'),
            'verification_status' => 'verified',
        ]);
        $this->entityToken = $this->entity->createToken('entity_token', ['entity'])->plainTextToken;

        $this->buyer = User::create([
            'name' => 'Invoice Test Buyer',
            'email' => 'inv_buyer_' . uniqid() . '@invoicetest.com',
            'password' => Hash::make('secret123'),
        ]);
    }

    /**
     * Prompt Benchmark Case:
     * Total Order Cost: ₹90,000 | Actual Received: ₹60,000 | Approved Commission: 30%
     * Expected: Admin Cut = ₹18,000, Net Entity Realized = ₹42,000, Remaining Balance = ₹30,000.
     */
    public function test_partial_payment_invoice_calculates_commission_only_on_received_amount(): void
    {
        $createResp = $this->withToken($this->entityToken)->postJson('/api/entity/orders', [
            'item' => 'Enterprise Web Package',
            'item_type' => 'service',
            'customer_user_code' => $this->buyer->user_code,
            'customer_name' => $this->buyer->name,
            'unit_price' => 90000,
            'quantity' => 1,
            'gross_amount' => 90000,
            'advance_payment' => 60000,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-INV-60K',
        ]);
        $createResp->assertStatus(201);
        $orderId = $createResp->json('order.id');

        $confirmResp = $this->withToken($this->adminToken)->postJson("/api/admin/orders/{$orderId}/confirm", [
            'admin_commission_percent' => 30,
        ]);
        $confirmResp->assertStatus(200);

        $showResp = $this->withToken($this->entityToken)->getJson("/api/orders/{$orderId}");
        $showResp->assertStatus(200);

        $order = $showResp->json('order');
        $summary = $order['invoice_summary'];

        $this->assertEquals(90000.00, (float) $summary['total_order_cost']);
        $this->assertEquals(60000.00, (float) $summary['amount_collected_to_date']);
        $this->assertEquals(30.00, (float) $summary['admin_commission_percent']);
        $this->assertEquals(18000.00, (float) $summary['admin_commission_cut_on_received']);
        $this->assertEquals(27000.00, (float) $summary['expected_full_order_commission']);
        $this->assertEquals(42000.00, (float) $summary['net_entity_realized']);
        $this->assertEquals(30000.00, (float) $summary['remaining_order_balance']);

        // Refreshing / calling list endpoint yields identical consistent figures without creating duplicate rows
        $listResp = $this->withToken($this->entityToken)->getJson('/api/entity/orders');
        $listResp->assertStatus(200);
        $listed = collect($listResp->json('orders'))->firstWhere('id', $orderId);
        $this->assertNotNull($listed);
        $this->assertEquals(18000.00, (float) $listed['admin_commission_collected']);
        $this->assertEquals(42000.00, (float) $listed['net_entity_realized']);
        $this->assertSame(1, SalePayment::where('sales_record_id', $orderId)->count());
    }

    /**
     * Multiple partial payments: ₹40,000 advance + ₹20,000 balance = ₹60,000 on ₹90,000 @ 30%.
     * Individual payment receipts stay distinct from cumulative summary.
     */
    public function test_multiple_partial_payments_distinguish_individual_and_cumulative_totals(): void
    {
        $createResp = $this->withToken($this->entityToken)->postJson('/api/entity/orders', [
            'item' => 'Multi Installment App',
            'item_type' => 'service',
            'customer_user_code' => $this->buyer->user_code,
            'unit_price' => 90000,
            'quantity' => 1,
            'gross_amount' => 90000,
            'advance_payment' => 40000,
            'payment_method' => 'NEFT',
        ]);
        $createResp->assertStatus(201);
        $orderId = $createResp->json('order.id');

        $this->withToken($this->adminToken)->postJson("/api/admin/orders/{$orderId}/confirm", [
            'admin_commission_percent' => 30,
        ])->assertStatus(200);

        $balanceResp = $this->withToken($this->entityToken)->postJson("/api/orders/{$orderId}/receive-balance", [
            'amount' => 20000,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-BAL-20K',
        ]);
        $balanceResp->assertStatus(200);

        $order = $this->withToken($this->entityToken)->getJson("/api/orders/{$orderId}")->json('order');
        $summary = $order['invoice_summary'];
        $payments = collect($order['payments'])->sortBy('id')->values();

        // Individual payment receipts
        $this->assertCount(2, $payments);
        $this->assertEquals(40000.00, (float) $payments[0]['amount']);
        $this->assertEquals(12000.00, (float) $payments[0]['admin_commission_cut']);
        $this->assertEquals(28000.00, (float) $payments[0]['net_entity_amount']);

        $this->assertEquals(20000.00, (float) $payments[1]['amount']);
        $this->assertEquals(6000.00, (float) $payments[1]['admin_commission_cut']);
        $this->assertEquals(14000.00, (float) $payments[1]['net_entity_amount']);

        // Cumulative summary (no double counting)
        $this->assertEquals(90000.00, (float) $summary['total_order_cost']);
        $this->assertEquals(60000.00, (float) $summary['amount_collected_to_date']);
        $this->assertEquals(18000.00, (float) $summary['admin_commission_cut_on_received']);
        $this->assertEquals(42000.00, (float) $summary['net_entity_realized']);
        $this->assertEquals(30000.00, (float) $summary['remaining_order_balance']);
        $this->assertSame(2, $summary['payment_count']);
    }

    /**
     * Full payment received, no payment received, and varied commission percentages.
     */
    public function test_full_payment_zero_payment_and_different_commission_rates(): void
    {
        // 1. Full payment ₹50,000 @ 20%
        $fullResp = $this->withToken($this->entityToken)->postJson('/api/entity/orders', [
            'item' => 'Full Paid Package',
            'item_type' => 'service',
            'customer_user_code' => $this->buyer->user_code,
            'unit_price' => 50000,
            'quantity' => 1,
            'gross_amount' => 50000,
            'advance_payment' => 50000,
        ])->assertStatus(201);
        $fullId = $fullResp->json('order.id');

        $this->withToken($this->adminToken)->postJson("/api/admin/orders/{$fullId}/confirm", [
            'admin_commission_percent' => 20,
        ])->assertStatus(200);

        $fullOrder = $this->withToken($this->entityToken)->getJson("/api/orders/{$fullId}")->json('order');
        $this->assertEquals(50000.00, (float) $fullOrder['invoice_summary']['amount_collected_to_date']);
        $this->assertEquals(10000.00, (float) $fullOrder['invoice_summary']['admin_commission_cut_on_received']);
        $this->assertEquals(40000.00, (float) $fullOrder['invoice_summary']['net_entity_realized']);
        $this->assertEquals(0.00, (float) $fullOrder['invoice_summary']['remaining_order_balance']);

        // 2. Zero payment received ₹0 on ₹90,000 @ 30% -> Admin Cut must be ₹0, NOT ₹27,000
        $zeroResp = $this->withToken($this->entityToken)->postJson('/api/entity/orders', [
            'item' => 'Unpaid Invoice Package',
            'item_type' => 'service',
            'customer_user_code' => $this->buyer->user_code,
            'unit_price' => 90000,
            'quantity' => 1,
            'gross_amount' => 90000,
            'advance_payment' => 0,
        ])->assertStatus(201);
        $zeroId = $zeroResp->json('order.id');

        $this->withToken($this->adminToken)->postJson("/api/admin/orders/{$zeroId}/confirm", [
            'admin_commission_percent' => 30,
        ])->assertStatus(200);

        $zeroOrder = $this->withToken($this->entityToken)->getJson("/api/orders/{$zeroId}")->json('order');
        $this->assertEquals(90000.00, (float) $zeroOrder['invoice_summary']['total_order_cost']);
        $this->assertEquals(0.00, (float) $zeroOrder['invoice_summary']['amount_collected_to_date']);
        $this->assertEquals(0.00, (float) $zeroOrder['invoice_summary']['admin_commission_cut_on_received']);
        $this->assertEquals(0.00, (float) $zeroOrder['invoice_summary']['net_entity_realized']);
        $this->assertEquals(90000.00, (float) $zeroOrder['invoice_summary']['remaining_order_balance']);
    }

    /**
     * Pending or failed payment records must never be counted as received cash.
     */
    public function test_pending_and_failed_payments_are_excluded_from_received_totals(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . uniqid(),
            'date' => '2026-11-12',
            'entity_id' => $this->entity->id,
            'entity_name' => $this->entity->name,
            'entity_type' => 'business',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'item' => 'Status Guard Test',
            'gross_amount' => 90000,
            'admin_commission_percent' => 30,
            'admin_commission_cut' => 27000,
            'advance_payment' => 60000,
            'balance_due' => 30000,
            'approval_status' => 'confirmed',
        ]);

        $paid = new SalePayment(['amount' => 60000, 'admin_commission_percent' => 30, 'admin_commission_cut' => 18000, 'net_entity_amount' => 42000]);
        $paid->setAttribute('status', 'completed');

        $pending = new SalePayment(['amount' => 15000, 'admin_commission_percent' => 30, 'admin_commission_cut' => 4500, 'net_entity_amount' => 10500]);
        $pending->setAttribute('status', 'pending');

        $failed = new SalePayment(['amount' => 15000, 'admin_commission_percent' => 30, 'admin_commission_cut' => 4500, 'net_entity_amount' => 10500]);
        $failed->setAttribute('status', 'failed');

        $order->setRelation('payments', collect([$paid, $pending, $failed]));

        $summary = $order->invoice_summary;
        $this->assertEquals(60000.00, $summary['amount_collected_to_date']);
        $this->assertEquals(18000.00, $summary['admin_commission_cut_on_received']);
        $this->assertEquals(42000.00, $summary['net_entity_realized']);
        $this->assertEquals(30000.00, $summary['remaining_order_balance']);
        $this->assertSame(1, $summary['payment_count']);
    }

    /**
     * Approved Dump reduces remaining balance without inflating cash received or net entity realized.
     */
    public function test_approved_dump_reconciles_remaining_balance_without_inflating_cash_commission(): void
    {
        $createResp = $this->withToken($this->entityToken)->postJson('/api/entity/orders', [
            'item' => 'Dump Reconciliation Project',
            'item_type' => 'service',
            'customer_user_code' => $this->buyer->user_code,
            'unit_price' => 90000,
            'quantity' => 1,
            'gross_amount' => 90000,
            'advance_payment' => 60000,
        ])->assertStatus(201);
        $orderId = $createResp->json('order.id');

        $this->withToken($this->adminToken)->postJson("/api/admin/orders/{$orderId}/confirm", [
            'admin_commission_percent' => 30,
        ])->assertStatus(200);

        $dumpResp = $this->withToken($this->entityToken)->postJson("/api/orders/{$orderId}/report-dump", [
            'dump_amount' => 20000,
            'dump_reason' => 'Client declined final module delivery',
        ])->assertStatus(201);
        $dumpId = $dumpResp->json('dump_request.id');

        $this->withToken($this->adminToken)->postJson("/api/admin/dump-requests/{$dumpId}/approve")
            ->assertStatus(200);

        $order = $this->withToken($this->entityToken)->getJson("/api/orders/{$orderId}")->json('order');
        $summary = $order['invoice_summary'];

        $this->assertEquals(90000.00, (float) $summary['total_order_cost']);
        $this->assertEquals(60000.00, (float) $summary['amount_collected_to_date']);
        $this->assertEquals(20000.00, (float) $summary['approved_dump_amount']);
        $this->assertEquals(18000.00, (float) $summary['admin_commission_cut_on_received']);
        $this->assertEquals(42000.00, (float) $summary['net_entity_realized']);
        $this->assertEquals(10000.00, (float) $summary['remaining_order_balance']);
    }
}
