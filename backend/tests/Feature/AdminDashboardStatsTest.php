<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\FreelancerEntity;
use App\Models\EntityCategory;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class AdminDashboardStatsTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_dashboard_stats_endpoint_returns_valid_merchant_partners_schema()
    {
        $admin = Admin::first();
        if (!$admin) {
            $admin = Admin::create([
                'name' => 'Test Admin',
                'username' => 'testadmin_' . time(),
                'email' => 'testadmin_' . time() . '@example.com',
                'password' => bcrypt('password123'),
                'role' => 'superadmin',
            ]);
        }

        $token = $admin->createToken('test_dashboard_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->getJson('/api/admin/dashboard-stats');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'telemetry',
            'kpis',
            'charts',
            'recentTransactions',
            'merchantPartners',
        ]);

        $data = $response->json();
        $this->assertEquals('success', $data['status']);

        // Verify each merchant partner has a valid category (either string or structured array with badge_color, status, name)
        foreach ($data['merchantPartners'] as $partner) {
            $this->assertArrayHasKey('name', $partner);
            $this->assertArrayHasKey('category', $partner);
            $this->assertArrayHasKey('gmv', $partner);
            $this->assertArrayHasKey('adminCut', $partner);
            $this->assertArrayHasKey('count', $partner);
            $this->assertArrayHasKey('share', $partner);

            $category = $partner['category'];
            if (is_array($category)) {
                $this->assertArrayHasKey('name', $category);
                $this->assertArrayHasKey('badge_color', $category);
                $this->assertArrayHasKey('status', $category);
            } else {
                $this->assertIsString($category);
            }
        }
    }
}
