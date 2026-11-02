<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminDistributedPaymentHistoryTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'History Test Admin',
            'username' => 'histadmin_' . uniqid(),
            'email' => 'histadmin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('hist_admin_token', ['admin'])->plainTextToken;

        $this->user = User::first() ?? User::create([
            'name' => 'History Test Buyer',
            'email' => 'histuser_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);
    }

    /**
     * Test 1: Pending Payment (Section 11)
     * Create a pending payment.
     * Expected: It does NOT appear in Payment Receipts & History.
     */
    public function test_1_pending_payment_does_not_appear_in_history(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-HIST1-' . rand(10000, 99999),
            'item' => 'Test Rooftop Solar',
            'gross_amount' => 50000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 7500.00,
            'advance_payment' => 10000.00,
            'balance_due' => 40000.00,
            'status' => 'partial',
            'income_distribution_status' => 'pending',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
        ]);

        $pendingPayment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 10000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 1500.00,
            'net_entity_amount' => 8500.00,
            'payment_type' => 'advance',
            'income_distribution_status' => 'pending',
        ]);

        // Request Admin Payment History
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');

        $response->assertStatus(200);
        $returnedPaymentIds = collect($response->json('payments'))->pluck('id')->all();

        // The pending payment MUST NOT be returned
        $this->assertNotContains($pendingPayment->id, $returnedPaymentIds);
    }

    /**
     * Test 2: Completed Payment (Section 11)
     * Distribute a payment from Order Management.
     * Expected: The same payment ID appears in Payment Receipts & History.
     */
    public function test_2_distributed_payment_appears_with_same_id_in_history(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-HIST2-' . rand(10000, 99999),
            'item' => 'Enterprise CRM Solution',
            'gross_amount' => 60000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 9000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 40000.00,
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

        // Distribute from Order Management
        $distributeResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");
        $distributeResponse->assertStatus(200);

        // Fetch Payment History
        $historyResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $historyResponse->assertStatus(200);

        $returnedPayments = collect($historyResponse->json('payments'));
        $found = $returnedPayments->firstWhere('id', $payment->id);

        $this->assertNotNull($found, "Distributed payment #{$payment->id} must appear in history.");
        $this->assertEquals('completed', $found['income_distribution_status']);
        $this->assertEquals(3000.00, (float) $found['distributed_admin_cut_amount']);
    }

    /**
     * Test 3: Multiple Installments (Section 11)
     * One order has three separate payments.
     * Distribute only the first and third.
     * Expected: Only those two receipts appear. The second remains hidden.
     */
    public function test_3_multiple_installments_show_only_distributed_receipts(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-HIST3-' . rand(10000, 99999),
            'item' => 'Commercial Solar Project',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'advance_payment' => 70000.00,
            'balance_due' => 30000.00,
            'status' => 'partial',
            'income_distribution_status' => 'pending',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
        ]);

        // Payment 1: ₹20,000
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

        // Payment 2: ₹20,000 (Will stay PENDING)
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

        // Payment 3: ₹30,000
        $p3 = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 30000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 4500.00,
            'payment_type' => 'balance',
            'income_distribution_status' => 'pending',
        ]);

        // Distribute Payment 1
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$p1->id}/income-allocation")
            ->assertStatus(200);

        // Distribute Payment 3 (Skip Payment 2)
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$p3->id}/income-allocation")
            ->assertStatus(200);

        // Fetch History
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $response->assertStatus(200);

        $returnedIds = collect($response->json('payments'))->pluck('id')->all();

        // P1 and P3 MUST appear
        $this->assertContains($p1->id, $returnedIds);
        $this->assertContains($p3->id, $returnedIds);

        // P2 MUST NOT appear
        $this->assertNotContains($p2->id, $returnedIds);
    }

    /**
     * Test 4: New Repayment Lifecycle (Section 11)
     * Receive another balance payment against an existing order.
     * Expected:
     * - New sale_payments row created by Entity.
     * - Initially pending, does NOT appear in history.
     * - After Admin distributes it from Order Management, it appears automatically.
     */
    public function test_4_new_repayment_initially_hidden_then_appears_after_distribution(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-HIST4-' . rand(10000, 99999),
            'item' => 'Factory Automation Package',
            'gross_amount' => 80000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 12000.00,
            'advance_payment' => 30000.00,
            'balance_due' => 50000.00,
            'status' => 'partial',
            'income_distribution_status' => 'pending',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
        ]);

        // Entity receives balance payment of ₹20,000
        $receiveResponse = $this->postJson("/api/orders/{$order->id}/receive-balance", [
            'amount' => 20000.00,
            'payment_method' => 'Bank Transfer',
            'notes' => 'Milestone 2 installment',
        ]);
        $receiveResponse->assertStatus(200);

        $newPaymentId = $receiveResponse->json('payment.id');
        $this->assertNotNull($newPaymentId);

        // Initially pending: must NOT appear in history
        $historyBefore = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $this->assertNotContains($newPaymentId, collect($historyBefore->json('payments'))->pluck('id')->all());

        // Admin distributes the new payment from Order Management
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$newPaymentId}/income-allocation")
            ->assertStatus(200);

        // Now it MUST appear in history with the exact same ID
        $historyAfter = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $this->assertContains($newPaymentId, collect($historyAfter->json('payments'))->pluck('id')->all());
    }

    /**
     * Test 5: Read-Only Protection (Section 11)
     * Verify that the history endpoint has no distribution or financial modification side effects.
     */
    public function test_5_history_endpoint_is_strictly_read_only(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-HIST5-' . rand(10000, 99999),
            'item' => 'Solar Battery Bank',
            'gross_amount' => 40000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 6000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 20000.00,
            'status' => 'partial',
            'income_distribution_status' => 'completed',
            'direct_income_amount' => 1200.00,
            'level_income_amount' => 1200.00,
            'reward_income_amount' => 600.00,
            'distributed_admin_cut_amount' => 3000.00,
            'customer_name' => $this->user->name,
        ]);

        $payment = SalePayment::create([
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

        // State snapshot before GET request
        $balanceBefore = $order->fresh()->balance_due;
        $statusBefore = $payment->fresh()->income_distribution_status;
        $distributedAmountBefore = $payment->fresh()->distributed_admin_cut_amount;

        // Perform multiple GET requests to history endpoint
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history')
            ->assertStatus(200);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history?payment_type=advance')
            ->assertStatus(200);

        // State must remain exactly identical
        $this->assertEquals($balanceBefore, $order->fresh()->balance_due);
        $this->assertEquals($statusBefore, $payment->fresh()->income_distribution_status);
        $this->assertEquals($distributedAmountBefore, $payment->fresh()->distributed_admin_cut_amount);
    }

    /**
     * Test 6: No Duplicate Records (Section 11)
     * Compare the number of payment rows before and after Admin distribution.
     * Expected: Distribution must not increase the payment receipt count.
     */
    public function test_6_distribution_does_not_create_duplicate_payment_receipts(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-HIST6-' . rand(10000, 99999),
            'item' => 'Solar Substation Installation',
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

        $countBefore = SalePayment::where('sales_record_id', $order->id)->count();
        $this->assertEquals(1, $countBefore);

        // Execute distribution
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation")
            ->assertStatus(200);

        $countAfter = SalePayment::where('sales_record_id', $order->id)->count();

        // Count MUST be strictly equal: zero new payment rows created
        $this->assertEquals($countBefore, $countAfter);
    }

    /**
     * Test 7: Correct Financial Values (Section 11)
     * Verify that Direct (40%), Level (40%) and Reward (20%) amounts shown in history
     * exactly match the selected payment's saved allocation values.
     */
    public function test_7_correct_financial_values_in_history(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-HIST7-' . rand(10000, 99999),
            'item' => 'High-Capacity Inverter',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'advance_payment' => 20000.00,
            'balance_due' => 80000.00,
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

        // Distribute
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation")
            ->assertStatus(200);

        // Query history
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history');
        $response->assertStatus(200);

        $record = collect($response->json('payments'))->firstWhere('id', $payment->id);

        $this->assertNotNull($record);
        $this->assertEquals(20000.00, (float) $record['amount']);
        $this->assertEquals(15.00, (float) $record['admin_commission_percent']);
        $this->assertEquals(3000.00, (float) $record['admin_commission_cut']);
        $this->assertEquals(1200.00, (float) $record['direct_income_amount']); // 40% of 3000
        $this->assertEquals(1200.00, (float) $record['level_income_amount']);  // 40% of 3000
        $this->assertEquals(600.00, (float) $record['reward_income_amount']);   // 20% of 3000
        $this->assertEquals(3000.00, (float) $record['distributed_admin_cut_amount']);
        $this->assertEquals('completed', $record['income_distribution_status']);

        // Verify the 3 new order-level accounting columns
        $this->assertEquals(100000.00, (float) ($record['total_project_cost'] ?? $record['totalProjectCost']));
        $this->assertEquals(15000.00, (float) ($record['total_admin_amount'] ?? $record['totalAdminAmount']));
        $this->assertEquals(12000.00, (float) ($record['remaining_admin_amount'] ?? $record['remainingAdminAmount']));
    }

    /**
     * Test 8: Order-Level Accounting Columns Match Specification Example
     * Order gross: 1,00,000, 15% rate, expected admin cut: 15,000.
     * Advance payment: 20,000 (admin cut: 3,000) - distributed.
     * Balance payment: 20,000 (admin cut: 3,000) - pending.
     * Total collected admin cut: 6,000 (both advance + balance).
     * Remaining admin amount: 15,000 - 6,000 = 9,000.
     * The distributed receipt belonging to this order displays:
     * - Total Project Cost: 1,00,000
     * - Total Admin Amount: 15,000
     * - Remaining Admin Amount: 9,000
     */
    public function test_8_order_level_accounting_columns_match_specification_example(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-TEST-SPEC8-' . rand(10000, 99999),
            'item' => 'Commercial Solar Grid',
            'gross_amount' => 100000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 15000.00,
            'advance_payment' => 40000.00,
            'balance_due' => 60000.00,
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
            'income_distribution_status' => 'completed',
            'direct_income_amount' => 1200.00,
            'level_income_amount' => 1200.00,
            'reward_income_amount' => 600.00,
            'distributed_admin_cut_amount' => 3000.00,
        ]);

        $p2 = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'customer_name' => $order->customer_name,
            'amount' => 20000.00,
            'admin_commission_percent' => 15.00,
            'admin_commission_cut' => 3000.00,
            'payment_type' => 'balance',
            'income_distribution_status' => 'pending', // Actual payment received but pending distribution
        ]);

        // GET history with status=completed (shows p1)
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/payments/history?status=completed');
        $response->assertStatus(200);

        $record1 = collect($response->json('payments'))->firstWhere('id', $p1->id);
        $this->assertNotNull($record1);

        // Verify Order-Level Accounting on p1 row
        $this->assertEquals(100000.00, (float) ($record1['total_project_cost'] ?? $record1['totalProjectCost']));
        $this->assertEquals(15000.00, (float) ($record1['total_admin_amount'] ?? $record1['totalAdminAmount']));
        // Remaining must be 15,000 - 6,000 = 9,000 (because p2 of 3,000 admin cut was also collected)
        $this->assertEquals(9000.00, (float) ($record1['remaining_admin_amount'] ?? $record1['remainingAdminAmount']));
    }
}