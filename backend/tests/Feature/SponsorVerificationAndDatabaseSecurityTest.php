<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SponsorVerificationAndDatabaseSecurityTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        User::where('email', 'like', '%@sponsortest.com')->delete();
    }

    protected function tearDown(): void
    {
        User::where('email', 'like', '%@sponsortest.com')->delete();
        parent::tearDown();
    }

    public function test_verify_sponsor_succeeds_with_valid_sponsor_code(): void
    {
        $sponsor = User::create([
            'user_code' => 'CB888801',
            'name' => 'Test Sponsor User',
            'email' => 'sponsor1@sponsortest.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/verify-sponsor', [
            'sponsor_id' => 'CB888801',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'verified' => true,
                'sponsor' => [
                    'name' => 'Test Sponsor User',
                    'user_code' => 'CB888801',
                    'email' => 'sponsor1@sponsortest.com',
                ],
            ]);
    }

    public function test_verify_sponsor_case_insensitive(): void
    {
        User::create([
            'user_code' => 'CB888802',
            'name' => 'Case Insensitive Sponsor',
            'email' => 'sponsor2@sponsortest.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/verify-sponsor', [
            'sponsor_id' => 'cb888802',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'verified' => true,
            ]);
    }

    public function test_verify_sponsor_fails_when_nonexistent(): void
    {
        $response = $this->postJson('/api/verify-sponsor', [
            'sponsor_id' => 'NONEXISTENT999',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
                'verified' => false,
            ]);
    }

    public function test_verify_sponsor_fails_when_empty(): void
    {
        $response = $this->postJson('/api/verify-sponsor', [
            'sponsor_id' => '',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Sponsor ID is required',
            ]);
    }

    public function test_verify_member_succeeds_with_valid_code(): void
    {
        User::create([
            'user_code' => 'CB888803',
            'name' => 'Member AutoFill User',
            'email' => 'member3@sponsortest.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/verify-member', [
            'member_id' => 'CB888803',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'verified' => true,
                'member' => [
                    'user_code' => 'CB888803',
                    'name' => 'Member AutoFill User',
                    'email' => 'member3@sponsortest.com',
                ],
            ]);
    }

    public function test_api_status_does_not_leak_raw_database_errors(): void
    {
        $response = $this->getJson('/api/status');
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertArrayHasKey('status', $data);
        $this->assertArrayHasKey('database_status', $data);
        $this->assertStringNotContainsStringIgnoringCase('SQLSTATE', $data['database_status']);
        $this->assertStringNotContainsStringIgnoringCase('Access denied', $data['database_status']);
    }

    public function test_verify_sponsor_handles_database_exception_with_clean_503(): void
    {
        $originalHost = config('database.connections.mysql.host');
        try {
            // Force database connection failure by pointing to non-existent database/host
            \Illuminate\Support\Facades\DB::disconnect();
            config([
                'database.connections.mysql.host' => '256.256.256.256',
            ]);

            $response = $this->postJson('/api/verify-sponsor', [
                'sponsor_id' => 'CB100001',
            ]);

            $response->assertStatus(503)
                ->assertJson([
                    'status' => 'error',
                    'message' => 'Service temporarily unavailable. Please try again shortly.',
                    'verified' => false,
                ]);

            // Assert strictly that no database details are leaked
            $content = $response->getContent();
            $this->assertStringNotContainsStringIgnoringCase('SQLSTATE', $content);
            $this->assertStringNotContainsStringIgnoringCase('Access denied', $content);
            $this->assertStringNotContainsStringIgnoringCase('u834681197', $content);
            $this->assertStringNotContainsStringIgnoringCase('256.256.256.256', $content);
        } finally {
            \Illuminate\Support\Facades\DB::disconnect();
            config(['database.connections.mysql.host' => $originalHost]);
        }
    }
}
