<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Seed essential catalog reference categories.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Software & IT', 'type' => 'both', 'icon' => '💻'],
            ['name' => 'Design & Creative', 'type' => 'both', 'icon' => '🎨'],
            ['name' => 'Legal & Compliance', 'type' => 'service', 'icon' => '⚖️'],
            ['name' => 'Marketing & SEO', 'type' => 'both', 'icon' => '📈'],
            ['name' => 'Electronics & Hardware', 'type' => 'product', 'icon' => '🔌'],
            ['name' => 'Finance & Accounting', 'type' => 'service', 'icon' => '📊'],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'type' => $cat['type'],
                    'icon' => $cat['icon'],
                    'status' => 'active',
                ]
            );
        }
    }
}
