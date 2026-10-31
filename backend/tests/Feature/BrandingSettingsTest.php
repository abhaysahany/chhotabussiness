<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BrandingSettingsTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'chhotabiz',
        ]);

        // Clean up test admin, users and settings
        Admin::where('email', 'like', '%@test.com')->delete();
        User::where('email', 'like', '%@test.com')->delete();
        SystemSetting::where('key', 'app_name')->delete();

        // Create test active administrator
        $this->admin = Admin::create([
            'name' => 'Branding Admin',
            'email' => 'branding_admin@test.com',
            'username' => 'branding_admin',
            'password' => Hash::make('password123'),
            'role' => 'superadmin',
            'status' => 'active',
        ]);
    }

    protected function tearDown(): void
    {
        Admin::where('email', 'like', '%@test.com')->delete();
        User::where('email', 'like', '%@test.com')->delete();
        SystemSetting::where('key', 'app_name')->delete();
        parent::tearDown();
    }

    /**
     * Test public GET /api/branding returns default AddNet when unconfigured
     */
    public function test_public_branding_endpoint_returns_default_name(): void
    {
        $response = $this->getJson('/api/branding');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'app_name' => 'AddNet',
                'branding' => [
                    'app_name' => 'AddNet',
                ],
            ]);
    }

    /**
     * Test unauthenticated or unauthorized access to save branding is rejected
     */
    public function test_save_branding_requires_authenticated_active_admin(): void
    {
        // 1. Unauthenticated request
        $resGuest = $this->postJson('/api/admin/settings/branding', [
            'app_name' => 'NewBrand',
        ]);
        $resGuest->assertStatus(401);

        // 2. Regular user (non-admin) request
        $regularUser = User::create([
            'name' => 'Regular Member',
            'email' => 'regmember@test.com',
            'password' => Hash::make('password123'),
            'user_code' => 'CB999988',
        ]);

        $resUser = $this->actingAs($regularUser, 'sanctum')
            ->postJson('/api/admin/settings/branding', [
                'app_name' => 'NewBrand',
            ]);
        $resUser->assertStatus(403);
    }

    /**
     * Test validation rules for application name (empty, short, long)
     */
    public function test_save_branding_validates_app_name(): void
    {
        // Empty string
        $resEmpty = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/settings/branding', [
                'app_name' => '',
            ]);
        $resEmpty->assertStatus(422)
            ->assertJsonValidationErrors(['app_name']);

        // Whitespace only
        $resSpaces = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/settings/branding', [
                'app_name' => '    ',
            ]);
        $resSpaces->assertStatus(422);

        // Too short (< 2 chars)
        $resShort = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/settings/branding', [
                'app_name' => 'A',
            ]);
        $resShort->assertStatus(422)
            ->assertJsonValidationErrors(['app_name']);

        // Too long (> 50 chars)
        $resLong = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/settings/branding', [
                'app_name' => str_repeat('X', 55),
            ]);
        $resLong->assertStatus(422)
            ->assertJsonValidationErrors(['app_name']);
    }

    /**
     * Test active admin can update the global application name persistently
     */
    public function test_admin_can_update_and_change_application_name(): void
    {
        // 1. Save new name "AddNet Global"
        $resUpdate1 = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/settings/branding', [
                'app_name' => 'AddNet Global',
            ]);

        $resUpdate1->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'app_name' => 'AddNet Global',
            ]);

        // Verify persisted in system_settings database table
        $this->assertEquals('AddNet Global', SystemSetting::get('app_name'));

        // Verify public branding endpoint reflects new name
        $resPublic = $this->getJson('/api/branding');
        $resPublic->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'app_name' => 'AddNet Global',
            ]);

        // Verify status endpoint also reflects new name
        $resStatus = $this->getJson('/api/status');
        $resStatus->assertStatus(200)
            ->assertJson([
                'app_name' => 'AddNet Global',
            ]);

        // 2. Admin changes the name again to "AddNet Enterprise"
        $resUpdate2 = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/settings/branding', [
                'app_name' => 'AddNet Enterprise',
            ]);

        $resUpdate2->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'app_name' => 'AddNet Enterprise',
            ]);

        $this->assertEquals('AddNet Enterprise', SystemSetting::get('app_name'));
        $this->assertEquals('AddNet Enterprise', $this->getJson('/api/branding')->json('app_name'));
    }
}
