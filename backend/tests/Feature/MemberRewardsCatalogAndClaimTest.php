<?php

namespace Tests\Feature;

use App\Models\DiamondTransaction;
use App\Models\DiamondWallet;
use App\Models\Reward;
use App\Models\RewardClaim;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class MemberRewardsCatalogAndClaimTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected string $token;
    protected Reward $rewardStarter;
    protected Reward $rewardGadget;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Rewards Test Member',
            'email' => 'reward_member_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . random_int(1000000, 9999999),
            'sponsor_id' => 'Root',
            'commission_balance' => 5000.00, // Cash wallet should remain completely untouched
            'bp_balance' => 300.00,          // 300 Diamonds in sync with wallet
            'kyc_status' => 'verified',
            'status' => 'active',
            'location' => '123 MG Road, Indiranagar',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'pincode' => '560038',
            'phone' => '9876543210',
        ]);

        $this->token = $this->user->createToken('user_token')->plainTextToken;

        DiamondWallet::updateOrCreate(
            ['user_id' => $this->user->id],
            [
                'diamond_balance' => 300.00,
                'level_1_diamonds' => 200.00,
                'level_2_diamonds' => 100.00,
                'conversion_rate_inr' => 100.00,
            ]
        );

        $this->rewardStarter = Reward::create([
            'title' => 'Executive Leather Welcome Kit',
            'category' => 'Welcome',
            'required_bp' => 100,
            'reward_value_inr' => 2500,
            'status' => 'active',
            'description' => 'Executive leather diary and pen.',
            'image' => 'https://example.com/welcome.jpg',
        ]);

        $this->rewardGadget = Reward::create([
            'title' => 'Flagship Smartphone Pro Max',
            'category' => 'Gadgets',
            'required_bp' => 800,
            'reward_value_inr' => 45000,
            'status' => 'active',
            'description' => 'Premium 5G smartphone.',
            'image' => 'https://example.com/phone.jpg',
        ]);
    }

    public function test_user_can_list_active_rewards_catalog()
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/user/rewards');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        $rewards = $response->json('rewards');
        $this->assertNotEmpty($rewards);

        $first = collect($rewards)->firstWhere('id', $this->rewardStarter->id);
        $this->assertNotNull($first);
        $this->assertEquals('Executive Leather Welcome Kit', $first['title']);
        $this->assertEquals(2500, (int) $first['reward_value_inr']);
        $this->assertEquals(100, (int) $first['required_bp']);
    }

    public function test_user_can_view_single_reward_details()
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson("/api/user/rewards/{$this->rewardStarter->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'reward' => [
                    'id' => $this->rewardStarter->id,
                    'title' => 'Executive Leather Welcome Kit',
                    'required_bp' => '100.00',
                ],
            ]);
    }

    public function test_insufficient_diamonds_blocks_claim()
    {
        // User has 300 diamonds, reward requires 800
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/user/rewards/claim', [
                'reward_id' => $this->rewardGadget->id,
                'shipping_address' => '123 MG Road',
                'shipping_city' => 'Bengaluru',
                'shipping_state' => 'Karnataka',
                'shipping_pincode' => '560038',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertStringContainsStringIgnoringCase('insufficient diamond', $response->json('message'));

        // Verify balance remained 300
        $this->user->refresh();
        $this->assertEquals(300.00, (float) $this->user->bp_balance);
        $this->assertEquals(5000.00, (float) $this->user->commission_balance);
    }

    public function test_successful_claim_deducts_diamonds_leaves_cash_wallet_untouched()
    {
        $initialCashBalance = (float) $this->user->commission_balance; // 5000.00

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/user/rewards/claim', [
                'reward_id' => $this->rewardStarter->id,
                'shipping_address' => '123 MG Road',
                'shipping_city' => 'Bengaluru',
                'shipping_state' => 'Karnataka',
                'shipping_pincode' => '560038',
                'shipping_phone' => '9876543210',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'remaining_diamonds' => 200,
            ]);

        // Eager loaded reward info in claim response
        $claimData = $response->json('claim');
        $this->assertNotNull($claimData);
        $this->assertEquals('Executive Leather Welcome Kit', $claimData['reward_title']);
        $this->assertEquals(2500, (int) ($claimData['reward']['reward_value_inr'] ?? 0));
        $this->assertEquals('Welcome', $claimData['reward']['category'] ?? '');

        // Verify user balances in DB
        $this->user->refresh();
        $this->assertEquals(200.00, (float) $this->user->bp_balance);
        // CRITICAL: Cash commission balance must NEVER change
        $this->assertEquals($initialCashBalance, (float) $this->user->commission_balance);

        // Verify DiamondWallet
        $wallet = DiamondWallet::where('user_id', $this->user->id)->first();
        $this->assertEquals(200.00, (float) $wallet->diamond_balance);

        // Verify DiamondTransaction debit entry
        $tx = DiamondTransaction::where('user_id', $this->user->id)
            ->where('transaction_type', 'debit')
            ->first();
        $this->assertNotNull($tx);
        $this->assertEquals(-10000.00, (float) $tx->allocated_amount);
        $this->assertEquals(-100.00, (float) $tx->diamond_quantity);

        // Verify claim record
        $claimRecord = RewardClaim::where('claim_code', $claimData['claim_code'])->first();
        $this->assertNotNull($claimRecord);
        $this->assertEquals('pending', $claimRecord->status);
        $this->assertEquals('Bengaluru', $claimRecord->shipping_city);

        // Test indexUserClaims returns eager-loaded details
        $claimsResponse = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/user/reward-claims');

        $claimsResponse->assertStatus(200);
        $claimsList = $claimsResponse->json('claims');
        $this->assertNotEmpty($claimsList);
        $firstClaim = collect($claimsList)->firstWhere('claim_code', $claimData['claim_code']);
        $this->assertNotNull($firstClaim);
        $this->assertEquals(2500, (int) ($firstClaim['reward']['reward_value_inr'] ?? 0));
        $this->assertEquals('Executive leather diary and pen.', $firstClaim['reward']['description'] ?? '');
    }
}
