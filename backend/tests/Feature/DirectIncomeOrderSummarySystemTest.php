<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CommissionSetting;
use App\Models\DirectIncome;
use App\Models\DirectIncomeOrderSummary;
use App\Models\Order;
use App\Models\OrderPaymentDump;
use App\Models\SalePayment;
use App\Models\User;
use App\Services\AdminIncomeAllocationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use InvalidArgumentException;
use Tests\TestCase;

class DirectIncomeOrderSummarySystemTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $sponsor;
    protected string $sponsorToken;
    protected User $otherUser;
    protected string $otherUserToken;
    protected User $customer;
    protected AdminIncomeAllocationService $allocationService;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Initialize Global Commission Settings snapshot (40% Direct, 40% Level, 20% Diamond)
        CommissionSetting::updateOrCreate(
            ['setting_key' => 'global'],
            [
                'direct_percent' => 40.00,
                'level_1_percent' => 0.00,
                'level_2_percent' => 16.00,
                'level_3_percent' => 12.00,
                'level_4_percent' => 8.00,
                'level_5_percent' => 4.00,
                'reward_percent' => 20.00,
                'reward_level_1_percent' => 10.00,
                'reward_level_2_percent' => 10.00,
            ]
        );

        // 2. Setup Admin
        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Test Super Admin',
            'username' => 'testadmin_' . uniqid(),
            'email' => 'admin_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);
        $this->adminToken = $this->admin->createToken('admin_test_token', ['admin'])->plainTextToken;

        // 3. Setup Sponsor User (Beneficiary)
        $this->sponsor = User::create([
            'name' => 'Amit Sharma (Sponsor)',
            'email' => 'sponsor_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'SPON_' . rand(10000, 99999),
            'sponsor_id' => 'ROOT',
            'commission_balance' => 0.00,
        ]);
        $this->sponsorToken = $this->sponsor->createToken('user_auth_token')->plainTextToken;

        // 4. Setup Another User (Unrelated member for authorization checks)
        $this->otherUser = User::create([
            'name' => 'Pooja Patel (Other)',
            'email' => 'other_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'OTHR_' . rand(10000, 99999),
            'sponsor_id' => 'ROOT',
            'commission_balance' => 0.00,
        ]);
        $this->otherUserToken = $this->otherUser->createToken('user_auth_token')->plainTextToken;

        // 5. Setup Customer User (Downline of Sponsor)
        $this->customer = User::create([
            'name' => 'Vikram Customer',
            'email' => 'cust_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CUST_' . rand(10000, 99999),
            'sponsor_id' => $this->sponsor->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->allocationService = app(AdminIncomeAllocationService::class);
    }

    /**
     * Helper to create an isolated confirmed Order with an advance payment receipt.
     */
    protected function createTestOrder(float $grossAmount = 100000.0, float $advanceAmount = 40000.0, float $adminCutPercent = 30.0): array
    {
        $expectedCut = round(($grossAmount * $adminCutPercent) / 100, 2);
        $advanceCut = round(($advanceAmount * $adminCutPercent) / 100, 2);
        $balanceDue = max(0.0, round($grossAmount - $advanceAmount, 2));

        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(100000, 999999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Tech Solutions Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->customer->name,
            'customer_user_code' => $this->customer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'item' => 'Custom ERP Software',
            'item_type' => 'service',
            'category' => 'Technology',
            'unit_price' => $grossAmount,
            'quantity' => 1,
            'gross_amount' => $grossAmount,
            'dump_amount' => 0.00,
            'admin_commission_percent' => $adminCutPercent,
            'admin_commission_cut' => $expectedCut,
            'net_entity_payout' => round($grossAmount - $expectedCut, 2),
            'advance_payment' => $advanceAmount,
            'balance_due' => $balanceDue,
            'status' => $balanceDue <= 0 ? 'completed' : 'partial',
            'approval_status' => 'confirmed',
            'income_distribution_status' => 'pending',
            'direct_income_amount' => 0.00,
        ]);

        $advancePayment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => $advanceAmount,
            'admin_commission_percent' => $adminCutPercent,
            'admin_commission_cut' => $advanceCut,
            'net_entity_amount' => round($advanceAmount - $advanceCut, 2),
            'payment_method' => 'UPI / QR Code',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'advance',
            'notes' => 'Advance payment installment',
            'payment_date' => now(),
            'income_distribution_status' => 'pending',
            'direct_income_amount' => 0.00,
        ]);

        return [$order, $advancePayment];
    }

    /**
     * Test A: Installment 1 distribution creates traceable ledger entry and initial summary row.
     */
    public function test_installment_1_distribution_creates_traceable_ledger_and_summary_row(): void
    {
        [$order, $advancePayment] = $this->createTestOrder(100000.0, 40000.0, 30.0);
        // Advance Admin Cut: 40,000 * 30% = 12,000
        // Expected Direct on advance: 12,000 * 40% = 4,800
        // Expected Direct on full order: 30,000 * 40% = 12,000

        $result = $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        $this->assertNotNull($result);
        $this->assertEquals('completed', $result['payment']->income_distribution_status);
        $this->assertEquals(4800.00, $result['payment']->direct_income_amount);

        // 1. Verify Direct Income ledger row has order and payment references
        $ledgerRow = DirectIncome::where('sale_payment_id', $advancePayment->id)->first();
        $this->assertNotNull($ledgerRow, 'Traceable DirectIncome ledger record must exist.');
        $this->assertEquals($order->id, $ledgerRow->order_id);
        $this->assertEquals($advancePayment->id, $ledgerRow->sale_payment_id);
        $this->assertEquals($this->customer->user_code, $ledgerRow->source_user_code);
        $this->assertEquals(40.00, $ledgerRow->percentage);
        $this->assertEquals(4800.00, $ledgerRow->total_amount);
        $this->assertEquals($this->sponsor->user_code, $ledgerRow->user_code);

        // 2. Verify Direct Income Order Summary row
        $summary = DirectIncomeOrderSummary::where('user_id', $this->sponsor->id)
            ->where('order_id', $order->id)
            ->first();

        $this->assertNotNull($summary, 'DirectIncomeOrderSummary row must exist.');
        $this->assertEquals($this->sponsor->user_code, $summary->user_code);
        $this->assertEquals($order->invoice_number, $summary->invoice_number);
        $this->assertEquals(12000.00, $summary->total_expected_amount);
        $this->assertEquals(4800.00, $summary->total_distributed_amount);
        $this->assertEquals(7200.00, $summary->total_pending_amount); // 12000 - 4800 = 7200
        $this->assertEquals(0.00, $summary->total_dump_amount);
        $this->assertEquals(1, $summary->distribution_count);
        $this->assertEquals('partial', $summary->distribution_status);
        $this->assertNotNull($summary->last_distribution_at);
    }

    /**
     * Test B: Second installment updates the exact same summary row without creating a duplicate.
     */
    public function test_second_installment_updates_same_summary_row_and_increments_count(): void
    {
        [$order, $advancePayment] = $this->createTestOrder(100000.0, 40000.0, 30.0);
        $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        // Add second installment: ₹30,000 balance payment
        // Admin Cut: 30,000 * 30% = 9,000
        // Direct Income: 9,000 * 40% = 3,600
        $balancePayment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 30000.00,
            'admin_commission_percent' => 30.00,
            'admin_commission_cut' => 9000.00,
            'net_entity_amount' => 21000.00,
            'payment_method' => 'UPI / PhonePe',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'balance',
            'notes' => 'Balance payment installment 2',
            'payment_date' => now(),
            'income_distribution_status' => 'pending',
            'direct_income_amount' => 0.00,
        ]);

        $order->update([
            'advance_payment' => 70000.00,
            'balance_due' => 30000.00,
        ]);

        // Allocate installment 2
        $this->allocationService->allocatePaymentIncome($balancePayment->id, $this->admin->id);

        // 1. Verify two distinct DirectIncome ledger records exist
        $ledgerCount = DirectIncome::where('order_id', $order->id)->count();
        $this->assertEquals(2, $ledgerCount, 'Must have 2 distinct ledger entries for the 2 installments.');

        // 2. Verify EXACTLY ONE DirectIncomeOrderSummary row exists for this order
        $summaryCount = DirectIncomeOrderSummary::where('user_id', $this->sponsor->id)
            ->where('order_id', $order->id)
            ->count();
        $this->assertEquals(1, $summaryCount, 'There must be strictly ONE summary row for the order.');

        $summary = DirectIncomeOrderSummary::where('user_id', $this->sponsor->id)
            ->where('order_id', $order->id)
            ->first();

        // Cumulative distributed = 4,800 + 3,600 = 8,400
        // Remaining pending = 12,000 - 8,400 = 3,600
        $this->assertEquals(8400.00, $summary->total_distributed_amount);
        $this->assertEquals(3600.00, $summary->total_pending_amount);
        $this->assertEquals(2, $summary->distribution_count);
        $this->assertEquals('partial', $summary->distribution_status);
    }

    /**
     * Test C: Duplicate distribution protection prevents duplicate credits and summary inflation.
     */
    public function test_duplicate_payment_distribution_protection(): void
    {
        [$order, $advancePayment] = $this->createTestOrder(100000.0, 40000.0, 30.0);
        $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        $initialWallet = (float) $this->sponsor->fresh()->commission_balance;
        $initialLedgerCount = DirectIncome::where('order_id', $order->id)->count();
        $initialSummary = DirectIncomeOrderSummary::where('order_id', $order->id)->first();

        // Attempting to distribute the exact same payment again MUST fail
        $this->expectException(InvalidArgumentException::class);
        $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        // Ensure wallet balance and summary did not change
        $this->assertEquals($initialWallet, (float) $this->sponsor->fresh()->commission_balance);
        $this->assertEquals($initialLedgerCount, DirectIncome::where('order_id', $order->id)->count());
        $this->assertEquals($initialSummary->total_distributed_amount, $initialSummary->fresh()->total_distributed_amount);
        $this->assertEquals(1, $initialSummary->fresh()->distribution_count);
    }

    /**
     * Test D: Dump payment write-off updates summary without creating cash direct income.
     */
    public function test_approved_dump_updates_summary_without_crediting_cash(): void
    {
        [$order, $advancePayment] = $this->createTestOrder(100000.0, 40000.0, 30.0);
        $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        $initialWallet = (float) $this->sponsor->fresh()->commission_balance;
        $initialLedgerCount = DirectIncome::where('order_id', $order->id)->count();

        // Order has gross 100,000, advance 40,000, balance 60,000.
        // Entity reports dump of ₹20,000.
        // Dump Admin Cut: 20,000 * 30% = 6,000.
        // Direct portion of Dump: 6,000 * 40% = 2,400.
        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_id' => $order->entity_id,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'dump_amount' => 20000.00,
            'admin_commission_percent' => 30.00,
            'admin_commission_cut' => 6000.00,
            'direct_income_amount' => 2400.00,
            'level_income_amount' => 2400.00,
            'reward_income_amount' => 1200.00,
            'dump_reason' => 'Client uncontactable for remaining milestone balance',
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        // Prior to approval, summary total_dump_amount MUST remain 0.00
        $this->allocationService->syncOrderDirectIncomeSummary($order);
        $summaryBefore = DirectIncomeOrderSummary::where('order_id', $order->id)->first();
        $this->assertEquals(0.00, $summaryBefore->total_dump_amount);

        // Admin approves dump via controller endpoint
        $response = $this->withHeaders(['Authorization' => "Bearer {$this->adminToken}"])
            ->postJson("/api/admin/dump-requests/{$dump->id}/approve");

        $response->assertStatus(200);

        // 1. Verify Dump record is approved
        $this->assertEquals('approved', $dump->fresh()->status);

        // 2. Verify summary is updated with dump write-off
        $summaryAfter = DirectIncomeOrderSummary::where('order_id', $order->id)->first();
        $this->assertEquals(2400.00, $summaryAfter->total_dump_amount);
        // Expected = 12,000; Distributed = 4,800; Dump = 2,400.
        // Pending = 12,000 - 4,800 - 2,400 = 4,800.
        $this->assertEquals(4800.00, $summaryAfter->total_pending_amount);

        // 3. Verify Dump NEVER created cash Direct Income or Wallet credits
        $this->assertEquals($initialWallet, (float) $this->sponsor->fresh()->commission_balance);
        $this->assertEquals($initialLedgerCount, DirectIncome::where('order_id', $order->id)->count());
    }

    /**
     * Test E: User can fetch paginated Order-wise Direct Income summaries.
     */
    public function test_user_can_fetch_paginated_order_summaries(): void
    {
        [$order, $advancePayment] = $this->createTestOrder(100000.0, 40000.0, 30.0);
        $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        $response = $this->withHeaders(['Authorization' => "Bearer {$this->sponsorToken}"])
            ->getJson('/api/user/income/direct-orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'user' => ['id', 'user_code', 'name'],
                'summary' => [
                    'total_orders',
                    'total_expected_direct_income',
                    'total_received_direct_income',
                    'total_pending_direct_income',
                    'total_dump_direct_income',
                ],
                'orders' => [
                    '*' => [
                        'order_id',
                        'invoice_number',
                        'item_name',
                        'source_user_code',
                        'source_user_name',
                        'total_expected_amount',
                        'total_distributed_amount',
                        'total_pending_amount',
                        'total_dump_amount',
                        'distribution_count',
                        'distribution_status',
                    ],
                ],
                'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $ordersList = $response->json('orders');
        $this->assertNotEmpty($ordersList);
        $this->assertEquals($order->id, $ordersList[0]['order_id']);
        $this->assertEquals(4800.00, $ordersList[0]['total_distributed_amount']);
    }

    /**
     * Test F: User can fetch detailed installment history for the "View Full Details" popup.
     */
    public function test_user_can_fetch_order_distribution_details(): void
    {
        [$order, $advancePayment] = $this->createTestOrder(100000.0, 40000.0, 30.0);
        $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        $response = $this->withHeaders(['Authorization' => "Bearer {$this->sponsorToken}"])
            ->getJson("/api/user/income/direct-orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'order' => [
                    'id',
                    'invoice_number',
                    'item_name',
                    'order_gross_amount',
                    'expected_direct_income',
                    'received_direct_income',
                    'pending_direct_income',
                    'dump_direct_income',
                    'distribution_status',
                ],
                'distributions' => [
                    '*' => [
                        'payment_id',
                        'installment_type',
                        'reference_no',
                        'payment_amount',
                        'admin_commission_cut',
                        'direct_income_amount',
                        'distribution_status',
                    ],
                ],
                'pending_installments',
                'dump_records',
            ]);

        $distributions = $response->json('distributions');
        $this->assertCount(1, $distributions);
        $this->assertEquals($advancePayment->id, $distributions[0]['payment_id']);
        $this->assertEquals(4800.00, $distributions[0]['direct_income_amount']);
    }

    /**
     * Test G: Strict ownership authorization blocks unauthorized users from viewing another user's order details.
     */
    public function test_unauthorized_user_cannot_access_another_members_order_details(): void
    {
        [$order, $advancePayment] = $this->createTestOrder(100000.0, 40000.0, 30.0);
        $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        // Other user attempts to view sponsor's order details -> MUST be rejected with 403
        $response = $this->withHeaders(['Authorization' => "Bearer {$this->otherUserToken}"])
            ->getJson("/api/user/income/direct-orders/{$order->id}");

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Unauthorized. You are not eligible to view Direct Income details for this order.',
            ]);

        // Unauthenticated request -> MUST return 401
        $this->flushHeaders();
        auth('sanctum')->forgetUser();
        auth()->forgetGuards();
        $unauthResponse = $this->getJson("/api/user/income/direct-orders/{$order->id}");
        $unauthResponse->assertStatus(401);
    }

    /**
     * Test H: Reconciliation Artisan Command dry-run and execution work as expected.
     */
    public function test_reconciliation_artisan_command(): void
    {
        [$order, $advancePayment] = $this->createTestOrder(100000.0, 40000.0, 30.0);
        $this->allocationService->allocatePaymentIncome($advancePayment->id, $this->admin->id);

        // Dry-run execution
        $this->artisan('direct-income:reconcile-summaries', ['--dry-run' => true])
            ->assertSuccessful();

        // Scoped execution by order
        $this->artisan('direct-income:reconcile-summaries', ['--order' => $order->id])
            ->assertSuccessful();

        // Verify summary remains intact and accurate
        $summary = DirectIncomeOrderSummary::where('order_id', $order->id)->first();
        $this->assertNotNull($summary);
        $this->assertEquals(4800.00, $summary->total_distributed_amount);
    }
}
