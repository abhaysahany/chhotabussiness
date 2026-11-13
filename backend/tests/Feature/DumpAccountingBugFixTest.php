<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\DirectIncome;
use App\Models\LevelIncome;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\UserPayout;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class DumpAccountingBugFixTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $user;
    protected User $sponsor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Test Super Admin',
            'username' => 'testadmin_' . uniqid(),
            'email' => 'testadmin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        $this->adminToken = $this->admin->createToken('test_admin_token', ['admin'])->plainTextToken;

        $this->sponsor = User::where('user_code', 'CB100001')->first() ?? User::create([
            'name' => 'Sponsor User',
            'email' => 'sponsor_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'sponsor_id' => 'Root',
            'commission_balance' => 0.00,
        ]);

        $this->user = User::create([
            'name' => 'Buyer Member ' . uniqid(),
            'email' => 'buyer_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'sponsor_id' => $this->sponsor->user_code,
            'commission_balance' => 0.00,
        ]);
    }

    /**
     * Bug 1 Fix: Legacy PUT & POST /api/admin/orders/{id}/dump-amount must return 410 Gone
     * and must NEVER overwrite or mutate orders.dump_amount.
     */
    public function test_bug1_legacy_manual_dump_api_returns_410_gone_and_preserves_order_dump_amount(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-BUG1-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Skyline Technologies Pvt Ltd',
            'entity_type' => 'business',
            'customer_name' => $this->user->name,
            'customer_user_code' => $this->user->user_code,
            'customer' => "{$this->user->name} ({$this->user->user_code})",
            'sponsor' => $this->sponsor->user_code,
            'item' => 'Package Standard',
            'item_type' => 'service',
            'gross_amount' => 50000.00,
            'advance_payment' => 10000.00,
            'balance_due' => 40000.00,
            'admin_commission_percent' => 10.0,
            'admin_commission_cut' => 1000.00,
            'status' => 'partial',
            'dump_amount' => 0.00,
            'income_distribution_status' => 'pending',
        ]);

        // Attempt PUT to legacy endpoint
        $putRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->putJson("/api/admin/orders/{$order->id}/dump-amount", [
                'dump_amount' => 15000.00,
            ]);

        $putRes->assertStatus(410);
        $putRes->assertJsonFragment([
            'status' => 'error',
        ]);
        $this->assertStringContainsString('disabled', $putRes->json('message'));

        $order->refresh();
        $this->assertEquals(0.00, (float) $order->dump_amount, 'Order dump_amount must remain untouched at 0.00');

        // Attempt POST to legacy fallback endpoint
        $postRes = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/orders/{$order->id}/dump-amount", [
                'dump_amount' => 20000.00,
            ]);

        $postRes->assertStatus(410);
        $order->refresh();
        $this->assertEquals(0.00, (float) $order->dump_amount, 'Order dump_amount must still remain untouched at 0.00');
    }

    /**
     * Bug 2 Fix: directIncome() and levelIncome() helpers must NEVER copy the parent
     * order's dump amount into direct_incomes.dump_amount or level_incomes.dump_amount.
     */
    public function test_bug2_income_helpers_do_not_store_order_dump_amount(): void
    {
        require_once app_path('Helpers/admin_function.php');

        // 1. Direct Income Helper: Ensure dump_amount is strictly 0.00 even if passed a non-zero parameter
        $directRecord = \directIncome(
            $this->sponsor->user_code,
            $this->user->user_code,
            400.00,
            2500.00 // Even if legacy parameter is passed
        );

        $this->assertNotNull($directRecord);
        $this->assertEquals(0.00, (float) $directRecord->dump_amount, 'Direct income dump_amount must strictly be 0.00');

        // 2. Level Income Helper: Create a multi-tier upline structure
        $level2User = User::create([
            'name' => 'Level 2 User ' . uniqid(),
            'email' => 'upline2_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
            'sponsor_id' => 'Root',
            'commission_balance' => 0.00,
        ]);

        $this->sponsor->sponsor_id = $level2User->user_code;
        $this->sponsor->save();

        $levelRecords = \levelIncome(
            $this->user->user_code,
            400.00,
            2500.00 // Even if legacy parameter is passed
        );

        $this->assertNotEmpty($levelRecords);
        foreach ($levelRecords as $lvl) {
            $this->assertEquals(0.00, (float) $lvl->dump_amount, "Level income for level {$lvl->level} must strictly be 0.00");
        }
    }

    /**
     * Bug 3 Fix: Entity payout endpoints must NOT fabricate an arbitrary 15% dump amount.
     * All payout dump_amount values and summaries must return 0.00.
     */
    public function test_bug3_entity_payouts_do_not_fabricate_15_percent_dump_amount(): void
    {
        $testEntityName = 'Skyline Technologies Pvt Ltd';

        // Create a test payout for this entity
        $payout = UserPayout::create([
            'payout_code' => 'PO-TEST-' . rand(10000, 99999),
            'member_name' => $testEntityName,
            'user_code' => 'ENT-' . rand(1000, 9999),
            'requested_amount' => 10000.00,
            'gross_amount' => 10000.00,
            'tds_rate' => 5.0,
            'tds_deduction' => 500.00,
            'admin_processing_fee' => 0.00,
            'net_payable_amount' => 9500.00,
            'wallet_balance_before' => 50000.00,
            'payment_method' => 'Bank Transfer (NEFT)',
            'bank_name' => 'HDFC Bank Ltd',
            'account_number' => '123456789012',
            'ifsc_code' => 'HDFC0001234',
            'status' => 'pending', // Was previously triggering $requested_amount * 0.15
            'request_date' => now(),
        ]);

        // Query Entity Payouts Index
        $indexRes = $this->getJson("/api/entity/payouts?entity=" . urlencode($testEntityName));
        $indexRes->assertStatus(200);

        $summary = $indexRes->json('summary');
        $this->assertEquals(0.00, (float) $summary['dump_amount'], 'Summary dump_amount must be 0.00');

        $payouts = collect($indexRes->json('payouts'));
        $target = $payouts->firstWhere('id', $payout->id);
        $this->assertNotNull($target);
        $this->assertEquals(0.00, (float) $target['dump_amount'], 'Payout item dump_amount must be 0.00, NOT 15% (1,500.00)');
        $this->assertEquals(0.00, (float) $target['dumpAmount'], 'Payout item dumpAmount must be 0.00, NOT 15% (1,500.00)');

        // Query Entity Payout Reports
        $reportsRes = $this->getJson("/api/entity/payouts/reports?entity=" . urlencode($testEntityName));
        $reportsRes->assertStatus(200);

        $reportSummary = $reportsRes->json('summary');
        $this->assertEquals(0.00, (float) $reportSummary['dump_amount'], 'Reports summary dump_amount must be 0.00');

        $monthlyTrend = collect($reportsRes->json('monthly_trend'));
        foreach ($monthlyTrend as $m) {
            $this->assertEquals(0.0, (float) $m['dump'], 'Monthly trend dump must be 0.0');
        }
    }

    /**
     * Historical Preservation Check: Orders #376, #554, #702 must maintain their existing historical data.
     */
    public function test_historical_orders_are_preserved(): void
    {
        $order376 = Order::find(376);
        if ($order376) {
            $this->assertEquals(2000.00, (float) $order376->dump_amount, 'Order #376 historical dump_amount must be preserved at ₹2,000.00');
        }

        $order554 = Order::find(554);
        if ($order554) {
            $this->assertEquals(1750.00, (float) $order554->dump_amount, 'Order #554 historical dump_amount must be preserved at ₹1,750.00');
        }

        $order702 = Order::find(702);
        if ($order702) {
            $this->assertEquals(1750.00, (float) $order702->dump_amount, 'Order #702 historical dump_amount must be preserved at ₹1,750.00');
        }
    }
}
