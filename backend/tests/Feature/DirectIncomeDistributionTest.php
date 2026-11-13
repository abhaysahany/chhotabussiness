<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\DirectIncome;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\WalletTransfer;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class DirectIncomeDistributionTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $sponsor;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Setup Admin
        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Test Super Admin',
            'username' => 'testadmin_' . uniqid(),
            'email' => 'admin_direct_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);
        $this->adminToken = $this->admin->createToken('admin_test_token', ['admin'])->plainTextToken;

        // 2. Setup Sponsor User
        $this->sponsor = User::create([
            'name' => 'Rahul Sharma (Sponsor)',
            'email' => 'sponsor_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'SPONSOR_' . rand(10000, 99999),
            'sponsor_id' => 'CB100001',
            'commission_balance' => 5000.00,
        ]);

        // 3. Setup Customer User
        $this->customer = User::create([
            'name' => 'Tamish Customer',
            'email' => 'customer_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CUST_' . rand(10000, 99999),
            'sponsor_id' => $this->sponsor->user_code,
            'commission_balance' => 0.00,
        ]);
    }

    /**
     * Test 1: directIncome() helper creates direct_incomes record and updates wallet.
     */
    public function test_direct_income_helper_creates_record_and_credits_wallet(): void
    {
        $initialWallet = (float) $this->sponsor->commission_balance;
        $directAmount = 1500.00;
        $dumpAmount = 75.00;

        $record = directIncome(
            $this->sponsor->user_code,
            $this->customer->user_code,
            $directAmount,
            $dumpAmount
        );

        $this->assertNotNull($record);
        $this->assertInstanceOf(DirectIncome::class, $record);

        // Verify Direct Income database row
        $this->assertEquals($this->sponsor->user_code, $record->user_code);
        $this->assertEquals($this->sponsor->sponsor_id, $record->sponsor_id);
        $this->assertEquals($directAmount, (float) $record->total_amount);
        $this->assertEquals($directAmount, (float) $record->paid_amount);
        $this->assertEquals(0.00, (float) $record->balance_amount);
        $this->assertEquals($dumpAmount, (float) $record->dump_amount);

        // Verify recipient wallet update
        $this->sponsor->refresh();
        $expectedWallet = $initialWallet + $directAmount;
        $this->assertEquals($expectedWallet, (float) $this->sponsor->commission_balance);

        // Verify wallet transfer record
        $transfer = WalletTransfer::where('memberid', $this->sponsor->user_code)
            ->latest('id')
            ->first();

        $this->assertNotNull($transfer);
        $this->assertEquals($this->sponsor->user_code, $transfer->memberid);
        $this->assertEquals('Direct Income', $transfer->walletType);
        $this->assertEquals($directAmount, (float) $transfer->credit);
        $this->assertEquals(0.00, (float) $transfer->debit);
        $this->assertEquals($expectedWallet, (float) $transfer->balance);

        // Verify direct_incomes table has the persistent record
        $this->assertDatabaseHas('direct_incomes', [
            'id' => $record->id,
            'user_code' => $this->sponsor->user_code,
            'total_amount' => $directAmount,
            'paid_amount' => $directAmount,
            'balance_amount' => 0.00,
        ]);
    }

    /**
     * Test 2: 'Root' sponsor never receives unintended income.
     */
    public function test_root_sponsor_does_not_receive_unintended_income(): void
    {
        $res1 = directIncome('Root', $this->customer->user_code, 1200.00);
        $res2 = directIncome('root', $this->customer->user_code, 1200.00);
        $res3 = directIncome(null, $this->customer->user_code, 1200.00);

        $this->assertNull($res1);
        $this->assertNull($res2);
        $this->assertNull($res3);

        $this->assertDatabaseMissing('direct_incomes', ['user_code' => 'Root']);
        $this->assertDatabaseMissing('direct_incomes', ['user_code' => 'root']);
    }

    /**
     * Test 2b: Customer without sponsor produces NO direct income and NO wallet credit.
     */
    public function test_customer_without_sponsor_receives_no_direct_income(): void
    {
        $rootCustomer = User::create([
            'name' => 'Root Buyer',
            'email' => 'root_buyer_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'user_code' => 'ROOT_' . rand(1000, 9999),
            'sponsor_id' => null,
            'commission_balance' => 0.00,
        ]);

        $order = Order::create([
            'invoice_number' => 'INV-ROOT-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory',
            'entity_type' => 'business',
            'customer_name' => $rootCustomer->name,
            'customer_user_code' => $rootCustomer->user_code,
            'customer' => "{$rootCustomer->name} ({$rootCustomer->user_code})",
            'sponsor' => null,
            'item' => 'Consulting',
            'item_type' => 'service',
            'gross_amount' => 10000.00,
            'admin_commission_cut' => 2000.00,
            'advance_payment' => 5000.00,
            'balance_due' => 5000.00,
            'status' => 'partial',
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $rootCustomer->name,
            'customer_user_code' => $rootCustomer->user_code,
            'sponsor' => null,
            'amount' => 5000.00,
            'admin_commission_cut' => 1000.00,
            'net_entity_amount' => 4000.00,
            'income_distribution_status' => 'pending',
            'payment_date' => now()->toDateString(),
            'payment_type' => 'advance',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $response->assertStatus(200);

        // Buyer had no sponsor -> NO direct income record created!
        $this->assertDatabaseMissing('direct_incomes', [
            'user_code' => $rootCustomer->user_code,
        ]);
        // Buyer wallet untouched
        $rootCustomer->refresh();
        $this->assertEquals(0.00, (float) $rootCustomer->commission_balance);
    }

    /**
     * Test 3: Distribute Income API executes Direct Income distribution and updates recipient wallet.
     */
    public function test_distribute_income_api_triggers_direct_income_and_updates_wallet(): void
    {
        $initialSponsorWallet = (float) $this->sponsor->commission_balance;

        $order = Order::create([
            'invoice_number' => 'INV-TEST-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory',
            'entity_type' => 'business',
            'customer_name' => $this->customer->name,
            'customer_user_code' => $this->customer->user_code,
            'customer' => "{$this->customer->name} ({$this->customer->user_code})",
            'sponsor' => $this->sponsor->user_code,
            'item' => 'SEO Package',
            'item_type' => 'service',
            'gross_amount' => 50000.00,
            'dump_amount' => 100.00,
            'advance_payment' => 50000.00,
            'balance_due' => 0.00,
            'admin_commission_percent' => 20.0,
            'admin_commission_cut' => 10000.00, // 40% direct = 4000.00
            'status' => 'completed',
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 50000.00,
            'admin_commission_percent' => 20.0,
            'admin_commission_cut' => 10000.00,
            'net_entity_amount' => 40000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'full',
            'payment_date' => now(),
            'income_distribution_status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $response->assertStatus(200);

        // 40% of ₹10,000 Admin Cut is ₹4,000 Direct Income
        $expectedDirect = 4000.00;

        // Verify DirectIncome row exists
        $directRecord = DirectIncome::where('user_code', $this->sponsor->user_code)
            ->latest('id')
            ->first();

        $this->assertNotNull($directRecord);
        $this->assertEquals($expectedDirect, (float) $directRecord->total_amount);
        $this->assertEquals($expectedDirect, (float) $directRecord->paid_amount);
        $this->assertEquals(0.00, (float) $directRecord->balance_amount);
        $this->assertEquals(100.00, (float) $directRecord->dump_amount);

        // Verify sponsor wallet was credited with ₹4,000
        $this->sponsor->refresh();
        $this->assertEquals($initialSponsorWallet + $expectedDirect, (float) $this->sponsor->commission_balance);

        // Verify payment and order records
        $payment->refresh();
        $order->refresh();
        $this->assertEquals('completed', $payment->income_distribution_status);
        $this->assertEquals($expectedDirect, (float) $payment->direct_income_amount);
        $this->assertEquals($expectedDirect, (float) $order->direct_income_amount);

        // Verify Level Income was NOT created (per strict prompt constraint)
        $this->assertDatabaseMissing('level_incomes', [
            'user_code' => $this->sponsor->user_code,
        ]);
    }

    /**
     * Test 4: Prevent duplicate income distribution on the same payment receipt.
     */
    public function test_prevent_duplicate_income_distribution(): void
    {
        $order = Order::create([
            'invoice_number' => 'INV-DUP-' . rand(10000, 99999),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Apex Financial Advisory',
            'entity_type' => 'business',
            'customer_name' => $this->customer->name,
            'customer_user_code' => $this->customer->user_code,
            'sponsor' => $this->sponsor->user_code,
            'item' => 'SEO Package',
            'gross_amount' => 10000.00,
            'advance_payment' => 10000.00,
            'balance_due' => 0.00,
            'admin_commission_percent' => 10.0,
            'admin_commission_cut' => 1000.00,
            'status' => 'completed',
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => 10000.00,
            'admin_commission_percent' => 10.0,
            'admin_commission_cut' => 1000.00,
            'net_entity_amount' => 9000.00,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . rand(100000, 999999),
            'payment_type' => 'full',
            'payment_date' => now(),
            'income_distribution_status' => 'pending',
        ]);

        // First allocation succeeds
        $res1 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");
        $res1->assertStatus(200);

        $walletAfterFirst = (float) $this->sponsor->fresh()->commission_balance;
        $directRecordsCount1 = DirectIncome::where('user_code', $this->sponsor->user_code)->count();

        // Second allocation MUST fail with 422
        $res2 = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");
        $res2->assertStatus(422);

        // Ensure wallet balance and record counts are unchanged
        $walletAfterSecond = (float) $this->sponsor->fresh()->commission_balance;
        $directRecordsCount2 = DirectIncome::where('user_code', $this->sponsor->user_code)->count();

        $this->assertEquals($walletAfterFirst, $walletAfterSecond);
        $this->assertEquals($directRecordsCount1, $directRecordsCount2);
    }
}
