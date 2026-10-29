<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductCatalogSeeder extends Seeder
{
    public function run(): void
    {
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        Product::truncate();
        Service::truncate();
        Category::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        // 1. Seed Categories
        $categories = [
            ['name' => 'Software & IT', 'type' => 'both', 'icon' => '💻'],
            ['name' => 'Design & Creative', 'type' => 'both', 'icon' => '🎨'],
            ['name' => 'Legal & Compliance', 'type' => 'service', 'icon' => '⚖️'],
            ['name' => 'Marketing & SEO', 'type' => 'both', 'icon' => '📈'],
            ['name' => 'Electronics & Hardware', 'type' => 'product', 'icon' => '🔌'],
            ['name' => 'Finance & Accounting', 'type' => 'service', 'icon' => '📊'],
        ];

        foreach ($categories as $cat) {
            Category::create([
                'name' => $cat['name'],
                'slug' => Str::slug($cat['name']),
                'type' => $cat['type'],
                'icon' => $cat['icon'],
                'status' => 'active',
            ]);
        }

        // 2. Seed Products
        $products = [
            [
                'name' => 'Enterprise Cloud ERP Suite 2026',
                'category' => 'Software & IT',
                'owner_type' => 'business',
                'owner_name' => 'Skyline Technologies Pvt Ltd',
                'price' => 14999.00,
                'admin_commission_percent' => 15.00,
                'stock' => 45,
                'sku' => 'SKU-ERP-2026',
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
                'description' => 'Complete cloud-hosted ERP software for multi-branch retail, stock tracking, and automated GST billing.',
            ],
            [
                'name' => 'Corporate Brand Identity Vector Kit',
                'category' => 'Design & Creative',
                'owner_type' => 'freelancer',
                'owner_name' => 'Priya Patel (UI/UX Designer)',
                'price' => 3499.00,
                'admin_commission_percent' => 18.00,
                'stock' => 120,
                'sku' => 'SKU-DSGN-002',
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&auto=format&fit=crop&q=80',
                'description' => 'High resolution Figma & Illustrator brand templates, logos, typography, and stationery assets.',
            ],
            [
                'name' => 'High-Speed POS Thermal Receipt Printer',
                'category' => 'Electronics & Hardware',
                'owner_type' => 'business',
                'owner_name' => 'Apex Financial Systems',
                'price' => 6299.00,
                'admin_commission_percent' => 12.00,
                'stock' => 28,
                'sku' => 'SKU-POS-900',
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&auto=format&fit=crop&q=80',
                'description' => '80mm heavy-duty wireless Bluetooth and USB thermal receipt billing printer for supermarket counters.',
            ],
            [
                'name' => 'AI Marketing Lead Accelerator Pro',
                'category' => 'Marketing & SEO',
                'owner_type' => 'business',
                'owner_name' => 'GrowthX Media Solutions',
                'price' => 7999.00,
                'admin_commission_percent' => 20.00,
                'stock' => 999,
                'sku' => 'SKU-AI-MKTG',
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80',
                'description' => 'Automated WhatsApp, SMS, and Email lead nurturing funnel with pre-built conversion pipelines.',
            ],
        ];

        foreach ($products as $p) {
            Product::create($p);
        }

        // 3. Seed Services
        $services = [
            [
                'name' => 'GST Registration & Annual Tax Filing',
                'category' => 'Legal & Compliance',
                'owner_type' => 'business',
                'owner_name' => 'Vyapar Adnet Tax Advisory',
                'price' => 2999.00,
                'admin_commission_percent' => 20.00,
                'duration' => '3 Business Days',
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
                'description' => 'End-to-end GST portal enrollment, government fee processing, and expert CA verification.',
            ],
            [
                'name' => 'UI/UX Mobile App Design Audit & Workshop',
                'category' => 'Design & Creative',
                'owner_type' => 'freelancer',
                'owner_name' => 'Priya Patel (UI/UX Designer)',
                'price' => 4999.00,
                'admin_commission_percent' => 15.00,
                'duration' => '2 Business Days',
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&auto=format&fit=crop&q=80',
                'description' => 'Comprehensive UX teardown of your mobile app or website with actionable wireframes.',
            ],
            [
                'name' => 'Custom Full-Stack MERN Web App Development',
                'category' => 'Software & IT',
                'owner_type' => 'freelancer',
                'owner_name' => 'Rohan Sharma (Full Stack Dev)',
                'price' => 24999.00,
                'admin_commission_percent' => 12.50,
                'duration' => '14 Business Days',
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=80',
                'description' => 'Scalable React & Node.js web portal with REST API architecture and payment gateway integration.',
            ],
            [
                'name' => 'Search Engine Organic Ranking Overhaul (SEO)',
                'category' => 'Marketing & SEO',
                'owner_type' => 'freelancer',
                'owner_name' => 'Amit Kumar (SEO Specialist)',
                'price' => 8499.00,
                'admin_commission_percent' => 18.00,
                'duration' => '30 Days Sprint',
                'status' => 'active',
                'image' => 'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?w=400&auto=format&fit=crop&q=80',
                'description' => 'Technical on-page SEO, high-authority backlink outreach, and Google Search Console optimization.',
            ],
        ];

        foreach ($services as $s) {
            Service::create($s);
        }
    }
}
