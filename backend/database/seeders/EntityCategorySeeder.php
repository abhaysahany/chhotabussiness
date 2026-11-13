<?php

namespace Database\Seeders;

use App\Models\EntityCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EntityCategorySeeder extends Seeder
{
    /**
     * Seed essential entity categories for business & freelancer classification.
     */
    public function run(): void
    {
        $categoriesData = [
            [
                'name' => 'Taxation & Accounting',
                'description' => 'GST Registration, ITR Filing, Audit & Bookkeeping Services',
                'icon' => 'calculator',
                'badge_color' => '#6366f1',
            ],
            [
                'name' => 'Legal & Corporate Services',
                'description' => 'Company Registration, Trademark, Patents & Legal Documentation',
                'icon' => 'scale',
                'badge_color' => '#8b5cf6',
            ],
            [
                'name' => 'IT & Software Development',
                'description' => 'Web Apps, Mobile Apps, Cloud Services & Custom Software Solutions',
                'icon' => 'code',
                'badge_color' => '#3b82f6',
            ],
            [
                'name' => 'Digital Marketing & Ads',
                'description' => 'SEO, Social Media Marketing, PPC Ads & Brand Growth',
                'icon' => 'trending-up',
                'badge_color' => '#ec4899',
            ],
            [
                'name' => 'Financial Consulting',
                'description' => 'Business Loans, Venture Funding, Wealth Management & Valuation',
                'icon' => 'dollar-sign',
                'badge_color' => '#10b981',
            ],
        ];

        foreach ($categoriesData as $c) {
            EntityCategory::firstOrCreate(
                ['slug' => Str::slug($c['name'])],
                [
                    'name' => $c['name'],
                    'description' => $c['description'],
                    'icon' => $c['icon'],
                    'badge_color' => $c['badge_color'],
                    'status' => 'active',
                ]
            );
        }
    }
}
