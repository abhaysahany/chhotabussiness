<?php

namespace Tests\Feature;

use App\Mail\PasswordResetOtpMail;
use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\EntityCategory;
use App\Models\FreelancerEntity;
use App\Models\User;
use App\Services\PasswordResetOtpService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ThreePanelForgotPasswordTest extends TestCase
{
    use DatabaseTransactions;

    protected EntityCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = EntityCategory::first() ?? EntityCategory::create([
            'name' => 'General Testing Category',
            'slug' => 'gen-test-' . uniqid(),
        ]);
    }

    /**
     * Test 1: Admin Panel Forgot Password full workflow (Send, Verify, Reset).
     */
    public function test_admin_forgot_password_flow_success(): void
    {
        Mail::fake();

        $adminEmail = 'admin_' . uniqid() . '@example.com';
        $admin = Admin::create([
            'name' => 'Admin Tester',
            'username' => 'admin_' . uniqid(),
            'email' => $adminEmail,
            'password' => Hash::make('OldPassword123!'),
            'role' => 'admin',
        ]);

        // 1. Send OTP
        $response = $this->postJson('/api/admin/forgot-password', [
            'login' => $admin->username,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ])
            ->assertJsonMissing(['otp']); // Production security: no raw OTP in response

        Mail::assertSent(PasswordResetOtpMail::class, function ($mail) use ($adminEmail) {
            return $mail->hasTo($adminEmail);
        });

        // Retrieve hashed challenge from cache to get the issued OTP
        $challengeKey = PasswordResetOtpService::challengeKey('admin', $admin->id);
        $this->assertTrue(Cache::has($challengeKey));
        $challenge = Cache::get($challengeKey);
        $this->assertNotEmpty($challenge['otp_hash']);

        // Since Mail was faked, find which OTP matches the hash (100000..999999)
        // Alternatively, test with PasswordResetOtpMail queued property
        $capturedOtp = null;
        Mail::assertSent(PasswordResetOtpMail::class, function ($mail) use (&$capturedOtp) {
            $capturedOtp = $mail->otp;
            return true;
        });

        $this->assertNotNull($capturedOtp);
        $this->assertTrue(Hash::check($capturedOtp, $challenge['otp_hash']));

        // 2. Verify OTP with correct code
        $verifyRes = $this->postJson('/api/admin/verify-otp', [
            'login' => $admin->email,
            'otp' => $capturedOtp,
        ]);
        $verifyRes->assertStatus(200)->assertJson(['status' => 'success']);

        // 3. Reset Password
        $resetRes = $this->postJson('/api/admin/reset-password', [
            'login' => $admin->username,
            'otp' => $capturedOtp,
            'password' => 'NewAdminPass2026!',
            'password_confirmation' => 'NewAdminPass2026!',
        ]);
        $resetRes->assertStatus(200)->assertJson(['status' => 'success']);

        // Confirm password hash was updated
        $admin->refresh();
        $this->assertTrue(Hash::check('NewAdminPass2026!', $admin->password));
        $this->assertFalse(Hash::check('OldPassword123!', $admin->password));

        // Challenge should be consumed
        $this->assertFalse(Cache::has($challengeKey));

        // Replay attempt must fail
        $replayRes = $this->postJson('/api/admin/reset-password', [
            'login' => $admin->username,
            'otp' => $capturedOtp,
            'password' => 'AnotherPass123!',
            'password_confirmation' => 'AnotherPass123!',
        ]);
        $replayRes->assertStatus(400);
    }

    /**
     * Test 2: Admin OTP verification attempt limit (evicts after 5 bad attempts).
     */
    public function test_admin_otp_throttling_after_max_failed_attempts(): void
    {
        Mail::fake();

        $admin = Admin::create([
            'name' => 'Admin BruteForce Test',
            'username' => 'admin_brute_' . uniqid(),
            'email' => 'admin_brute_' . uniqid() . '@example.com',
            'password' => Hash::make('AdminPass123!'),
            'role' => 'admin',
        ]);

        $this->postJson('/api/admin/forgot-password', ['login' => $admin->email]);

        $challengeKey = PasswordResetOtpService::challengeKey('admin', $admin->id);
        $this->assertTrue(Cache::has($challengeKey));

        // Submit 5 wrong OTPs
        for ($i = 1; $i <= 5; $i++) {
            $res = $this->postJson('/api/admin/verify-otp', [
                'login' => $admin->email,
                'otp' => '000000',
            ]);
            $res->assertStatus(400);
        }

        // 6th attempt should result in challenge invalidation
        $finalRes = $this->postJson('/api/admin/verify-otp', [
            'login' => $admin->email,
            'otp' => '000000',
        ]);
        $finalRes->assertStatus(429);
        $this->assertFalse(Cache::has($challengeKey));
    }

    /**
     * Test 3: Entity Panel Shared Email Isolation (Business vs Freelancer).
     */
    public function test_entity_shared_email_isolation_between_business_and_freelancer(): void
    {
        Mail::fake();

        $initialUserCount = User::count();
        $sharedEmail = 'shared_' . uniqid() . '@company.com';

        // Create BusinessEntity
        $business = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Acme Shared Corp',
            'owner_name' => 'Alice Corp',
            'email' => $sharedEmail,
            'phone' => '9111111111',
            'password' => Hash::make('OldBusinessPass123!'),
            'address' => '123 Corp Way',
            'status' => 'active',
        ]);

        // Create FreelancerEntity with the EXACT SAME EMAIL
        $freelancer = FreelancerEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Alice Freelancer',
            'title' => 'Freelance Consultant',
            'email' => $sharedEmail,
            'phone' => '9222222222',
            'password' => Hash::make('OldFreelancerPass456!'),
            'status' => 'active',
        ]);

        // 1. Calling forgot password without entity_type when email is shared requires type selection
        $ambiguousRes = $this->postJson('/api/entity/forgot-password', [
            'email' => $sharedEmail,
        ]);
        $ambiguousRes->assertStatus(422)
            ->assertJson(['requires_type_selection' => true]);

        // 2. Request OTP explicitly for Business Entity
        $bizOtpRes = $this->postJson('/api/entity/forgot-password', [
            'email' => $sharedEmail,
            'entity_type' => 'business',
        ]);
        $bizOtpRes->assertStatus(200)
            ->assertJsonMissing(['otp']);

        $bizCapturedOtp = null;
        Mail::assertSent(PasswordResetOtpMail::class, function ($mail) use (&$bizCapturedOtp) {
            $bizCapturedOtp = $mail->otp;
            return true;
        });

        // 3. Reset password for Business Entity
        $bizResetRes = $this->postJson('/api/entity/reset-password', [
            'email' => $sharedEmail,
            'entity_type' => 'business',
            'otp' => $bizCapturedOtp,
            'password' => 'BrandNewBusinessPass999!',
            'password_confirmation' => 'BrandNewBusinessPass999!',
        ]);
        $bizResetRes->assertStatus(200);

        // 4. Verify ONLY BusinessEntity password changed
        $business->refresh();
        $freelancer->refresh();

        $this->assertTrue(Hash::check('BrandNewBusinessPass999!', $business->password), 'Business password must be updated!');
        $this->assertTrue(Hash::check('OldFreelancerPass456!', $freelancer->password), 'Freelancer password must remain UNTOUCHED!');
        $this->assertFalse(Hash::check('BrandNewBusinessPass999!', $freelancer->password));

        // 5. Verify NO unwanted users record was created
        $this->assertEquals($initialUserCount, User::count(), 'Zero users records must be inserted during entity password reset!');
    }

    /**
     * Test 4: User Panel Forgot Password with email and user_code lookup.
     */
    public function test_user_forgot_password_flow_success(): void
    {
        Mail::fake();

        $userEmail = 'member_' . uniqid() . '@example.com';
        $userCode = 'AD' . rand(10000, 99999);
        $user = User::create([
            'name' => 'John Member',
            'email' => $userEmail,
            'user_code' => $userCode,
            'sponsor_id' => 'ROOT',
            'password' => Hash::make('OldMemberPass123!'),
        ]);

        // 1. Request OTP using user_code
        $reqRes = $this->postJson('/api/forgot-password', [
            'email' => $userCode,
        ]);

        $reqRes->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'email' => $userEmail,
            ])
            ->assertJsonMissing(['otp']); // No raw OTP in API response!

        $userCapturedOtp = null;
        Mail::assertSent(PasswordResetOtpMail::class, function ($mail) use (&$userCapturedOtp, $userEmail) {
            $userCapturedOtp = $mail->otp;
            return $mail->hasTo($userEmail);
        });

        $this->assertNotNull($userCapturedOtp);

        // 2. Verify OTP
        $verifyRes = $this->postJson('/api/verify-reset-otp', [
            'email' => $userCode,
            'otp' => $userCapturedOtp,
        ]);
        $verifyRes->assertStatus(200)->assertJson(['status' => 'success']);

        // 3. Reset Password
        $resetRes = $this->postJson('/api/reset-password', [
            'email' => $userEmail,
            'otp' => $userCapturedOtp,
            'password' => 'NewMemberPassword2026!',
            'password_confirmation' => 'NewMemberPassword2026!',
        ]);
        $resetRes->assertStatus(200)->assertJson(['status' => 'success']);

        // 4. Confirm database updated
        $user->refresh();
        $this->assertTrue(Hash::check('NewMemberPassword2026!', $user->password));
        $this->assertFalse(Hash::check('OldMemberPass123!', $user->password));
    }

    /**
     * Test 5: Mail Failure handling gracefully evicts challenge and returns 500.
     */
    public function test_mail_failure_handling_purges_challenge(): void
    {
        // Simulate mail failure by mocking Mail to throw exception
        Mail::shouldReceive('to->send')
            ->once()
            ->andThrow(new \Exception('SMTP connection timeout: Connection refused'));

        $user = User::create([
            'name' => 'Failing Mail User',
            'email' => 'failmail_' . uniqid() . '@example.com',
            'user_code' => 'AD' . rand(10000, 99999),
            'sponsor_id' => 'ROOT',
            'password' => Hash::make('Password123!'),
        ]);

        $res = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $res->assertStatus(500);

        // Challenge must not linger in cache
        $challengeKey = PasswordResetOtpService::challengeKey('user', $user->id);
        $this->assertFalse(Cache::has($challengeKey), 'Challenge must be purged on mail failure!');
    }

    /**
     * Test 6: Freelancer Forgot Password explicitly updates freelancer and leaves business untouched.
     */
    public function test_freelancer_forgot_password_flow_with_shared_email(): void
    {
        Mail::fake();

        $sharedEmail = 'freelancer_shared_' . uniqid() . '@domain.com';

        $business = BusinessEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Agency Alpha',
            'owner_name' => 'Owner Alpha',
            'email' => $sharedEmail,
            'phone' => '9333333333',
            'password' => Hash::make('AgencySecret123!'),
            'address' => '456 Agency Street',
            'status' => 'active',
        ]);

        $freelancer = FreelancerEntity::create([
            'entity_category_id' => $this->category->id,
            'name' => 'Bob Designer',
            'title' => 'UI/UX Lead',
            'email' => $sharedEmail,
            'phone' => '9444444444',
            'password' => Hash::make('BobSecret123!'),
            'status' => 'active',
        ]);

        // Request reset for freelancer explicitly
        $otpRes = $this->postJson('/api/entity/forgot-password', [
            'email' => $sharedEmail,
            'entity_type' => 'freelancer',
        ]);
        $otpRes->assertStatus(200);

        $capturedOtp = null;
        Mail::assertSent(PasswordResetOtpMail::class, function ($mail) use (&$capturedOtp) {
            $capturedOtp = $mail->otp;
            return true;
        });

        // Reset password for freelancer
        $resetRes = $this->postJson('/api/entity/reset-password', [
            'email' => $sharedEmail,
            'entity_type' => 'freelancer',
            'otp' => $capturedOtp,
            'password' => 'BobNewPassword2026!',
            'password_confirmation' => 'BobNewPassword2026!',
        ]);
        $resetRes->assertStatus(200);

        $business->refresh();
        $freelancer->refresh();

        $this->assertTrue(Hash::check('BobNewPassword2026!', $freelancer->password));
        $this->assertTrue(Hash::check('AgencySecret123!', $business->password), 'Business password must remain unchanged!');
    }

    /**
     * Test 7: Validation failures on mismatched password confirmation and nonexistent accounts.
     */
    public function test_validation_errors_and_nonexistent_accounts(): void
    {
        // 1. Non-existent admin
        $adminRes = $this->postJson('/api/admin/forgot-password', ['login' => 'nonexistent_admin_' . uniqid()]);
        $adminRes->assertStatus(404);

        // 2. Non-existent entity
        $entityRes = $this->postJson('/api/entity/forgot-password', ['email' => 'nonexistent_entity_' . uniqid() . '@example.com']);
        $entityRes->assertStatus(404);

        // 3. Non-existent user
        $userRes = $this->postJson('/api/forgot-password', ['email' => 'nonexistent_user_' . uniqid() . '@example.com']);
        $userRes->assertStatus(404);

        // 4. Password confirmation mismatch
        Mail::fake();
        $user = User::create([
            'name' => 'Mismatch User',
            'email' => 'mismatch_' . uniqid() . '@example.com',
            'user_code' => 'AD' . rand(10000, 99999),
            'sponsor_id' => 'ROOT',
            'password' => Hash::make('Password123!'),
        ]);

        $this->postJson('/api/forgot-password', ['email' => $user->email]);
        $capturedOtp = null;
        Mail::assertSent(PasswordResetOtpMail::class, function ($mail) use (&$capturedOtp) {
            $capturedOtp = $mail->otp;
            return true;
        });

        $mismatchRes = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'otp' => $capturedOtp,
            'password' => 'ValidPass123!',
            'password_confirmation' => 'DifferentPass123!',
        ]);
        $mismatchRes->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
