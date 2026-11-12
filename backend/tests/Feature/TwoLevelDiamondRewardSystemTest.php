<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\CommissionSetting;
use App\Models\DiamondRewardAudit;
use App\Models\DiamondTransaction;
use App\Models\DiamondWallet;
use App\Models\EntityCategory;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\UserPayout;
use App\Services\DiamondRewardService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TwoLevelDiamondRewardSystemTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected string $adminToken;
    protected User $memberA; // Level 2 Sponsor (Sponsor's Sponsor)
    protected User $memberB; // Level 1 Sponsor (Direct Sponsor)
    protected User $memberC; // Buyer

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Diamond Reward Test Admin',
            'username' => 'diamond_admin_' . uniqid(),
            'email' => 'diamond_admin_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);
        $this->adminToken = $this->admin->createToken('diamond_admin_token', ['admin'])->plainTextToken;

        // Sponsor chain: Root -> Member A -> Member B (Direct Sponsor) -> Member C (Buyer)
        $this->memberA = User::create([
            'name' => 'Member A (Level 2 Sponsor)',
            'email' => 'member_a_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => 'Root',
            'commission_balance' => 0.00,
            'bp_balance' => 0.00,
            'kyc_status' => 'verified',
            'status' => 'active',
        ]);

        $this->memberB = User::create([
            'name' => 'Member B (Direct Sponsor)',
            'email' => 'member_b_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => $this->memberA->user_code,
            'commission_balance' => 0.00,
            'bp_balance' => 0.00,
            'kyc_status' => 'verified',
            'status' => 'active',
        ]);

        $this->memberC = User::create([
            'name' => 'Member C (Buyer)',
            'email' => 'member_c_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => $this->memberB->user_code,
            'commission_balance' => 0.00,
            'bp_balance' => 0.00,
            'kyc_status' => 'verified',
            'status' => 'active',
        ]);
    }

    protected function createConfirmedOrderAndPayment(
        User $buyer,
        ?string $sponsorOverride,
        float $grossAmount,
        float $adminPercent,
        float $paymentAmount,
        string $approvalStatus = 'confirmed'
    ): array {
        $adminCut = round(($paymentAmount * $adminPercent) / 100, 2);
        $expectedCut = round(($grossAmount * $adminPercent) / 100, 2);
        $netEntity = round($paymentAmount - $adminCut, 2);

        $order = Order::create([
            'invoice_number' => 'INV-DM-' . random_int(10000, 99999) . '-' . substr(uniqid(), -3),
            'date' => now()->toDateString(),
            'entity_id' => 1,
            'entity_name' => 'Vyapar Test Entity',
            'entity_type' => 'business',
            'customer_name' => $buyer->name,
            'customer_user_code' => $buyer->user_code,
            'customer' => "{$buyer->name} ({$buyer->user_code})",
            'sponsor' => $sponsorOverride,
            'item' => 'Premium Package',
            'item_type' => 'service',
            'gross_amount' => $grossAmount,
            'advance_payment' => $paymentAmount,
            'balance_due' => max(0.0, $grossAmount - $paymentAmount),
            'admin_commission_percent' => $adminPercent,
            'admin_commission_cut' => $expectedCut,
            'net_entity_payout' => $netEntity,
            'status' => ($grossAmount <= $paymentAmount) ? 'completed' : 'partial',
            'approval_status' => $approvalStatus,
            'income_distribution_status' => 'pending',
        ]);

        $payment = SalePayment::create([
            'sales_record_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'sponsor' => $order->sponsor,
            'amount' => $paymentAmount,
            'admin_commission_percent' => $adminPercent,
            'admin_commission_cut' => $adminCut,
            'net_entity_amount' => $netEntity,
            'payment_method' => 'UPI',
            'reference_no' => 'UTR-' . random_int(100000, 999999),
            'payment_type' => ($grossAmount <= $paymentAmount) ? 'full' : 'advance',
            'payment_date' => now(),
            'income_distribution_status' => 'pending',
        ]);

        return [$order, $payment];
    }

    public function test_percentage_split_and_two_level_diamond_distribution_spec_scenario(): void
    {
        // Configure: Direct 40%, MLM Levels total 30% (L2=12, L3=8, L4=6, L5=4), Reward L1=20%, Reward L2=10%
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => 40,
                'level_1_percent' => 0,
                'level_2_percent' => 12,
                'level_3_percent' => 8,
                'level_4_percent' => 6,
                'level_5_percent' => 4,
                'reward_level_1_percent' => 20,
                'reward_level_2_percent' => 10,
            ])->assertStatus(200);

        // ₹50,000 order @ 20% = ₹10,000 distributable base amount
        [$order, $payment] = $this->createConfirmedOrderAndPayment($this->memberC, $this->memberB->user_code, 50000.00, 20.00, 50000.00);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation");

        $response->assertStatus(200)
            ->assertJsonPath('allocated.direct_income_amount', 4000)
            ->assertJsonPath('allocated.level_income_amount', 3000)
            ->assertJsonPath('allocated.reward_level_1_amount', 2000)
            ->assertJsonPath('allocated.reward_level_2_amount', 1000)
            ->assertJsonPath('allocated.reward_income_amount', 3000)
            ->assertJsonPath('allocated.reward_level_1_diamonds', 20)
            ->assertJsonPath('allocated.reward_level_2_diamonds', 10)
            ->assertJsonPath('allocated.total_allocated', 10000);

        // Verify Member B (Direct Sponsor) received 20 Diamonds in separate Diamond wallet
        // AND ONLY Direct Income cash (₹4,000), NOT Reward INR cash and NOT Level 2 Diamonds
        $this->memberB->refresh();
        $walletB = DiamondWallet::where('user_id', $this->memberB->id)->first();
        $this->assertNotNull($walletB);
        $this->assertEquals(20.0, (float) $walletB->diamond_balance);
        $this->assertEquals(20.0, (float) $walletB->level_1_diamonds);
        $this->assertEquals(0.0, (float) $walletB->level_2_diamonds);
        $this->assertEquals(4000.00, (float) $this->memberB->commission_balance); // Only Direct Income cash

        // Verify Member A (Sponsor's Sponsor) received 10 Diamonds in separate Diamond wallet
        // AND ONLY Level 2 MLM Income cash (₹1,200 = 12% of ₹10,000), NOT Reward INR cash
        $this->memberA->refresh();
        $walletA = DiamondWallet::where('user_id', $this->memberA->id)->first();
        $this->assertNotNull($walletA);
        $this->assertEquals(10.0, (float) $walletA->diamond_balance);
        $this->assertEquals(0.0, (float) $walletA->level_1_diamonds);
        $this->assertEquals(10.0, (float) $walletA->level_2_diamonds);
        $this->assertEquals(1200.00, (float) $this->memberA->commission_balance); // Only Level 2 MLM cash

        // Verify Member C (Buyer) received ZERO Sponsor Diamonds and ZERO cash
        $this->memberC->refresh();
        $this->assertNull(DiamondWallet::where('user_id', $this->memberC->id)->first());
        $this->assertEquals(0.00, (float) $this->memberC->commission_balance);

        // Verify Ledger totals match Wallet balances
        $ledgerSumB = (float) DiamondTransaction::where('user_id', $this->memberB->id)->sum('diamond_quantity');
        $ledgerSumA = (float) DiamondTransaction::where('user_id', $this->memberA->id)->sum('diamond_quantity');
        $this->assertEquals($ledgerSumB, (float) $walletB->diamond_balance);
        $this->assertEquals($ledgerSumA, (float) $walletA->diamond_balance);
    }

    public function test_fractional_diamond_conversion_precision_and_payout_exclusion(): void
    {
        /** @var DiamondRewardService $diamondService */
        $diamondService = app(DiamondRewardService::class);
        $this->assertEquals('20.0000', $diamondService->convertInrToDiamonds(2000));
        $this->assertEquals('10.0000', $diamondService->convertInrToDiamonds(1000));
        $this->assertEquals('2.5000', $diamondService->convertInrToDiamonds(250));

        // Direct 40%, Levels 40%, Reward L1 = 10%, Reward L2 = 10%
        // Base ₹2,500 => Reward L1 = ₹250 (2.5 Diamonds), Reward L2 = ₹250 (2.5 Diamonds)
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => 40,
                'level_1_percent' => 0,
                'level_2_percent' => 16,
                'level_3_percent' => 12,
                'level_4_percent' => 8,
                'level_5_percent' => 4,
                'reward_level_1_percent' => 10,
                'reward_level_2_percent' => 10,
            ])->assertStatus(200);

        [$order, $payment] = $this->createConfirmedOrderAndPayment($this->memberC, $this->memberB->user_code, 12500.00, 20.00, 12500.00);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation")
            ->assertStatus(200)
            ->assertJsonPath('allocated.reward_level_1_amount', 250)
            ->assertJsonPath('allocated.reward_level_2_amount', 250)
            ->assertJsonPath('allocated.reward_level_1_diamonds', 2.5)
            ->assertJsonPath('allocated.reward_level_2_diamonds', 2.5);

        $walletB = DiamondWallet::where('user_id', $this->memberB->id)->first();
        $walletA = DiamondWallet::where('user_id', $this->memberA->id)->first();
        $this->assertEquals(2.5, (float) $walletB->diamond_balance);
        $this->assertEquals(2.5, (float) $walletA->diamond_balance);

        // Payout isolation check: User with Diamonds ONLY (cash balance = 0) CANNOT withdraw cash or appear in weekly payout batch
        $diamondOnlyUser = User::create([
            'name' => 'Diamonds Only User',
            'email' => 'd_only_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => 'Root',
            'commission_balance' => 0.00,
            'kyc_status' => 'verified',
            'account_number' => '1234567890',
            'ifsc_code' => 'SBIN0001234',
        ]);
        DiamondWallet::create([
            'user_id' => $diamondOnlyUser->id,
            'diamond_balance' => '50.0000',
            'level_1_diamonds' => '50.0000',
            'level_2_diamonds' => '0.0000',
        ]);

        $tokenD = $diamondOnlyUser->createToken('d_only_tok', ['user'])->plainTextToken;
        $this->withHeader('Authorization', 'Bearer ' . $tokenD)
            ->postJson('/api/user/payouts/withdraw', ['amount' => 500])
            ->assertStatus(422);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/payouts/generate-weekly')
            ->assertStatus(200);

        $this->assertDatabaseMissing('user_payouts', ['user_id' => $diamondOnlyUser->id]);
    }

    public function test_missing_or_ineligible_sponsors_are_audited_and_never_redirected_or_entity_credited(): void
    {
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => 40,
                'level_1_percent' => 0,
                'level_2_percent' => 16,
                'level_3_percent' => 12,
                'level_4_percent' => 8,
                'level_5_percent' => 4,
                'reward_level_1_percent' => 15,
                'reward_level_2_percent' => 5,
            ])->assertStatus(200);

        // Case 1: Member with Root direct sponsor -> missing L1 & L2 sponsors, no credits created
        $rootBuyer = User::create([
            'name' => 'Root Buyer',
            'email' => 'rootb_' . uniqid() . '@example.com',
            'password' => bcrypt('password'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => 'Root',
            'commission_balance' => 0.00,
        ]);

        [$order1, $payment1] = $this->createConfirmedOrderAndPayment($rootBuyer, 'Root', 10000.00, 20.00, 10000.00);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment1->id}/income-allocation")
            ->assertStatus(200);

        $this->assertDatabaseMissing('diamond_transactions', ['sale_payment_id' => $payment1->id]);
        $this->assertDatabaseHas('diamond_reward_audits', [
            'sale_payment_id' => $payment1->id,
            'reward_level' => 1,
            'status' => 'skipped_missing_sponsor',
        ]);
        $this->assertDatabaseHas('diamond_reward_audits', [
            'sale_payment_id' => $payment1->id,
            'reward_level' => 2,
            'status' => 'skipped_missing_sponsor',
        ]);

        // Case 2: Inactive Direct Sponsor -> L1 skipped (never redirected to L2!), while active L2 receives ONLY L2 amount
        $this->memberB->update(['status' => 'inactive']);
        [$order2, $payment2] = $this->createConfirmedOrderAndPayment($this->memberC, $this->memberB->user_code, 50000.00, 20.00, 50000.00);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment2->id}/income-allocation")
            ->assertStatus(200);

        // Member B received NO Level 1 diamonds
        $this->assertNull(DiamondWallet::where('user_id', $this->memberB->id)->first());
        $this->assertDatabaseHas('diamond_reward_audits', [
            'sale_payment_id' => $payment2->id,
            'reward_level' => 1,
            'status' => 'skipped_ineligible_sponsor',
        ]);

        // Member A received ONLY L2 Diamonds (5% of 10,000 = ₹500 = 5 Diamonds), NEVER Member B's L1 share
        $walletA = DiamondWallet::where('user_id', $this->memberA->id)->first();
        $this->assertNotNull($walletA);
        $this->assertEquals(5.0, (float) $walletA->diamond_balance);
        $this->assertEquals(5.0, (float) $walletA->level_2_diamonds);

        // Case 3: Ensure BusinessEntity is never credited even if entity_id/code collides numerically
        $category = EntityCategory::first() ?? EntityCategory::create(['name' => 'General', 'slug' => 'general']);
        $biz = BusinessEntity::create([
            'entity_category_id' => $category->id,
            'name' => 'Entity Not Sponsor',
            'owner_name' => 'Owner',
            'email' => 'ent_notspon_' . uniqid() . '@example.com',
            'phone' => '9998887776',
        ]);
        $this->assertDatabaseMissing('diamond_wallets', ['user_id' => $biz->id, 'diamond_balance' => 15.0]);
    }

    public function test_unconfirmed_orders_blocked_and_duplicate_credits_prevented_plus_user_isolation(): void
    {
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/admin/commission-settings', [
                'direct_percent' => 40,
                'level_1_percent' => 0,
                'level_2_percent' => 16,
                'level_3_percent' => 12,
                'level_4_percent' => 8,
                'level_5_percent' => 4,
                'reward_level_1_percent' => 15,
                'reward_level_2_percent' => 5,
            ])->assertStatus(200);

        // 1. Unconfirmed order cannot trigger Diamond distribution
        [$pendingOrder, $pendingPayment] = $this->createConfirmedOrderAndPayment($this->memberC, $this->memberB->user_code, 10000.00, 20.00, 10000.00, 'pending');
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$pendingPayment->id}/income-allocation")
            ->assertStatus(422);
        $this->assertDatabaseMissing('diamond_transactions', ['sale_payment_id' => $pendingPayment->id]);

        // 2. Confirmed payment distributes once, second attempt blocked with 422
        [$order, $payment] = $this->createConfirmedOrderAndPayment($this->memberC, $this->memberB->user_code, 50000.00, 20.00, 50000.00);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation")
            ->assertStatus(200);

        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/admin/payments/{$payment->id}/income-allocation")
            ->assertStatus(422);

        $this->assertEquals(1, DiamondTransaction::where('user_id', $this->memberB->id)->where('sale_payment_id', $payment->id)->count());
        $this->assertEquals(15.0, (float) DiamondWallet::where('user_id', $this->memberB->id)->value('diamond_balance'));

        // 3. User panel isolation: Member B sees ONLY Member B's diamonds; Member C cannot spoof ?user_id=memberB
        $tokenB = $this->memberB->createToken('tok_b', ['user'])->plainTextToken;
        $tokenC = $this->memberC->createToken('tok_c', ['user'])->plainTextToken;

        $this->app['auth']->forgetGuards();
        $this->withHeaders(['Authorization' => ''])->getJson('/api/user/diamonds')->assertStatus(401);

        $this->app['auth']->forgetGuards();
        $resB = $this->withHeader('Authorization', 'Bearer ' . $tokenB)->getJson('/api/user/diamonds');
        $resB->assertStatus(200)
            ->assertJsonPath('wallet.diamond_balance', 15)
            ->assertJsonPath('wallet.level_1_diamonds', 15)
            ->assertJsonPath('total_transactions', 1);

        $this->app['auth']->forgetGuards();
        $resC = $this->withHeader('Authorization', 'Bearer ' . $tokenC)
            ->getJson("/api/user/diamonds?user_id={$this->memberB->id}&user_code={$this->memberB->user_code}");
        $resC->assertStatus(200)
            ->assertJsonPath('user.id', $this->memberC->id)
            ->assertJsonPath('wallet.diamond_balance', 0)
            ->assertJsonPath('total_transactions', 0);

        // 4. Compensating reversal test: reverses diamonds accurately while keeping historical credit row intact
        /** @var DiamondRewardService $diamondService */
        $diamondService = app(DiamondRewardService::class);
        $diamondService->reversePaymentRewards($payment, 'Audit reversal test');

        $this->assertEquals(0.0, (float) DiamondWallet::where('user_id', $this->memberB->id)->value('diamond_balance'));
        $this->assertEquals(0.0, (float) DiamondWallet::where('user_id', $this->memberA->id)->value('diamond_balance'));
        $this->assertEquals(2, DiamondTransaction::where('user_id', $this->memberB->id)->where('sale_payment_id', $payment->id)->count());
        $this->assertEquals(0.0, (float) DiamondTransaction::where('user_id', $this->memberB->id)->sum('diamond_quantity'));
    }
}
