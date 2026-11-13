<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\CommissionSetting;
use App\Models\DirectIncome;
use App\Models\DirectIncomeOrderSummary;
use App\Models\Order;
use App\Models\OrderPaymentDump;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\WalletTransfer;
use App\Services\AdminIncomeAllocationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminDirectIncomeReportingSystemTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $sponsor;
    protected string $userToken;
    protected User $customer;
    protected BusinessEntity $entity;
    protected string $entityToken;
    protected AdminIncomeAllocationService $allocationService;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Ensure Global Commission Settings snapshot exists (40% Direct, 40% Level, 20% Diamond)
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

        // 2. Setup Active Admin
        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Global Super Admin',
            'username' => 'globaladmin_' . uniqid(),
            'email' => 'admin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);
        $this->adminToken = $this->admin->createToken('admin_auth_token', ['admin'])->plainTextToken;

        // 3. Setup Regular Member User (Non-Admin)
        $this->sponsor = User::create([
            'name' => 'Rajesh Beneficiary',
            'email' => 'rajesh_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'SPON_' . rand(10000, 99999),
            'sponsor_id' => 'ROOT',
            'commission_balance' => 0.00,
        ]);
        $this->userToken = $this->sponsor->createToken('user_token')->plainTextToken;

        // 4. Setup Customer User
        $this->customer = User::create([
            'name' => 'Sunil Buyer',
            'email' => 'sunil_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'BUY_' . rand(10000, 99999),
            'sponsor_id' => $this->sponsor->user_code,
            'commission_balance' => 0.00,
        ]);

        // 5. Setup Business Entity
        $this->entity = BusinessEntity::create([
            'entity_category_id' => 1,
            'name' => 'Acme Corporation ' . rand(100, 999),
            'owner_name' => 'Acme Owner',
            'email' => 'entity_' . uniqid() . '@example.com',
            'phone' => '9876543210',
            'password' => bcrypt('password123'),
            'verification_status' => 'verified',
            'featured' => 1,
        ]);
        $this->entityToken = $this->entity->createToken('entity_token')->plainTextToken;

        $this->allocationService = app(AdminIncomeAllocationService::class);
    }

    /**
     * Helper to create a confirmed order with an advance payment receipt.
     */
    protected function createOrderWithAdvance(float $gross = 100000.0, float $advance = 40000.0, float $adminCutPct = 30.0): array
    {
        $expectedCut = round(($gross * $adminCutPct) / 100, 2);
        $advanceCut = round(($advance * $adminCutPct) / 100, 2);
        $balance = max(0.0, round($gross - $advance, 2));

        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(100000, 999999),
            'date' => now()->toDateString(),
            'entity_id' => $this->entity->id,
            'entity_name' => $this->entity->name,
            'entity_type' => 'business',
            'customer_name' => $this->customer->name,
            'customer_user_code' => $this->customer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'item' => 'Enterprise Cloud Suite',
            'item_type' => 'service',
            'category' => 'Cloud Computing',
            'unit_price' => $gross,
            'quantity' => 1,
            'gross_amount' => $gross,
            'advance_payment' => $advance,
            'balance_due' => $balance,
            'admin_commission_percent' => $adminCutPct,
            'admin_commission_cut' => $expectedCut,
            'status' => 'partial',
            'approval_status' => 'confirmed',
            'admin_confirmed_by' => $this->admin->id,
            'admin_confirmed_at' => now(),
            'income_distribution_status' => 'pending',
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $this->sponsor->user_code,
            'amount' => $advance,
            'admin_commission_percent' => $adminCutPct,
            'admin_commission_cut' => $advanceCut,
            'net_entity_amount' => round($advance - $advanceCut, 2),
            'direct_income_amount' => 0.00,
            'income_distribution_status' => 'pending',
            'payment_type' => 'advance',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_method' => 'UPI / QR Code',
            'payment_date' => now(),
        ]);

        return ['order' => $order, 'payment' => $payment];
    }

    // =========================================================================
    // 1. AUTHENTICATION & ACCESS CONTROL
    // =========================================================================

    public function test_01_unauthenticated_request_is_rejected_with_401(): void
    {
        $response = $this->getJson('/api/admin/income/direct-overview');
        $response->assertStatus(401);

        $responseList = $this->getJson('/api/admin/income/direct-orders');
        $responseList->assertStatus(401);

        $responseDetails = $this->getJson('/api/admin/income/direct-orders/1');
        $responseDetails->assertStatus(401);
    }

    public function test_02_normal_user_token_is_rejected_with_403(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->userToken)
            ->getJson('/api/admin/income/direct-overview');
        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'error',
            'message' => 'Forbidden. Admin credentials required to access global Direct Income reporting.',
        ]);
    }

    public function test_03_entity_token_is_rejected_with_403(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->entityToken)
            ->getJson('/api/admin/income/direct-overview');
        $response->assertStatus(403);
    }

    public function test_04_authorized_admin_token_is_accepted_with_200(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-overview');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'metrics' => [
                'total_eligible_orders',
                'total_expected_direct_income',
                'total_distributed_direct_income',
                'total_pending_direct_income',
                'total_dump_direct_income',
                'total_distributions_count',
                'total_beneficiaries_count',
                'completion_percentage',
                'orders_by_status',
                'reconciliation',
            ],
        ]);
    }

    // =========================================================================
    // 2. GLOBAL OVERVIEW & DOUBLE COUNTING PREVENTION
    // =========================================================================

    public function test_05_global_kpi_totals_are_accurate_and_not_double_counted(): void
    {
        // Create an order with 2 installment distributions
        $data = $this->createOrderWithAdvance(100000.0, 40000.0, 30.0);
        $order = $data['order'];
        $payment1 = $data['payment'];

        // Allocate Installment 1: Admin Cut ₹12,000 -> Direct ₹4,800
        $this->allocationService->allocatePaymentIncome($payment1->id, $this->admin->id);

        // Add Installment 2: ₹20,000 -> Admin Cut ₹6,000 -> Direct ₹2,400
        $payment2 = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $this->sponsor->user_code,
            'amount' => 20000.00,
            'admin_commission_percent' => 30.0,
            'admin_commission_cut' => 6000.00,
            'net_entity_amount' => 14000.00,
            'direct_income_amount' => 0.00,
            'income_distribution_status' => 'pending',
            'payment_type' => 'balance',
            'reference_no' => 'UTR-TEST-2',
            'payment_date' => now(),
        ]);
        $this->allocationService->allocatePaymentIncome($payment2->id, $this->admin->id);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-overview');

        $response->assertStatus(200);
        $metrics = $response->json('metrics');

        $this->assertGreaterThanOrEqual(1, $metrics['total_eligible_orders']);
        $this->assertGreaterThanOrEqual(7200.00, $metrics['total_distributed_direct_income']);
        $this->assertGreaterThanOrEqual(2, $metrics['total_distributions_count']);
        $this->assertTrue($metrics['reconciliation']['is_reconciled']);
        $this->assertEquals(0.00, $metrics['reconciliation']['reconciliation_difference']);
    }

    public function test_06_reconciliation_totals_match_underlying_ledgers(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-overview');

        $response->assertStatus(200);
        $rec = $response->json('metrics.reconciliation');

        $this->assertArrayHasKey('summary_distributed_total', $rec);
        $this->assertArrayHasKey('sale_payments_distributed_total', $rec);
        $this->assertArrayHasKey('direct_incomes_ledger_total', $rec);
        $this->assertArrayHasKey('wallet_transfers_credit_total', $rec);
        $this->assertArrayHasKey('status', $rec);

        // Verify summary matches completed sale payments and direct_incomes ledger
        $this->assertEquals($rec['summary_distributed_total'], $rec['sale_payments_distributed_total']);
        $this->assertEquals($rec['summary_distributed_total'], $rec['direct_incomes_ledger_total']);
    }

    // =========================================================================
    // 3. GLOBAL ORDER-WISE LISTING & FILTERS
    // =========================================================================

    public function test_07_global_orders_list_returns_one_row_per_order(): void
    {
        $data = $this->createOrderWithAdvance(90000.0, 30000.0, 30.0);
        $this->allocationService->allocatePaymentIncome($data['payment']->id, $this->admin->id);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders');

        $response->assertStatus(200);
        $orders = $response->json('data');

        $this->assertIsArray($orders);
        $orderIds = array_column($orders, 'order_id');
        $this->assertEquals(count($orderIds), count(array_unique($orderIds)), 'Each order must appear exactly once in the list.');
    }

    public function test_08_filters_by_distribution_status(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders?status=partial');

        $response->assertStatus(200);
        $orders = $response->json('data');

        foreach ($orders as $ord) {
            $this->assertEquals('partial', $ord['distribution_status']);
        }
    }

    public function test_09_search_by_invoice_number_and_buyer_code(): void
    {
        $data = $this->createOrderWithAdvance(50000.0, 20000.0, 25.0);
        $order = $data['order'];
        $this->allocationService->allocatePaymentIncome($data['payment']->id, $this->admin->id);

        // Search by Invoice Number
        $resInvoice = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders?search=' . $order->invoice_number);
        $resInvoice->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($resInvoice->json('data')));
        $this->assertEquals($order->invoice_number, $resInvoice->json('data.0.invoice_number'));

        // Search by Buyer User Code
        $resBuyer = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders?search=' . $this->customer->user_code);
        $resBuyer->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($resBuyer->json('data')));
    }

    public function test_10_filters_by_sponsor_and_entity(): void
    {
        $data = $this->createOrderWithAdvance(60000.0, 30000.0, 20.0);
        $this->allocationService->allocatePaymentIncome($data['payment']->id, $this->admin->id);

        // Filter by Sponsor Code
        $resSponsor = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders?sponsor_id=' . $this->sponsor->user_code);
        $resSponsor->assertStatus(200);
        foreach ($resSponsor->json('data') as $row) {
            $this->assertEquals($this->sponsor->user_code, $row['sponsor_user_code']);
        }

        // Filter by Entity ID
        $resEntity = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders?entity_id=' . $this->entity->id);
        $resEntity->assertStatus(200);
        foreach ($resEntity->json('data') as $row) {
            $this->assertEquals($this->entity->id, $row['entity_id']);
        }
    }

    public function test_11_pagination_and_sorting_work(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders?per_page=10&page=1&sort_by=highest_gross&sort_order=desc');

        $response->assertStatus(200);
        $pagination = $response->json('pagination');

        $this->assertEquals(1, $pagination['current_page']);
        $this->assertEquals(10, $pagination['per_page']);
        $this->assertArrayHasKey('total', $pagination);

        $data = $response->json('data');
        if (count($data) >= 2) {
            $this->assertGreaterThanOrEqual($data[1]['order_gross_amount'], $data[0]['order_gross_amount']);
        }
    }

    // =========================================================================
    // 4. ORDER DRILL-DOWN DETAILS
    // =========================================================================

    public function test_12_order_direct_income_details_returns_complete_lifecycle(): void
    {
        $data = $this->createOrderWithAdvance(90000.0, 40000.0, 30.0);
        $order = $data['order'];
        $payment = $data['payment'];
        $this->allocationService->allocatePaymentIncome($payment->id, $this->admin->id);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders/' . $order->id);

        $response->assertStatus(200);
        $res = $response->json();

        // 1. Order Context
        $this->assertEquals($order->id, $res['order']['order_id']);
        $this->assertEquals($order->invoice_number, $res['order']['invoice_number']);
        $this->assertEquals($this->sponsor->user_code, $res['order']['sponsor']['user_code']);
        $this->assertEquals($this->customer->user_code, $res['order']['buyer']['user_code']);

        // 2. Parent Order Financials
        $this->assertEquals(90000.00, $res['parent_order_financials']['order_gross_amount']);
        $this->assertEquals(30.00, $res['parent_order_financials']['admin_commission_percent']);

        // 3. Direct Income Summary (40% of ₹27,000 = ₹10,800 expected, ₹4,800 received)
        $this->assertEquals(10800.00, $res['direct_income_summary']['expected_direct_income']);
        $this->assertEquals(4800.00, $res['direct_income_summary']['total_distributed_direct_income']);
        $this->assertEquals(6000.00, $res['direct_income_summary']['pending_direct_income']);
        $this->assertEquals(1, $res['direct_income_summary']['distribution_count']);

        // 4. Installment distributions
        $this->assertCount(1, $res['distributions']);
        $this->assertEquals(4800.00, $res['distributions'][0]['direct_income_amount']);
        $this->assertEquals($payment->reference_no, $res['distributions'][0]['reference_no']);

        // 5. Ledger & Wallet trace
        $this->assertNotEmpty($res['ledger_entries']);
        $this->assertEquals(4800.00, $res['ledger_entries'][0]['credited_amount']);
        $this->assertEquals('verified', $res['ledger_entries'][0]['trace_status']);

        // 6. Reconciliation
        $this->assertEquals('Reconciled', $res['reconciliation']['status']);
        $this->assertEquals(0.00, $res['reconciliation']['difference']);
    }

    public function test_13_approved_dump_is_shown_separately_and_reduces_pending(): void
    {
        $data = $this->createOrderWithAdvance(100000.0, 40000.0, 30.0);
        $order = $data['order'];
        $this->allocationService->allocatePaymentIncome($data['payment']->id, $this->admin->id);

        // Create an Approved Dump of ₹20,000 (Admin Cut ₹6,000 -> Direct Write-Off ₹2,400)
        $dump = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_id' => $this->entity->id,
            'entity_name' => $this->entity->name,
            'customer_name' => $this->customer->name,
            'customer_user_code' => $this->customer->user_code,
            'dump_amount' => 20000.00,
            'admin_commission_percent' => 30.00,
            'admin_commission_cut' => 6000.00,
            'direct_income_amount' => 2400.00,
            'level_income_amount' => 2400.00,
            'reward_income_amount' => 1200.00,
            'dump_reason' => 'Customer project scope cancelled',
            'status' => 'approved',
            'approved_by' => $this->admin->id,
            'approved_at' => now(),
        ]);

        // Sync summary
        $this->allocationService->syncOrderDirectIncomeSummary($order->fresh());

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders/' . $order->id);

        $response->assertStatus(200);
        $res = $response->json();

        $this->assertEquals(2400.00, $res['direct_income_summary']['approved_dump_direct_income']);
        $this->assertNotEmpty($res['approved_dump_records']);
        $this->assertEquals(20000.00, $res['approved_dump_records'][0]['dump_amount']);
        $this->assertEquals(2400.00, $res['approved_dump_records'][0]['direct_income_amount']);

        // Expected (₹12,000) = Distributed (₹4,800) + Dump (₹2,400) + Pending (₹4,800)
        $this->assertEquals(4800.00, $res['direct_income_summary']['pending_direct_income']);
    }

    public function test_14_non_existent_order_returns_404(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/admin/income/direct-orders/99999999');

        $response->assertStatus(404);
        $response->assertJson([
            'status' => 'error',
            'message' => 'Order #99999999 not found in database.',
        ]);
    }

    // =========================================================================
    // 5. DATA INTEGRITY & ZERO-MUTATION ENFORCEMENT
    // =========================================================================

    public function test_15_reporting_apis_never_create_income_or_mutate_wallets(): void
    {
        $directIncomeCountBefore = DirectIncome::count();
        $walletTransfersCountBefore = WalletTransfer::count();
        $sponsorWalletBefore = (float) $this->sponsor->fresh()->commission_balance;

        // Call all three reporting APIs
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)->getJson('/api/admin/income/direct-overview');
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)->getJson('/api/admin/income/direct-orders');
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)->getJson('/api/admin/income/direct-orders/1');

        // Confirm zero database mutations in financial ledgers
        $this->assertEquals($directIncomeCountBefore, DirectIncome::count());
        $this->assertEquals($walletTransfersCountBefore, WalletTransfer::count());
        $this->assertEquals($sponsorWalletBefore, (float) $this->sponsor->fresh()->commission_balance);
    }
}
