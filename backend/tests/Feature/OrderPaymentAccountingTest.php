<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Services\AdminIncomeAllocationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class OrderPaymentAccountingTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Accounting Test Admin',
            'username' => 'acctadmin_' . uniqid(),
            'email' => 'acctadmin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('acct_admin_token', ['admin'])->plainTextToken;

        $this->user = User::first() ?? User::create([
            'name' => 'Accounting Customer',
            'email' => 'acctuser_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);
    }

    /**
     * Test Case 1: Advance Payment (Section 11)
     * Order amount: ₹1,00,000, Payment received: ₹20,000.
     * Expected:
     * - 1 order record
     * - 1 payment receipt record
     * - Payment Admin Cut: ₹3,000 (20,000 * 15%)
     * - Expected overall Admin Commission: ₹15,000 (1,00,000 * 15%)
     * - Collected Admin Commission: ₹3,000
     * - Remaining Admin Commission: ₹12,000
     * - Order balance due: ₹80,000
     */
    public function test_case_1_advance_payment_creates_order_and_distinct_payment_receipt(): void
    {
        $response = $this->postJson('/api/orders', [
            'customer_user_code' => $this->user->user_code,
            'customer_name' => $this->user->name,
            'customer_email' => $this->user->email,
            'item' => 'Solar Power System',
            'item_type' => 'service',
            'gross_amount' => 100000.00,
            'advance_payment' => 20000.00,
            'admin_commission_percent' => 15.00,
            'payment_method' => 'Bank Transfer',
        ]);

        $response->assertStatus(201);
        $orderId = $response->json('order.id');
        $this->assertNotNull($orderId);

        $order = Order::with('payments')->findOrFail($orderId);

        // Verify Order Level Accounting
        $this->assertEquals(100000.00, $order->gross_amount);
        $this->assertEquals(15.00, $order->admin_commission_percent);
        $this->assertEquals(15000.00, $order->admin_commission_cut); // Expected Admin Commission
        $this->assertEquals(15000.00, $order->expected_admin_cut);
        $this->assertEquals(20000.00, $order->advance_payment);
        $this->assertEquals(20000.00, $order->total_payment_received);
        $this->assertEquals(80000.00, $order->balance_due);
        $this->assertEquals(80000.00, $order->remaining_project_balance);
        $this->assertEquals(3000.00, $order->admin_commission_collected);
        $this->assertEquals(12000.00, $order->remaining_admin_commission);

        // Verify Payment Receipts
        $this->assertCount(1, $order->payments);
        $payment1 = $order->payments->first();

        $this->assertEquals(20000.00, $payment1->amount);
        $this->assertEquals(15.00, $payment1->admin_commission_percent);
        $this->assertEquals(3000.00, $payment1->admin_commission_cut);
        $this->assertEquals(17000.00, $payment1->net_entity_amount);
        $this->assertEquals('advance', $payment1->payment_type);
        $this->assertEquals('pending', $payment1->income_distribution_status);
        $this->assertEquals(0.00, $payment1->distributed_admin_cut_amount);
    }

    /**
     * Test Case 2: Second Payment (Section 11)
     * Receive another ₹20,000 installment.
     * Expected:
     * - Same order ID
     * - A second distinct sale_payments record
     * - Second payment Admin Cut: ₹3,000
     * - Total payment received: ₹40,000
     * - Collected Admin Commission: ₹6,000
     * - Remaining Admin Commission: ₹9,000
     * - Order balance due: ₹60,000
     */
    public function test_case_2_second_payment_adds_distinct_receipt_and_updates_reconciliation(): void
    {
        // 1. Create order with initial advance of ₹20,000
        $order = Order::create([
            'invoice_number' => 'INV-TEST-ACCT-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_name' => 'SolarTech Entity',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'sponsor' => 'CB100001',
            'item' => 'Solar Plant Installation',
            'item_type' => 'service',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00, // Expected Admin Commission
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'status' => 'partial',
            'income_distribution_status' => 'pending',
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

        // 2. Receive second payment of ₹20,000
        $response = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 20000.00,
            'payment_method' => 'UPI / PhonePe',
            'notes' => 'Second installment received',
        ]);

        $response->assertStatus(200);

        // 3. Re-verify Order and Payments
        $order->refresh();
        $order->load('payments');

        $this->assertEquals(100000.00, $order->gross_amount);
        $this->assertEquals(15000.00, $order->admin_commission_cut); // Stays Expected ₹15,000
        $this->assertEquals(40000.00, $order->advance_payment); // Total Payment Received: ₹40,000
        $this->assertEquals(40000.00, $order->total_payment_received);
        $this->assertEquals(60000.00, $order->balance_due); // Remaining Project Balance: ₹60,000
        $this->assertEquals(6000.00, $order->admin_commission_collected); // Collected: ₹3,000 + ₹3,000 = ₹6,000
        $this->assertEquals(9000.00, $order->remaining_admin_commission); // Remaining: ₹15,000 - ₹6,000 = ₹9,000

        // 4. Verify distinct payment receipts
        $this->assertCount(2, $order->payments);
        $payment2 = $order->payments->where('payment_type', 'balance')->first();
        $this->assertNotNull($payment2);
        $this->assertEquals(20000.00, $payment2->amount);
        $this->assertEquals(3000.00, $payment2->admin_commission_cut);
        $this->assertEquals(17000.00, $payment2->net_entity_amount);
        $this->assertEquals('pending', $payment2->income_distribution_status);
    }

    /**
     * Test Case 3: Distribute First Payment (Section 11)
     * Distribute only the first payment.
     * Expected:
     * - First payment changes to completed.
     * - Second payment stays pending.
     * - First payment allocation totals equal its own ₹3,000 cut (Direct 1200, Level 1200, Reward 600).
     * - No additional payment receipt is created (total payment rows remains 2).
     * - Parent order status reflects statuses of all payments ('partial').
     */
    public function test_case_3_distribute_first_payment_is_independent_and_does_not_create_receipt(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-DIST1-' . rand(10000, 99999),
            'item' => 'Solar Power System',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'advance_payment' => 40000.00,
            'balance_due' => 60000.00,
            'status' => 'partial',
            'income_distribution_status' => 'pending',
            'customer_name' => $this->user->name,
        ]);

        $p1 = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        $p2 = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'payment_type' => 'balance',
            'income_distribution_status' => 'pending',
        ]);

        $initialReceiptCount = SalePayment::where('sales_record_id', $order->id)->count();
        $this->assertEquals(2, $initialReceiptCount);

        // Distribute Payment 1
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$p1->id}/income-allocation");

        $response->assertStatus(200);

        // Verify Payment 1 updated
        $p1->refresh();
        $this->assertEquals('completed', $p1->income_distribution_status);
        $this->assertEquals(3000.00, $p1->distributed_admin_cut_amount);
        $this->assertEquals(1200.00, $p1->direct_income_amount); // 40% of 3000
        $this->assertEquals(1200.00, $p1->level_income_amount);  // 40% of 3000
        $this->assertEquals(600.00, $p1->reward_income_amount);   // 20% of 3000

        // Verify Payment 2 remains UNCHANGED and PENDING
        $p2->refresh();
        $this->assertEquals('pending', $p2->income_distribution_status);
        $this->assertEquals(0.00, $p2->distributed_admin_cut_amount);

        // Verify NO extra payment rows were created
        $finalReceiptCount = SalePayment::where('sales_record_id', $order->id)->count();
        $this->assertEquals(2, $finalReceiptCount);

        // Verify Parent Order aggregate status
        $order->refresh();
        $this->assertEquals('partial', $order->income_distribution_status);
        $this->assertEquals(3000.00, $order->distributed_admin_cut_amount);
        $this->assertEquals(1200.00, $order->direct_income_amount);
        $this->assertEquals(1200.00, $order->level_income_amount);
        $this->assertEquals(600.00, $order->reward_income_amount);
    }

    /**
     * Test Case 4: Distribute Second Payment (Section 11)
     * Distribute second payment independently.
     * Expected:
     * - Second payment becomes completed.
     * - Its 40/40/20 values calculated from its own ₹3,000 cut.
     * - First payment remains unchanged.
     * - Order aggregate distribution summary reconciles: distributed cut = ₹6,000, status = completed.
     */
    public function test_case_4_distribute_second_payment_reconciles_order_aggregate(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-DIST2-' . rand(10000, 99999),
            'item' => 'Solar Power System',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'advance_payment' => 40000.00,
            'balance_due' => 60000.00,
            'status' => 'partial',
            'income_distribution_status' => 'partial',
            'direct_income_amount' => 1200.00,
            'level_income_amount' => 1200.00,
            'reward_income_amount' => 600.00,
            'distributed_admin_cut_amount' => 3000.00,
            'customer_name' => $this->user->name,
        ]);

        $p1 = SalePayment::create([
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

        $p2 = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'payment_type' => 'balance',
            'income_distribution_status' => 'pending',
        ]);

        // Distribute Payment 2
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$p2->id}/income-allocation");

        $response->assertStatus(200);

        // Verify Payment 2 completed
        $p2->refresh();
        $this->assertEquals('completed', $p2->income_distribution_status);
        $this->assertEquals(3000.00, $p2->distributed_admin_cut_amount);
        $this->assertEquals(1200.00, $p2->direct_income_amount);
        $this->assertEquals(1200.00, $p2->level_income_amount);
        $this->assertEquals(600.00, $p2->reward_income_amount);

        // Verify Payment 1 unchanged
        $p1->refresh();
        $this->assertEquals('completed', $p1->income_distribution_status);
        $this->assertEquals(3000.00, $p1->distributed_admin_cut_amount);

        // Verify Parent Order aggregate reconciles: 3000 + 3000 = 6000 distributed cut
        $order->refresh();
        $this->assertEquals('completed', $order->income_distribution_status); // All payments allocated
        $this->assertEquals(6000.00, $order->distributed_admin_cut_amount);
        $this->assertEquals(2400.00, $order->direct_income_amount);
        $this->assertEquals(2400.00, $order->level_income_amount);
        $this->assertEquals(1200.00, $order->reward_income_amount);
    }

    /**
     * Test Case 5: Duplicate Request Protection (Section 11)
     * Calling distribution again on an already completed payment receipt.
     * Expected:
     * - Rejection with 400 error.
     * - No duplicate allocation.
     * - No new payment rows.
     */
    public function test_case_5_duplicate_payment_distribution_is_blocked(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-DUP-' . rand(10000, 99999),
            'item' => 'Solar Power System',
            'gross_amount' => 100000.00,
            'customer_name' => $this->user->name,
        ]);

        $p = SalePayment::create([
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
            'income_distribution_status' => 'completed',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$p->id}/income-allocation");

        $response->assertStatus(422);
        $this->assertStringContainsString('already been allocated', $response->json('message'));

        $this->assertEquals(1, SalePayment::where('sales_record_id', $order->id)->count());
    }

    /**
     * Test Case 6: Full Payment Reconciliation (Section 11)
     * Receive the complete ₹1,00,000 project amount across installments.
     * Expected:
     * - Total Payment Received: ₹1,00,000.
     * - Balance Due: ₹0.
     * - Expected Admin Commission: ₹15,000.
     * - Collected Admin Commission: ₹15,000.
     * - Remaining Admin Commission: ₹0.
     */
    public function test_case_6_full_payment_reconciliation_sums_to_exact_totals(): void
    {
        // 1. Initial Order Creation with ₹20,000 advance
        $order = Order::create([
            'invoice_number' => 'INV-TEST-FULL-' . rand(10000, 99999),
            'item' => 'Solar Power System',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00, // Expected Admin Commission
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
            'status' => 'partial',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
        ]);

        SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        // 2. Second Installment: ₹20,000
        $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 20000.00,
        ])->assertStatus(200);

        // 3. Third Installment: ₹30,000
        $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 30000.00,
        ])->assertStatus(200);

        // 4. Final Installment: ₹30,000
        $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 30000.00,
        ])->assertStatus(200);

        // 5. Final Reconciliation Verification
        $order->refresh();
        $order->load('payments');

        $this->assertCount(4, $order->payments);

        // Formula Check:
        // Total Payment Received = SUM(sale_payments.amount) = 20k + 20k + 30k + 30k = 1,00,000
        $this->assertEquals(100000.00, $order->advance_payment);
        $this->assertEquals(100000.00, $order->total_payment_received);

        // Balance Due = Order Gross - Total Received = 0
        $this->assertEquals(0.00, $order->balance_due);
        $this->assertEquals(0.00, $order->remaining_project_balance);
        $this->assertEquals('completed', $order->status);

        // Expected Admin Commission = 1,00,000 * 15% = 15,000
        $this->assertEquals(15000.00, $order->admin_commission_cut);
        $this->assertEquals(15000.00, $order->expected_admin_cut);

        // Admin Commission Collected = SUM(sale_payments.admin_commission_cut) = 3k + 3k + 4.5k + 4.5k = 15,000
        $this->assertEquals(15000.00, $order->admin_commission_collected);

        // Remaining Admin Commission = Expected - Collected = 0
        $this->assertEquals(0.00, $order->remaining_admin_commission);

        // 6. Excessive payment validation check (cannot pay more than balance due)
        $excessiveResponse = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 5000.00,
        ]);
        $excessiveResponse->assertStatus(400); // Already fully paid
    }

    /**
     * Test Case 7: Existing Historical Data (Section 11)
     * Verify that existing orders, payments, allocation statuses and relationships remain intact.
     */
    public function test_case_7_existing_historical_order_remains_intact(): void
    {
        $historicalOrder = Order::with('payments')->find(1);

        if (!$historicalOrder) {
            $this->markTestSkipped('Historical order #1 not found in local environment.');
        }

        // Verify Historical Order #1 intact
        $this->assertEquals('INV-2026-18470', $historicalOrder->invoice_number);
        $this->assertEquals(35000.00, (float) $historicalOrder->gross_amount);
        $this->assertEquals(20.00, (float) $historicalOrder->admin_commission_percent);
        $this->assertEquals(7000.00, (float) $historicalOrder->admin_commission_cut);
        $this->assertEquals(35000.00, (float) $historicalOrder->advance_payment);
        $this->assertEquals(0.00, (float) $historicalOrder->balance_due);
        $this->assertEquals(7000.00, (float) $historicalOrder->distributed_admin_cut_amount);
        $this->assertEquals('completed', $historicalOrder->income_distribution_status);

        // Verify Historical Payments associated with Order #1
        $payments = $historicalOrder->payments;
        $this->assertCount(3, $payments);
        $this->assertEquals(35000.00, (float) $payments->sum('amount'));
        $this->assertEquals(7000.00, (float) $payments->sum('admin_commission_cut'));
        $this->assertEquals(7000.00, (float) $payments->sum('distributed_admin_cut_amount'));

        // All 3 payments are completed
        foreach ($payments as $payment) {
            $this->assertEquals('completed', $payment->income_distribution_status);
        }
    }
}
