<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Product;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductSaveTest extends TestCase
{
    use DatabaseTransactions;

    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        config(['database.connections.mysql.database' => 'ad_net']);
        config(['database.default' => 'mysql']);
        \Illuminate\Support\Facades\DB::purge('mysql');

        $this->admin = Admin::where('status', 'active')->first() ?? Admin::create([
            'name' => 'Super Administrator',
            'username' => 'test_admin_' . uniqid(),
            'email' => 'admin_test_' . uniqid() . '@example.com',
            'password' => bcrypt('password123'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);
    }

    public function test_product_save_persists_in_database_and_returns_success(): void
    {
        $payload = [
            'name' => 'Enterprise ERP Suite ' . uniqid(),
            'price' => 14999.00,
            'category' => 'Software & IT',
            'owner_type' => 'business',
            'owner_name' => 'Skyline Technologies Pvt Ltd',
            'admin_commission_percent' => 15.00,
            'stock' => 50,
            'sku' => 'SKU-ERP-' . rand(1000, 9999),
            'status' => 'active',
            'description' => 'Complete enterprise management solution.',
            'image' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/catalog/products', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Product successfully created in MySQL database.',
            ]);

        $createdProduct = $response->json('product');
        $this->assertNotNull($createdProduct);
        $this->assertEquals($payload['name'], $createdProduct['name']);
        $this->assertEquals(14999.00, (float)$createdProduct['price']);
        $this->assertEquals('Software & IT', $createdProduct['category']);
        $this->assertEquals('Skyline Technologies Pvt Ltd', $createdProduct['owner_name']);

        // Verify direct database persistence
        $this->assertDatabaseHas('products', [
            'id' => $createdProduct['id'],
            'name' => $payload['name'],
            'price' => 14999.00,
            'sku' => $payload['sku'],
        ]);

        // Verify product appears in the catalog listing
        $catalogResponse = $this->getJson('/api/catalog/products');
        $catalogResponse->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $catalogProducts = $catalogResponse->json('products');
        $found = collect($catalogProducts)->firstWhere('id', $createdProduct['id']);
        $this->assertNotNull($found, 'Newly saved product must appear in catalog listing');
    }

    public function test_product_save_handles_file_upload_correctly(): void
    {
        $file = UploadedFile::fake()->create('product_test.jpg', 100, 'image/jpeg');

        $payload = [
            'name' => 'Hardware Diagnostic Kit ' . uniqid(),
            'price' => 3499.00,
            'category' => 'Electronics & Hardware',
            'owner_type' => 'business',
            'owner_name' => 'Skyline Technologies Pvt Ltd',
            'admin_commission_percent' => 12.00,
            'stock' => 20,
            'image_file' => $file,
        ];

        $response = $this->actingAs($this->admin)
            ->post('/api/catalog/products', $payload);

        $response->assertStatus(201)
            ->assertJson(['status' => 'success']);

        $createdProduct = $response->json('product');
        $this->assertNotNull($createdProduct);
        $this->assertStringContainsString('uploads/catalog/product_', $createdProduct['image']);

        // Clean up created upload file if exists
        $imagePath = public_path(parse_url($createdProduct['image'], PHP_URL_PATH));
        if (file_exists($imagePath)) {
            @unlink($imagePath);
        }
    }

    public function test_product_save_validates_required_fields_and_rejects_invalid_data(): void
    {
        // 1. Missing name and negative price
        $response = $this->actingAs($this->admin)
            ->postJson('/api/catalog/products', [
                'price' => -100,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'price']);

        // 2. Commission percent exceeding 100
        $response2 = $this->actingAs($this->admin)
            ->postJson('/api/catalog/products', [
                'name' => 'Invalid Commission Product',
                'price' => 1000,
                'admin_commission_percent' => 120,
            ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['admin_commission_percent']);
    }

    public function test_product_update_persists_changes_in_database(): void
    {
        $product = Product::create([
            'name' => 'Original Name ' . uniqid(),
            'price' => 500,
            'category' => 'Software & IT',
            'owner_type' => 'business',
            'owner_name' => 'Skyline Technologies Pvt Ltd',
            'admin_commission_percent' => 10,
            'stock' => 10,
            'status' => 'active',
        ]);

        $updatedName = 'Updated Name ' . uniqid();
        $response = $this->actingAs($this->admin)
            ->putJson("/api/catalog/products/{$product->id}", [
                'name' => $updatedName,
                'price' => 750,
                'stock' => 15,
            ]);

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => $updatedName,
            'price' => 750.00,
            'stock' => 15,
        ]);
    }
}
