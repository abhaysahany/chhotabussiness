<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\LevelIncome;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\WalletTransfer;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class LevelIncomeDistributionTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $userL5;
    protected User $userL4;
    protected User $userL3;
    protected User $userL2;
    protected User $userL1;
    protected User $buyer;

    protected function setUp(): void
    {
        parent::setUp();

        // Admin
        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Admin Level Test',
            'username' => 'admin_level_' . uniqid(),
            'email' => 'admin_lvl_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);
        $this->adminToken = $this->admin->createToken('admin_test_lvl', ['admin'])->plainTextToken;

        // Hierarchy Setup:
        // Root -> UserL5 -> UserL4 -> UserL3 -> UserL2 -> UserL1 (Direct Sponsor) -> Buyer
        $this->userL5 = User::create([
            'name' => 'Level 5 Sponsor',
            'email' => 'l5_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'L5_' . rand(10000, 99999),
            'sponsor_id' => 'Root',
            'commission_balance' => 0.00,
        ]);

        $this->userL4 = User::create([
            'name' => 'Level 4 Sponsor',
            'email' => 'l4_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'L4_' . rand(10000, 99999),
            'sponsor_id' => $this->userL5->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->userL3 = User::create([
            'name' => 'Level 3 Sponsor',
            'email' => 'l3_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'L3_' . rand(10000, 99999),
            'sponsor_id' => $this->userL4->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->userL2 = User::create([
            'name' => 'Level 2 Sponsor',
            'email' => 'l2_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'L2_' . rand(10000, 99999),
            'sponsor_id' => $this->userL3->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->userL1 = User::create([
            'name' => 'Level 1 Direct Sponsor',
            'email' => 'l1_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'L1_' . rand(10000, 99999),
            'sponsor_id' => $this->userL2->user_code,
            'commission_balance' => 0.00,
        ]);

        $this->buyer = User::create([
            'name' => 'Buyer Customer',
            'email' => 'buyer_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'BUYER_' . rand(10000, 99999),
            'sponsor_id' => $this->userL1->user_code,
            'commission_balance' => 0.00,
        ]);
    }

    /**
     * Test 1: levelIncome() distributes 40%, 30%, 20%, 10% across levels 2-5, skips level 1.
     */
    public function test_level_income_helper_distributes_correct_percentages(): void
    {
        $levelPool = 4000.00; // e.g. 40% of 10,000 Admin Cut
        $dumpAmount = 50.00;

        $created = levelIncome($this->buyer->user_code, $levelPool, $dumpAmount);

        // Expect 4 records for Level 2, 3, 4, 5
        $this->assertCount(4, $created);

        // Level 1 must receive ZERO Level Income
        $l1Income = LevelIncome::where('user_code', $this->userL1->user_code)->count();
        $this->assertEquals(0, $l1Income);
        $this->userL1->refresh();
        $this->assertEquals(0.00, (float) $this->userL1->commission_balance);

        // Level 2 receives 40% of 4000 = 1600
        $this->userL2->refresh();
        $this->assertEquals(1600.00, (float) $this->userL2->commission_balance);
        $l2Record = LevelIncome::where('user_code', $this->userL2->user_code)->where('level', '2')->first();
        $this->assertNotNull($l2Record);
        $this->assertEquals(1600.00, (float) $l2Record->total_amount);
        $this->assertEquals(1600.00, (float) $l2Record->paid_amount);
        $this->assertEquals(0.00, (float) $l2Record->balance_amount);
        $this->assertEquals($dumpAmount, (float) $l2Record->dump_amount);

        // Level 3 receives 30% of 4000 = 1200
        $this->userL3->refresh();
        $this->assertEquals(1200.00, (float) $this->userL3->commission_balance);
        $l3Record = LevelIncome::where('user_code', $this->userL3->user_code)->where('level', '3')->first();
        $this->assertNotNull($l3Record);
        $this->assertEquals(1200.00, (float) $l3Record->total_amount);

        // Level 4 receives 20% of 4000 = 800
        $this->userL4->refresh();
        $this->assertEquals(800.00, (float) $this->userL4->commission_balance);
        $l4Record = LevelIncome::where('user_code', $this->userL4->user_code)->where('level', '4')->first();
        $this->assertNotNull($l4Record);
        $this->assertEquals(800.00, (float) $l4Record->total_amount);

        // Level 5 receives 10% of 4000 = 400
        $this->userL5->refresh();
        $this->assertEquals(400.00, (float) $this->userL5->commission_balance);
        $l5Record = LevelIncome::where('user_code', $this->userL5->user_code)->where('level', '5')->first();
        $this->assertNotNull($l5Record);
        $this->assertEquals(400.00, (float) $l5Record->total_amount);

        // Total distributed: 1600 + 1200 + 800 + 400 = 4000 (100% of level pool)
        $totalDistributed = 1600.00 + 1200.00 + 800.00 + 400.00;
        $this->assertEquals($levelPool, $totalDistributed);

        // Verify Wallet Transfers for Level 2
        $transfer = WalletTransfer::where('memberid', $this->userL2->user_code)->first();
        $this->assertNotNull($transfer);
        $this->assertEquals('Level Income', $transfer->walletType);
        $this->assertEquals(1600.00, (float) $transfer->credit);
    }

    /**
     * Test 2: Traversal stops correctly when sponsor is Root or null.
     */
    public function test_traversal_stops_when_sponsor_is_root(): void
    {
        // Set L2 sponsor to 'Root', so hierarchy ends at L2
        $this->userL2->update(['sponsor_id' => 'Root']);

        $created = levelIncome($this->buyer->user_code, 4000.00);

        // Only Level 2 gets processed (40% = 1600), Level 3, 4, 5 do not exist
        $this->assertCount(1, $created);
        $this->userL2->refresh();
        $this->assertEquals(1600.00, (float) $this->userL2->commission_balance);

        $this->userL3->refresh();
        $this->assertEquals(0.00, (float) $this->userL3->commission_balance);
    }

    /**
     * Test 3: Payment income allocation distributes both Direct and Level Income.
     */
    public function test_payment_allocation_triggers_both_direct_and_level_income(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-LVL-' . rand(1000, 9999),
            'entity_name' => 'Test Biz',
            'entity_type' => 'business',
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'customer' => "{$this->buyer->name} ({$this->buyer->user_code})",
            'sponsor' => $this->userL1->user_code,
            'item' => 'Biz Package',
            'item_type' => 'service',
            'gross_amount' => 50000.00,
            'admin_commission_cut' => 10000.00,
            'advance_payment' => 25000.00,
            'balance_due' => 25000.00,
            'status' => 'partial',
            'dump_amount' => 100.00,
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $this->buyer->name,
            'customer_user_code' => $this->buyer->user_code,
            'sponsor' => $this->userL1->user_code,
            'amount' => 25000.00,
            'admin_commission_cut' => 10000.00,
            'net_entity_amount' => 15000.00,
            'income_distribution_status' => 'pending',
            'payment_date' => now()->toDateString(),
            'payment_type' => 'advance',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals('success', $data['status']);

        // Check payment status updated to completed
        $payment->refresh();
        $this->assertEquals('completed', $payment->income_distribution_status);

        // Level 1 receives Direct Income (40% of 10,000 = 4,000)
        $this->userL1->refresh();
        $this->assertEquals(4000.00, (float) $this->userL1->commission_balance);

        // Level 2 receives Level Income (40% of 4,000 Level Pool = 1,600)
        $this->userL2->refresh();
        $this->assertEquals(1600.00, (float) $this->userL2->commission_balance);

        // Level 3 receives Level Income (30% of 4,000 Level Pool = 1,200)
        $this->userL3->refresh();
        $this->assertEquals(1200.00, (float) $this->userL3->commission_balance);

        // Level 4 receives Level Income (20% of 4,000 Level Pool = 800)
        $this->userL4->refresh();
        $this->assertEquals(800.00, (float) $this->userL4->commission_balance);

        // Level 5 receives Level Income (10% of 4,000 Level Pool = 400)
        $this->userL5->refresh();
        $this->assertEquals(400.00, (float) $this->userL5->commission_balance);
    }
}
