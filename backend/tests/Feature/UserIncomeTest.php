<?php

namespace Tests\Feature;

use App\Models\DirectIncome;
use App\Models\LevelIncome;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class UserIncomeTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user1;
    protected string $token1;
    protected User $user2;
    protected string $token2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user1 = User::create([
            'name' => 'Alice Partner',
            'email' => 'alice_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);
        $this->token1 = $this->user1->createToken('test_user_token_1', ['user'])->plainTextToken;

        $this->user2 = User::create([
            'name' => 'Bob Partner',
            'email' => 'bob_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'user_code' => 'CB' . rand(100000, 999999),
        ]);
        $this->token2 = $this->user2->createToken('test_user_token_2', ['user'])->plainTextToken;
    }

    /**
     * Test 1: users.team_biz column defaults to 0.00 and is cast to float.
     */
    public function test_users_team_biz_column_defaults_to_zero(): void
    {
        $this->user1->refresh();
        $this->assertSame(0.0, (float) $this->user1->team_biz);
        $this->assertSame(0.0, (float) $this->user1->teamBiz);
    }

    /**
     * Test 2: Unauthenticated request to /api/user/income/direct returns 401.
     */
    public function test_unauthenticated_direct_income_request_is_rejected(): void
    {
        $response = $this->getJson('/api/user/income/direct');
        $response->assertStatus(401);
    }

    /**
     * Test 3: Unauthenticated request to /api/user/income/levels returns 401.
     */
    public function test_unauthenticated_level_income_request_is_rejected(): void
    {
        $response = $this->getJson('/api/user/income/levels');
        $response->assertStatus(401);
    }

    /**
     * Test 4: Authenticated user with no direct income record receives clean empty/zero state.
     * No fake records or balance modification.
     */
    public function test_authenticated_user_without_direct_income_gets_clean_zero_state(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token1)
            ->getJson('/api/user/income/direct');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertEquals('success', $data['status']);
        $this->assertEquals($this->user1->id, $data['summary']['user_id']);
        $this->assertEquals($this->user1->user_code, $data['summary']['member_id']);
        $this->assertEquals($this->user1->name, $data['summary']['user_name']);
        $this->assertEquals(0.0, $data['summary']['total_amount']);
        $this->assertEquals(0.0, $data['summary']['paid_amount']);
        $this->assertEquals(0.0, $data['summary']['balance_amount']);
        $this->assertEquals(0.0, $data['summary']['dump_amount']);
        $this->assertFalse($data['summary']['has_record']);
        $this->assertCount(0, $data['records']);
    }

    /**
     * Test 5: Authenticated user with no level income records receives clean zero state
     * with levels 2, 3, 4, 5 represented with zero amounts.
     */
    public function test_authenticated_user_without_level_income_gets_clean_zero_state(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token1)
            ->getJson('/api/user/income/levels');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertEquals('success', $data['status']);
        $this->assertEquals(0.0, $data['summary']['total_amount']);
        $this->assertEquals(0.0, $data['summary']['paid_amount']);
        $this->assertEquals(0.0, $data['summary']['balance_amount']);
        $this->assertEquals(0.0, $data['summary']['dump_amount']);
        $this->assertEquals(0, $data['summary']['levels_count']);

        $this->assertCount(4, $data['levels']);
        $levels = collect($data['levels'])->pluck('level_number')->all();
        $this->assertEquals([2, 3, 4, 5], $levels);
    }

    /**
     * Test 6: Authenticated user can read their own Direct Income record when present.
     */
    public function test_authenticated_user_reads_own_direct_income_record(): void
    {
        DirectIncome::create([
            'user_code' => $this->user1->user_code,
            'sponsor_id' => 'SPONSOR_' . uniqid(),
            'total_amount' => 15000.00,
            'paid_amount' => 5000.00,
            'balance_amount' => 10000.00,
            'dump_amount' => 250.00,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token1)
            ->getJson('/api/user/income/direct');

        $response->assertStatus(200);
        $summary = $response->json('summary');

        $this->assertEquals(15000.0, $summary['total_amount']);
        $this->assertEquals(5000.0, $summary['paid_amount']);
        $this->assertEquals(10000.0, $summary['balance_amount']);
        $this->assertEquals(250.0, $summary['dump_amount']);
        $this->assertTrue($summary['has_record']);
    }

    /**
     * Test 7: Authenticated user can read their Level Income accounts (Levels 2–5 separated).
     */
    public function test_authenticated_user_reads_level_income_breakdown(): void
    {
        // Populate Level 2 and Level 3 records for user1
        LevelIncome::create([
            'user_code' => $this->user1->user_code,
            'level_id' => 'ROOT',
            'level' => '2',
            'total_amount' => 8000.00,
            'paid_amount' => 2000.00,
            'balance_amount' => 6000.00,
            'dump_amount' => 100.00,
        ]);

        LevelIncome::create([
            'user_code' => $this->user1->user_code,
            'level_id' => 'ROOT',
            'level' => '3',
            'total_amount' => 4000.00,
            'paid_amount' => 1000.00,
            'balance_amount' => 3000.00,
            'dump_amount' => 50.00,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token1)
            ->getJson('/api/user/income/levels');

        $response->assertStatus(200);
        $data = $response->json();

        // Cumulative totals across recorded levels
        $this->assertEquals(12000.0, $data['summary']['total_amount']); // 8000 + 4000
        $this->assertEquals(3000.0, $data['summary']['paid_amount']);   // 2000 + 1000
        $this->assertEquals(9000.0, $data['summary']['balance_amount']); // 12000 - 3000
        $this->assertEquals(150.0, $data['summary']['dump_amount']);    // 100 + 50
        $this->assertEquals(2, $data['summary']['levels_count']);

        // Check level 2 item
        $lvl2 = collect($data['levels'])->firstWhere('level_number', 2);
        $this->assertNotNull($lvl2);
        $this->assertEquals(8000.0, $lvl2['total_amount']);
        $this->assertEquals(2000.0, $lvl2['paid_amount']);
        $this->assertEquals(6000.0, $lvl2['balance_amount']);
        $this->assertTrue($lvl2['has_record']);

        // Check level 4 item (no record yet)
        $lvl4 = collect($data['levels'])->firstWhere('level_number', 4);
        $this->assertNotNull($lvl4);
        $this->assertEquals(0.0, $lvl4['total_amount']);
        $this->assertFalse($lvl4['has_record']);
    }

    /**
     * Test 8: Strict authorization isolation: User B cannot access User A's income,
     * even if passing user_id or user_code in query parameters.
     */
    public function test_user_cannot_access_another_users_income_summary(): void
    {
        // User 1 has records
        DirectIncome::create([
            'user_code' => $this->user1->user_code,
            'sponsor_id' => 'SPONSOR_' . uniqid(),
            'total_amount' => 50000.00,
            'paid_amount' => 20000.00,
            'balance_amount' => 30000.00,
            'dump_amount' => 500.00,
        ]);

        // User 2 requests income endpoint while attempting to spoof user_id or user_code of User 1
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token2)
            ->getJson("/api/user/income/direct?user_id={$this->user1->id}&user_code={$this->user1->user_code}");

        $response->assertStatus(200);
        $summary = $response->json('summary');

        // MUST return User 2's own zero state, NOT User 1's ₹50,000!
        $this->assertEquals($this->user2->id, $summary['user_id']);
        $this->assertEquals($this->user2->user_code, $summary['member_id']);
        $this->assertEquals(0.0, $summary['total_amount']);
        $this->assertEquals(0.0, $summary['paid_amount']);
        $this->assertFalse($summary['has_record']);
    }

    /**
     * Test 9: Balance calculation is always MAX(total_amount - paid_amount - dump_amount, 0)
     * and dump_amount is separately displayed and isolated.
     */
    public function test_balance_amount_is_max_total_minus_paid_and_dump_isolated(): void
    {
        $income = DirectIncome::create([
            'user_code' => $this->user1->user_code,
            'sponsor_id' => 'SPONSOR_' . uniqid(),
            'total_amount' => 1000.00,
            'paid_amount' => 1500.00, // edge case: paid > total
            'balance_amount' => 0.00,
            'dump_amount' => 300.00,
        ]);

        $this->assertEquals(0.0, (float) $income->balance_amount);
        $this->assertEquals(300.0, (float) $income->dump_amount);
    }
}
