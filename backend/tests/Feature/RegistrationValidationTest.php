<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrationValidationTest extends TestCase
{
    use DatabaseTransactions;

    protected User $sponsor;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'chhotabiz',
        ]);

        // Clean up test users
        User::where('email', 'like', '%@regtest.com')->delete();

        // Create a verified sponsor
        $this->sponsor = User::create([
            'name' => 'Valid Sponsor',
            'email' => 'sponsor@regtest.com',
            'password' => Hash::make('password123'),
            'user_code' => 'CB999901',
            'email_verified_at' => now(),
        ]);
    }

    protected function tearDown(): void
    {
        User::where('email', 'like', '%@regtest.com')->delete();
        parent::tearDown();
    }

    /**
     * Test sendOtp rejects missing or invalid sponsor ID
     */
    public function test_send_otp_fails_without_valid_sponsor(): void
    {
        // 1. Missing sponsor_id
        $response = $this->postJson('/api/send-otp', [
            'name' => 'Test User',
            'email' => 'newuser@regtest.com',
            'password' => 'secret123',
            'terms_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sponsor_id']);

        // 2. Non-existent sponsor_id
        $response2 = $this->postJson('/api/send-otp', [
            'sponsor_id' => 'INVALID_SPONSOR_XYZ',
            'name' => 'Test User',
            'email' => 'newuser@regtest.com',
            'password' => 'secret123',
            'terms_accepted' => true,
        ]);

        $response2->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid Sponsor ID. Sponsor does not exist in our database.',
                'errors' => [
                    'sponsor_id' => ['Invalid Sponsor ID. Sponsor does not exist in our database.'],
                ],
            ]);
    }

    /**
     * Test sendOtp rejects missing or whitespace-only name
     */
    public function test_send_otp_fails_without_name(): void
    {
        $response = $this->postJson('/api/send-otp', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => '   ',
            'email' => 'newuser@regtest.com',
            'password' => 'secret123',
            'terms_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /**
     * Test sendOtp rejects invalid or missing email
     */
    public function test_send_otp_fails_with_invalid_email(): void
    {
        $response = $this->postJson('/api/send-otp', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => 'Test User',
            'email' => 'not-an-email',
            'password' => 'secret123',
            'terms_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test sendOtp rejects already registered email with explicit message and guidance
     */
    public function test_send_otp_fails_if_email_is_already_registered(): void
    {
        // Sponsor email is already in the database
        $response = $this->postJson('/api/send-otp', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => 'Another User',
            'email' => $this->sponsor->email,
            'password' => 'secret123',
            'terms_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'This email address is already registered. Please login instead.',
                'errors' => [
                    'email' => ['This email address is already registered. Please login instead.'],
                ],
                'requires_login' => true,
            ]);
    }

    /**
     * Test sendOtp rejects missing or short password
     */
    public function test_send_otp_fails_with_short_password(): void
    {
        $response = $this->postJson('/api/send-otp', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => 'Test User',
            'email' => 'newuser@regtest.com',
            'password' => '123',
            'terms_accepted' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test sendOtp rejects unaccepted terms
     */
    public function test_send_otp_fails_without_terms_acceptance(): void
    {
        $response = $this->postJson('/api/send-otp', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => 'Test User',
            'email' => 'newuser@regtest.com',
            'password' => 'secret123',
            'terms_accepted' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['terms_accepted']);
    }

    /**
     * Test sendOtp succeeds when all registration fields are valid
     */
    public function test_send_otp_succeeds_with_valid_registration_fields(): void
    {
        $testEmail = 'validcandidate@regtest.com';

        $response = $this->postJson('/api/send-otp', [
            'sponsor_id' => strtolower($this->sponsor->user_code), // Test case-insensitivity
            'name' => 'Candidate Name',
            'email' => $testEmail,
            'password' => 'secret123',
            'terms_accepted' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        $otp = $response->json('otp');
        $this->assertNotEmpty($otp);
        $this->assertEquals(6, strlen($otp));
        $this->assertEquals($otp, Cache::get('otp_' . $testEmail));
    }

    /**
     * Test sendOtp never exposes raw OTP in production environment
     */
    public function test_send_otp_does_not_expose_otp_in_production(): void
    {
        $originalEnv = app()->environment();
        app()['env'] = 'production';

        try {
            $testEmail = 'prodtest@regtest.com';

            $response = $this->postJson('/api/send-otp', [
                'sponsor_id' => $this->sponsor->user_code,
                'name' => 'Prod Candidate',
                'email' => $testEmail,
                'password' => 'secret123',
                'terms_accepted' => true,
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'status' => 'success',
                ]);

            $this->assertArrayNotHasKey('otp', $response->json());
            $this->assertNotEmpty(Cache::get('otp_' . $testEmail));
        } finally {
            app()['env'] = $originalEnv;
        }
    }

    /**
     * Test verifyOtp endpoint validation and success
     */
    public function test_verify_otp_endpoint(): void
    {
        $testEmail = 'verifytest@regtest.com';
        Cache::put('otp_' . $testEmail, '123456', now()->addMinutes(10));

        // Wrong OTP
        $responseBad = $this->postJson('/api/verify-otp', [
            'email' => $testEmail,
            'otp' => '999999',
        ]);
        $responseBad->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'verified' => false,
            ]);

        // Malformed OTP (e.g. 5 digits)
        $responseMalformed = $this->postJson('/api/verify-otp', [
            'email' => $testEmail,
            'otp' => '12345',
        ]);
        $responseMalformed->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        // Correct OTP
        $responseOk = $this->postJson('/api/verify-otp', [
            'email' => $testEmail,
            'otp' => '123456',
        ]);
        $responseOk->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'verified' => true,
            ]);
    }

    /**
     * Test final registration requires all fields and valid OTP
     */
    public function test_register_validates_all_fields_and_otp(): void
    {
        $testEmail = 'finalreg@regtest.com';
        Cache::put('otp_' . $testEmail, '654321', now()->addMinutes(10));

        // Missing terms_accepted
        $resNoTerms = $this->postJson('/api/register', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => 'Final Candidate',
            'email' => $testEmail,
            'password' => 'secret123',
            'otp' => '654321',
            'terms_accepted' => false,
        ]);
        $resNoTerms->assertStatus(422)
            ->assertJsonValidationErrors(['terms_accepted']);

        // Invalid sponsor
        $resBadSponsor = $this->postJson('/api/register', [
            'sponsor_id' => 'NO_SUCH_SPONSOR',
            'name' => 'Final Candidate',
            'email' => $testEmail,
            'password' => 'secret123',
            'otp' => '654321',
            'terms_accepted' => true,
        ]);
        $resBadSponsor->assertStatus(422)
            ->assertJsonValidationErrors(['sponsor_id']);

        // Invalid OTP code
        $resBadOtp = $this->postJson('/api/register', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => 'Final Candidate',
            'email' => $testEmail,
            'password' => 'secret123',
            'otp' => '000000',
            'terms_accepted' => true,
        ]);
        $resBadOtp->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        // Successful registration
        $resOk = $this->postJson('/api/register', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => 'Final Candidate',
            'email' => $testEmail,
            'password' => 'secret123',
            'otp' => '654321',
            'terms_accepted' => true,
        ]);

        $resOk->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'MLM Registration successful!',
            ])
            ->assertJsonStructure([
                'status',
                'message',
                'user' => ['id', 'user_code', 'sponsor_id', 'name', 'email'],
                'token',
                'token_type',
            ]);

        // Check user exists in database with verified sponsor and verified email
        $created = User::where('email', $testEmail)->first();
        $this->assertNotNull($created);
        $this->assertEquals($this->sponsor->user_code, $created->sponsor_id);
        $this->assertNotNull($created->email_verified_at);

        // Verify OTP is cleared immediately from cache to prevent replay
        $this->assertNull(Cache::get('otp_' . $testEmail));

        // Replay attempt must fail
        $resReplay = $this->postJson('/api/register', [
            'sponsor_id' => $this->sponsor->user_code,
            'name' => 'Final Candidate',
            'email' => 'another@regtest.com',
            'password' => 'secret123',
            'otp' => '654321',
            'terms_accepted' => true,
        ]);
        $resReplay->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    }
}
