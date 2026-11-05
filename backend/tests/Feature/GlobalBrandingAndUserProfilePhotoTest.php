<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class GlobalBrandingAndUserProfilePhotoTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;
    protected User $user1;
    protected User $user2;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => env('DB_DATABASE', 'chhotabiz_test'),
        ]);

        Admin::where('email', 'like', '%@test.com')->delete();
        User::where('email', 'like', '%@test.com')->delete();
        SystemSetting::whereIn('key', ['app_name', 'company_logo'])->delete();

        // Admin
        $this->admin = Admin::create([
            'name' => 'Super Admin',
            'email' => 'superadmin_branding@test.com',
            'username' => 'superadmin_branding',
            'password' => Hash::make('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);

        // User 1
        $this->user1 = User::create([
            'name' => 'Alice Member',
            'email' => 'alice_member@test.com',
            'password' => Hash::make('password123'),
            'user_code' => 'CB_ALICE01',
            'sponsor_id' => 'ROOT',
            'status' => 'active',
            'sponsor_onboarding_status' => 'completed',
        ]);

        // User 2
        $this->user2 = User::create([
            'name' => 'Bob Member',
            'email' => 'bob_member@test.com',
            'password' => Hash::make('password123'),
            'user_code' => 'CB_BOB02',
            'sponsor_id' => 'ROOT',
            'status' => 'active',
            'sponsor_onboarding_status' => 'completed',
        ]);
    }

    protected function tearDown(): void
    {
        Admin::where('email', 'like', '%@test.com')->delete();
        User::where('email', 'like', '%@test.com')->delete();
        SystemSetting::whereIn('key', ['app_name', 'company_logo'])->delete();
        parent::tearDown();
    }

    /**
     * Test public GET /api/branding returns proper company name and logo structure
     */
    public function test_public_branding_returns_consistent_name_and_logo_urls(): void
    {
        $res = $this->getJson('/api/branding');
        $res->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'app_name',
                'company_name',
                'company_logo_url',
                'logo_url',
                'branding' => [
                    'app_name',
                    'company_name',
                    'company_logo_url',
                    'logo_url',
                ],
            ]);
    }

    /**
     * Test Admin can upload official company logo and update company name
     */
    public function test_admin_can_upload_logo_and_update_company_name(): void
    {
        // 1. Prepare fake image file for logo
        $logoFile = UploadedFile::fake()->create('custom_brand_logo.png', 10, 'image/png');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->post('/api/admin/settings/branding', [
                'app_name' => 'Vyapar AdNET Global',
                'company_logo' => $logoFile,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'app_name' => 'Vyapar AdNET Global',
                'company_name' => 'Vyapar AdNET Global',
            ]);

        $logoUrl = $response->json('company_logo_url');
        $this->assertNotEmpty($logoUrl);
        $this->assertStringContainsString('company_logo_', $logoUrl);

        // 2. Verify setting saved in database
        $savedLogo = SystemSetting::get('company_logo');
        $this->assertNotEmpty($savedLogo);
        $this->assertStringStartsWith('uploads/branding/', $savedLogo);

        // 3. Verify public endpoint reflects updated branding
        $publicRes = $this->getJson('/api/branding');
        $publicRes->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'app_name' => 'Vyapar AdNET Global',
                'company_name' => 'Vyapar AdNET Global',
            ]);
        $this->assertEquals($savedLogo, $publicRes->json('company_logo'));

        // Clean up uploaded test file
        $diskPath = public_path($savedLogo);
        if (File::exists($diskPath)) {
            @File::delete($diskPath);
        }
    }

    /**
     * Test Admin can reset logo back to default
     */
    public function test_admin_can_reset_company_logo(): void
    {
        // Set a logo first
        SystemSetting::set('company_logo', 'uploads/branding/test_logo.png', 'branding');

        $res = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/settings/branding', [
                'reset_logo' => true,
            ]);

        $res->assertStatus(200);
        $this->assertNull(SystemSetting::get('company_logo'));
        $this->assertStringContainsString('logo.png', $res->json('company_logo_url'));
    }

    /**
     * Test User profile photo upload persists to database and is returned via /me and /user/profile
     */
    public function test_user_can_upload_and_persist_profile_photo(): void
    {
        // Fake user avatar image
        $avatarFile = UploadedFile::fake()->create('my_profile_photo.jpg', 20, 'image/jpeg');

        $uploadRes = $this->actingAs($this->user1, 'sanctum')
            ->post('/api/user/profile/photo', [
                'photo' => $avatarFile,
            ]);

        $uploadRes->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        $avatarRelative = $uploadRes->json('avatar');
        $avatarUrl = $uploadRes->json('avatar_url');

        $this->assertNotEmpty($avatarRelative);
        $this->assertStringStartsWith('uploads/avatars/', $avatarRelative);
        $this->assertStringContainsString($avatarRelative, $avatarUrl);

        // Verify persisted in users table
        $this->user1->refresh();
        $this->assertEquals($avatarRelative, $this->user1->avatar);
        $this->assertNotNull($this->user1->avatar_url);

        // Verify /me returns the updated avatar_url
        $meRes = $this->actingAs($this->user1, 'sanctum')->getJson('/api/me');
        $meRes->assertStatus(200);
        $this->assertEquals($avatarRelative, $meRes->json('user.avatar'));
        $this->assertEquals($avatarUrl, $meRes->json('user.avatar_url'));

        // Verify /user/profile returns the updated avatar_url
        $profileRes = $this->actingAs($this->user1, 'sanctum')->getJson('/api/user/profile');
        $profileRes->assertStatus(200);
        $this->assertEquals($avatarRelative, $profileRes->json('user.avatar'));

        // Clean up uploaded test file
        $diskPath = public_path($avatarRelative);
        if (File::exists($diskPath)) {
            @File::delete($diskPath);
        }
    }

    /**
     * Test User can update personal details and remove profile photo
     */
    public function test_user_can_update_profile_details_and_remove_photo(): void
    {
        // 1. Update personal details
        $updateRes = $this->actingAs($this->user1, 'sanctum')
            ->postJson('/api/user/profile', [
                'name' => 'Alice Verified Member',
                'phone' => '+91 9123456789',
                'dob' => '1995-05-20',
                'gender' => 'Female',
                'address' => '456 Business Road, Suite 10',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'country' => 'India',
                'zip_code' => '411001',
                'bio' => 'Professional network builder.',
            ]);

        $updateRes->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'user' => [
                    'name' => 'Alice Verified Member',
                    'phone' => '+91 9123456789',
                    'dob' => '1995-05-20',
                    'gender' => 'Female',
                    'city' => 'Pune',
                ],
            ]);

        $this->user1->refresh();
        $this->assertEquals('Alice Verified Member', $this->user1->name);
        $this->assertEquals('Pune', $this->user1->city);

        // 2. Remove profile photo
        $this->user1->avatar = 'uploads/avatars/sample.png';
        $this->user1->save();

        $removeRes = $this->actingAs($this->user1, 'sanctum')
            ->deleteJson('/api/user/profile/photo');

        $removeRes->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'avatar' => null,
                'avatar_url' => null,
            ]);

        $this->user1->refresh();
        $this->assertNull($this->user1->avatar);
        $this->assertNull($this->user1->avatar_url);
    }

    /**
     * Test strict separation: User photo != Admin photo != Company Logo
     */
    public function test_strict_separation_between_user_photo_and_company_logo(): void
    {
        // 1. Admin sets company logo
        SystemSetting::set('company_logo', 'uploads/branding/official_corp_logo.png', 'branding');

        // 2. User 1 uploads user photo
        $avatarFile = UploadedFile::fake()->create('alice.jpg', 20, 'image/jpeg');
        $this->actingAs($this->user1, 'sanctum')->post('/api/user/profile/photo', ['photo' => $avatarFile]);

        $this->user1->refresh();
        $this->user2->refresh();

        // 3. Verify user 1 photo does NOT alter company logo
        $this->assertEquals('uploads/branding/official_corp_logo.png', SystemSetting::get('company_logo'));

        // 4. Verify user 2 does NOT inherit user 1's photo or company logo
        $this->assertNull($this->user2->avatar);
        $this->assertNull($this->user2->avatar_url);

        // 5. Verify user 1 does NOT have company logo as avatar
        $this->assertNotEquals(SystemSetting::get('company_logo'), $this->user1->avatar);
        $this->assertStringNotContainsString('logo.png', $this->user1->avatar);

        // Clean up
        if ($this->user1->avatar && File::exists(public_path($this->user1->avatar))) {
            @File::delete(public_path($this->user1->avatar));
        }
    }
}
