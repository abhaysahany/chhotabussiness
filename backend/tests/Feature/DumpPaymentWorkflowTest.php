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
use Tests\TestCase;

class DumpPaymentWorkflowTest extends TestCase
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

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Dump Test Admin',
            'username' => 'dumpadmin_' . uniqid(),
            'email' => 'dumpadmin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('dump_admin_token', ['admin'])->plainTextToken;

        $this->sponsor = User::create([
            'name' => 'Dump Test Sponsor',
            'email' => 'sponsor_dump_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);

        $this->buyer = User::create([
            'name' => 'Dump Test Buyer',
            'email' => 'buyer_dump_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'sponsor_id' => $this->sponsor->user_code,
            'personal_pv' => 0,
            'group_pv' => 0,
        ]);

        $category = EntityCategory::first() ?? EntityCategory::create(['name' => 'General Category', 'slug' => 'general-' . uniqid()]);

        $this->entityA = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Solar Dynamics Pvt Ltd',
            'owner_name' => 'Solar Director',
            'email' => 'solardyn_' . uniqid() . '@example.com',
            'phone' => '98' . rand(10000000, 99999999),
            'verification_status' => 'verified',
        ]);

        $this->entityB = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Wind Power Systems Ltd',
            'owner_name' => 'Wind Director',
            'email' => 'windpower_' . uniqid() . '@example.com',
            'phone' => '99' . rand(10000000, 99999999),
            'verification_status' => 'verified',
        ]);
    }

    /**
     * Helper to create a standard confirmed order with initial advance payment.
     */
    protected function createConfirmedOrder(array $overrides = []): Order
    {
        $order = Order::create(array_merge([
            'invoice_number' => 'INV-DUMP-' . uniqid(),
            'item' => 'Commercial Solar Array',
            'gross_amount' => 100000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'dump_amount' => 0.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'net_entity_payout' => 17000.00,
            'approval_status' => 'confirmed',
            'status' => 'partial',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'admin_confirmed_at' => now(),
            'admin_confirmed_by' => $this->admin->id,
        ], $overrides));

        SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'net_entity_amount' => 17000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        return $order;
    }

    /**
     * Test 1 — Entity Reports Dump: One pending dump request created, no payment receipt, order balance unchanged
     */
    public function test_1_entity_reports_dump_creates_pending_request_and_preserves_order_balance(): void
    {
        $order = $this->createConfirmedOrder();

        $initialPaymentCount = SalePayment::where('sales_record_id', $order->id)->count();

        $response = $this->postJson("/api/orders/{$order->id}/report-dump", [
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'dump_amount' => 10000.00,
            'dump_reason' => 'Customer ceased operations and defaulted on 2nd milestone.',
            'notes' => 'Multiple phone calls and legal notice unanswered.',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('status', 'success');
        $this->assertStringContainsString('awaiting Admin approval', $response->json('message'));

        $dumpId = $response->json('dump_request.id');
        $this->assertNotNull($dumpId);

        // Verify dump request in database
        $dumpRequest = OrderPaymentDump::find($dumpId);
        $this->assertNotNull($dumpRequest);
        $this->assertEquals('pending', $dumpRequest->status);
        $this->assertEquals(10000.00, (float) $dumpRequest->dump_amount);
        $this->assertEquals(15.00, (float) $dumpRequest->admin_commission_percent);
        $this->assertEquals(1500.00, (float) $dumpRequest->admin_commission_cut);
        $this->assertNull($dumpRequest->approved_at);

        // Verify NO sale_payments record was created
        $this->assertEquals($initialPaymentCount, SalePayment::where('sales_record_id', $order->id)->count());

        // Verify Parent Order balance and dump amount remain UNCHANGED until Admin approval
        $order->refresh();
        $this->assertEquals(80000.00, (float) $order->balance_due);
        $this->assertEquals(0.00, (float) $order->dump_amount);
        $this->assertEquals(20000.00, (float) $order->advance_payment);
    }

    /**
     * Test 2 — Invalid Dump Amount Validations
     */
    public function test_2_invalid_dump_amount_validations(): void
    {
        $order = $this->createConfirmedOrder();

        // 1. Zero amount
        $resZero = $this->postJson("/api/orders/{$order->id}/report-dump", [
            'entity_id' => $this->entityA->id,
            'dump_amount' => 0.00,
            'dump_reason' => 'Zero amount test',
        ]);
        $resZero->assertStatus(422);

        // 2. Negative amount
        $resNeg = $this->postJson("/api/orders/{$order->id}/report-dump", [
            'entity_id' => $this->entityA->id,
            'dump_amount' => -500.00,
            'dump_reason' => 'Negative amount test',
        ]);
        $resNeg->assertStatus(422);

        // 3. Exceeds remaining collectible balance (balance is ₹80,000, request ₹90,000)
        $resExcess = $this->postJson("/api/orders/{$order->id}/report-dump", [
            'entity_id' => $this->entityA->id,
            'dump_amount' => 90000.00,
            'dump_reason' => 'Excessive dump amount test',
        ]);
        $resExcess->assertStatus(422);
        $this->assertStringContainsString('exceeds the remaining collectible balance', $resExcess->json('message'));

        // 4. Missing dump reason
        $resNoReason = $this->postJson("/api/orders/{$order->id}/report-dump", [
            'entity_id' => $this->entityA->id,
            'dump_amount' => 5000.00,
            'dump_reason' => '',
        ]);
        $resNoReason->assertStatus(422);

        // 5. Unconfirmed order
        $pendingOrder = Order::create([
            'invoice_number' => 'INV-UNCONF-' . uniqid(),
            'item' => 'Pending Project',
            'gross_amount' => 50000.00,
            'advance_payment' => 10000.00,
            'balance_due' => 40000.00,
            'approval_status' => 'pending',
            'status' => 'partial',
            'customer_name' => $this->buyer->name,
            'entity_id' => $this->entityA->id,
        ]);
        $resUnconf = $this->postJson("/api/orders/{$pendingOrder->id}/report-dump", [
            'entity_id' => $this->entityA->id,
            'dump_amount' => 5000.00,
            'dump_reason' => 'Unconfirmed order test',
        ]);
        $resUnconf->assertStatus(422);
        $this->assertStringContainsString('unconfirmed order', $resUnconf->json('message'));
    }

    /**
     * Test 3 — Admin Approves Dump: Accurate 40/40/20 split and calculations
     */
    public function test_3_admin_approves_dump_with_accurate_40_40_20_split(): void
    {
        $order = $this->createConfirmedOrder(); // 15% commission, 80k balance

        // Entity submits ₹10,000 dump
        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_id' => $order->entity_id,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'dump_amount' => 10000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 1500.00,
            'dump_reason' => 'Client bankruptcy and project termination',
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        // Admin approves dump
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve");

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');

        // Verify dump record updated
        $dump->refresh();
        $this->assertEquals('approved', $dump->status);
        $this->assertEquals($this->admin->id, $dump->approved_by);
        $this->assertNotNull($dump->approved_at);

        // Dump Admin Cut = ₹10,000 * 15% = ₹1,500.00
        $this->assertEquals(1500.00, (float) $dump->admin_commission_cut);

        // 40/40/20 split on ₹1,500:
        // Direct 40% = ₹600.00
        // Level 40% = ₹600.00
        // Reward 20% = ₹300.00
        $this->assertEquals(600.00, (float) $dump->direct_income_amount);
        $this->assertEquals(600.00, (float) $dump->level_income_amount);
        $this->assertEquals(300.00, (float) $dump->reward_income_amount);

        // Sum must match exact Dump Admin Cut
        $this->assertEquals(1500.00, (float) ($dump->direct_income_amount + $dump->level_income_amount + $dump->reward_income_amount));

        // Existing payment receipts must remain unchanged
        $payment = SalePayment::where('sales_record_id', $order->id)->first();
        $this->assertEquals(20000.00, (float) $payment->amount);
        $this->assertEquals(3000.00, (float) $payment->admin_commission_cut);
    }

    /**
     * Test 4 — Balance Reconciliation Formula
     */
    public function test_4_balance_reconciliation_formula(): void
    {
        $order = $this->createConfirmedOrder(); // gross 100k, advance 20k, balance 80k

        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_id' => $order->entity_id,
            'customer_name' => $order->customer_name,
            'dump_amount' => 10000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 1500.00,
            'dump_reason' => 'Written-off balance component',
            'status' => 'pending',
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve")
            ->assertStatus(200);

        // Formula:
        // Remaining Collectible Balance = gross_amount - advance_payment - approved_dump
        // Remaining = 100,000 - 20,000 - 10,000 = 70,000
        $order->refresh();
        $this->assertEquals(100000.00, (float) $order->gross_amount);
        $this->assertEquals(20000.00, (float) $order->advance_payment, 'Advance payment must strictly reflect cash received');
        $this->assertEquals(10000.00, (float) $order->dump_amount, 'Aggregate dump_amount must equal approved dump');
        $this->assertEquals(70000.00, (float) $order->balance_due, 'Balance due must be reduced by approved dump');
    }

    /**
     * Test 5 — Rejected Dump Request: Rejection reason saved, no balance change, no commission
     */
    public function test_5_rejected_dump_request(): void
    {
        $order = $this->createConfirmedOrder();

        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'dump_amount' => 15000.00,
            'admin_commission_percent' => 15.00,
            'dump_reason' => 'Customer disputed invoice',
            'status' => 'pending',
        ]);

        $rejectionReason = 'Customer dispute resolved offline; payment expected next week.';
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/reject", [
                'rejection_reason' => $rejectionReason,
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');

        $dump->refresh();
        $this->assertEquals('rejected', $dump->status);
        $this->assertEquals($rejectionReason, $dump->admin_rejection_reason);
        $this->assertEquals($this->admin->id, $dump->rejected_by);
        $this->assertNotNull($dump->rejected_at);
        $this->assertEquals(0.00, (float) $dump->direct_income_amount);
        $this->assertEquals(0.00, (float) $dump->level_income_amount);

        // Parent order remains completely unchanged
        $order->refresh();
        $this->assertEquals(80000.00, (float) $order->balance_due);
        $this->assertEquals(0.00, (float) $order->dump_amount);
    }

    /**
     * Test 6 — Duplicate Approval Protection: Second approval rejected with 422
     */
    public function test_6_duplicate_approval_is_prevented(): void
    {
        $order = $this->createConfirmedOrder();

        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'dump_amount' => 10000.00,
            'admin_commission_percent' => 15.00,
            'dump_reason' => 'Defaulted debt',
            'status' => 'pending',
        ]);

        // First approval
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve");
        $res1->assertStatus(200);

        // Second approval attempt
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve");
        $res2->assertStatus(422);
        $this->assertStringContainsString('already been approved', $res2->json('message'));

        // Parent order dump amount remains ₹10,000 (not duplicated to ₹20,000)
        $order->refresh();
        $this->assertEquals(10000.00, (float) $order->dump_amount);
        $this->assertEquals(70000.00, (float) $order->balance_due);
    }

    /**
     * Test 7 — Normal Payment Continues After Partial Approved Dump
     */
    public function test_7_normal_payment_continues_after_partial_approved_dump(): void
    {
        $order = $this->createConfirmedOrder(); // gross 100k, adv 20k, bal 80k

        // 1. Approve ₹10,000 dump -> collectible balance becomes ₹70,000
        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'dump_amount' => 10000.00,
            'admin_commission_percent' => 15.00,
            'dump_reason' => 'Partial write-off',
            'status' => 'pending',
        ]);
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve")
            ->assertStatus(200);

        $order->refresh();
        $this->assertEquals(70000.00, (float) $order->balance_due);

        // 2. Entity receives actual installment of ₹20,000
        $payRes = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 20000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UPI-AFTER-DUMP',
        ]);
        $payRes->assertStatus(200);

        // 3. Verify normal payment receipt created with 15% rate
        $newPayment = SalePayment::where('sales_record_id', $order->id)
            ->where('reference_no', 'UPI-AFTER-DUMP')
            ->first();
        $this->assertNotNull($newPayment);
        $this->assertEquals(20000.00, (float) $newPayment->amount);
        $this->assertEquals(3000.00, (float) $newPayment->admin_commission_cut);
        $this->assertEquals('pending', $newPayment->income_distribution_status);

        // 4. Verify parent order totals:
        // gross = 100k, advance = 40k (20k + 20k actual), dump = 10k, balance_due = 50k (100k - 40k - 10k)
        $order->refresh();
        $this->assertEquals(100000.00, (float) $order->gross_amount);
        $this->assertEquals(40000.00, (float) $order->advance_payment);
        $this->assertEquals(10000.00, (float) $order->dump_amount);
        $this->assertEquals(50000.00, (float) $order->balance_due);

        // Dump record untouched
        $dump->refresh();
        $this->assertEquals(10000.00, (float) $dump->dump_amount);
        $this->assertEquals('approved', $dump->status);

        // 5. Attempting to collect payment exceeding the ₹50,000 balance is rejected
        $excessPayRes = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 55000.00,
            'payment_method' => 'Cheque',
        ]);
        $excessPayRes->assertStatus(422);
    }

    /**
     * Test 8 — No PV/BV Credited on Dump Approval
     */
    public function test_8_no_pv_bv_credited_on_dump(): void
    {
        $order = $this->createConfirmedOrder();

        $initialBuyerPv = (float) $this->buyer->fresh()->personal_pv;
        $initialSponsorPv = (float) $this->sponsor->fresh()->group_pv;

        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'dump_amount' => 10000.00,
            'admin_commission_percent' => 15.00,
            'dump_reason' => 'Zero PV verification',
            'status' => 'pending',
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve")
            ->assertStatus(200);

        // PV/BV must NOT change
        $this->assertEquals($initialBuyerPv, (float) $this->buyer->fresh()->personal_pv, 'Buyer personal PV must remain unchanged on dump approval');
        $this->assertEquals($initialSponsorPv, (float) $this->sponsor->fresh()->group_pv, 'Sponsor group PV must remain unchanged on dump approval');
    }

    /**
     * Test 9 — Entity Ownership Security: Cross-tenant isolation
     */
    public function test_9_entity_ownership_isolation(): void
    {
        // Entity A order
        $orderA = $this->createConfirmedOrder(['entity_id' => $this->entityA->id, 'entity_name' => $this->entityA->name]);

        // Entity B attempts to report dump on Entity A's order
        $hackResponse = $this->postJson("/api/orders/{$orderA->id}/report-dump", [
            'entity_id' => $this->entityB->id,
            'entity_name' => $this->entityB->name,
            'dump_amount' => 5000.00,
            'dump_reason' => 'Cross-tenant attempt',
        ]);
        // Must be rejected (either 403 or unowned entity error)
        $this->assertTrue(in_array($hackResponse->status(), [403, 422]));

        // Create dump for Entity A
        $dumpA = OrderPaymentDump::create([
            'order_id' => $orderA->id,
            'invoice_number' => $orderA->invoice_number,
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'customer_name' => $orderA->customer_name,
            'dump_amount' => 5000.00,
            'admin_commission_percent' => 15.00,
            'dump_reason' => 'Entity A legitimate dump',
            'status' => 'pending',
        ]);

        // Query Entity B dump requests
        $resB = $this->getJson("/api/entity/dump-requests?entity_id={$this->entityB->id}");
        $resB->assertStatus(200);
        $dumpsB = $resB->json('data') ?? $resB->json('dumps') ?? [];
        $idsB = collect($dumpsB)->pluck('id')->all();
        $this->assertNotContains($dumpA->id, $idsB, 'Entity B must never see Entity A dump requests');
    }

    /**
     * Test 10 — Financial Summary Separation: Payment History excludes Dumps
     */
    public function test_10_financial_summary_separation(): void
    {
        $order = $this->createConfirmedOrder();

        // Approve a ₹10,000 dump
        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'dump_amount' => 10000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 1500.00,
            'dump_reason' => 'Write-off separation test',
            'status' => 'pending',
        ]);
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve")
            ->assertStatus(200);

        // Fetch regular Payment Receipts & History
        $historyResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $historyResponse->assertStatus(200);

        $returnedPayments = collect($historyResponse->json('payments'));
        $paymentAmounts = $returnedPayments->pluck('amount')->map(fn($v) => (float)$v)->all();

        // Payment History must strictly contain sale_payments; the dump amount ₹10,000 must NOT appear as a payment
        $this->assertNotContains(10000.00, $paymentAmounts, 'Dump amount must never be presented as an actual payment in Payment History');

        // Total payments count in sale_payments for this order remains 1
        $this->assertEquals(1, SalePayment::where('sales_record_id', $order->id)->count());
    }

    /**
     * Test 11 — Full dump payment on unpaid order: balance reduced to 0, status 'Closed via Dump', remaining admin commission becomes 0.
     */
    public function test_11_full_dump_payment_closes_order(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-FULLDUMP-' . uniqid(),
            'item' => 'Full Dump Project',
            'gross_amount' => 50000.00,
            'advance_payment' => 0.00,
            'balance_due' => 50000.00,
            'dump_amount' => 0.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 10000.00,
            'approval_status' => 'confirmed',
            'status' => 'pending',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'admin_confirmed_at' => now(),
            'admin_confirmed_by' => $this->admin->id,
        ]);

        $this->assertEquals('Unpaid', $order->payment_settlement_status);

        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_id' => $order->entity_id,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'dump_amount' => 50000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 10000.00,
            'dump_reason' => 'Total customer default before any cash received',
            'status' => 'pending',
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve");
        $res->assertStatus(200);

        $order->refresh();
        $this->assertEquals(0.00, (float) $order->balance_due);
        $this->assertEquals(0.00, (float) $order->remaining_project_balance);
        $this->assertEquals(0.00, (float) $order->remaining_admin_commission);
        $this->assertEquals('Closed via Dump', $order->payment_settlement_status);
    }

    /**
     * Test 12 — Remaining Admin Cut math and Settlement status classifications.
     */
    public function test_12_remaining_admin_cut_math_and_settlement_status(): void
    {
        // Order with gross 10,000, 20% commission (expected cut 2,000)
        $order = Order::create([
            'invoice_number' => 'INV-MATH-' . uniqid(),
            'item' => 'Math Test Project',
            'gross_amount' => 10000.00,
            'advance_payment' => 4000.00,
            'balance_due' => 6000.00,
            'dump_amount' => 0.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 2000.00,
            'approval_status' => 'confirmed',
            'status' => 'partial',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'entity_id' => $this->entityA->id,
            'entity_name' => $this->entityA->name,
            'admin_confirmed_at' => now(),
            'admin_confirmed_by' => $this->admin->id,
        ]);

        SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 4000.00,
            'admin_commission_percent' => 20.00,
            'admin_commission_cut' => 800.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        $order->refresh();
        // Initially: Cash collected = 4,000 (cut = 800). Expected = 2,000. Remaining cut = 1,200. Status = Partially Paid
        $this->assertEquals(1200.00, (float) $order->remaining_admin_commission);
        $this->assertEquals('Partially Paid', $order->payment_settlement_status);

        // Dump 3,000 approved (dump cut = 600).
        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'dump_amount' => 3000.00,
            'admin_commission_percent' => 20.00,
            'dump_reason' => 'Partial write-off',
            'status' => 'pending',
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve")
            ->assertStatus(200);

        $order->refresh();
        // Now: gross 10k - cash 4k - dump 3k = 3k remaining balance.
        // Expected cut 2,000 - cash cut 800 - dump cut 600 = 600 remaining cut.
        $this->assertEquals(3000.00, (float) $order->remaining_project_balance);
        $this->assertEquals(600.00, (float) $order->remaining_admin_commission);
        $this->assertEquals('Partial Dump Write-Off', $order->payment_settlement_status);
    }

    /**
     * Test 13 — Multiple pending dump requests cumulative ceiling validation.
     */
    public function test_13_multiple_pending_dumps_cumulative_ceiling(): void
    {
        $order = $this->createConfirmedOrder(['gross_amount' => 10000.00, 'advance_payment' => 4000.00, 'balance_due' => 6000.00]);
        // Collectible balance = 6,000

        // Entity submits 1st pending dump of 4,000 -> OK
        $res1 = $this->postJson("/api/orders/{$order->id}/report-dump", [
            'entity_id' => $this->entityA->id,
            'dump_amount' => 4000.00,
            'dump_reason' => 'First partial dump',
        ]);
        $res1->assertStatus(201);

        // Entity submits 2nd pending dump of 3,000 (4,000 + 3,000 = 7,000 > 6,000) -> Rejected
        $res2 = $this->postJson("/api/orders/{$order->id}/report-dump", [
            'entity_id' => $this->entityA->id,
            'dump_amount' => 3000.00,
            'dump_reason' => 'Second excessive partial dump',
        ]);
        $res2->assertStatus(422);
        $this->assertStringContainsString('exceeds the remaining collectible balance', $res2->json('message'));
    }

    /**
     * Test 14 — Benchmark #554 and Legacy #376 Preservation.
     */
    public function test_14_historical_preservation_benchmarks(): void
    {
        $order554 = Order::find(554);
        if ($order554) {
            $this->assertEquals(3500.00, (float) $order554->gross_amount);
            $this->assertEquals(1750.00, (float) $order554->advance_payment);
            $this->assertEquals(1750.00, (float) $order554->approved_dump_amount);
            $this->assertEquals(0.00, (float) $order554->remaining_project_balance);
            $this->assertEquals(0.00, (float) $order554->remaining_admin_commission);
            $this->assertEquals('Closed via Dump', $order554->payment_settlement_status);
        }

        $order376 = Order::find(376);
        if ($order376) {
            $this->assertEquals(3500.00, (float) $order376->gross_amount);
            $this->assertEquals(3500.00, (float) $order376->advance_payment);
            $this->assertEquals(2000.00, (float) $order376->dump_amount, 'Legacy dump_amount on order 376 must remain preserved');
            $this->assertEquals(0.00, (float) $order376->remaining_project_balance);
            $this->assertEquals('Fully Paid (Cash)', $order376->payment_settlement_status);
        }
    }
}
