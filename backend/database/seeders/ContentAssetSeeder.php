<?php

namespace Database\Seeders;

use App\Models\ContentAsset;
use Illuminate\Database\Seeder;

class ContentAssetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $assets = [
            [
                'title' => 'Vyapar Adnet Official Launch Banner',
                'type' => 'image',
                'category' => 'Marketing Banners',
                'entity_type' => 'vyapar_adnet',
                'entity_name' => 'Vyapar Adnet System Entity',
                'file_url' => 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
                'thumbnail' => 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300',
                'tags' => 'Launch, Banner, Social, Brand',
                'downloads' => 342,
                'shares' => 128,
                'status' => 'published',
            ],
            [
                'title' => 'Skyline Tech Business Overview Promo',
                'type' => 'video',
                'category' => 'Promo Videos',
                'entity_type' => 'business',
                'entity_name' => 'Skyline Technologies Pvt Ltd',
                'file_url' => 'https://www.w3schools.com/html/mov_bbb.mp4',
                'thumbnail' => 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300',
                'tags' => 'Video, Promo, Technology, Explainer',
                'downloads' => 189,
                'shares' => 95,
                'status' => 'published',
            ],
            [
                'title' => 'Priya Patel Freelance Design Showreel Sound',
                'type' => 'audio',
                'category' => 'Brand Jingles',
                'entity_type' => 'freelance',
                'entity_name' => 'Priya Patel UI/UX Freelance',
                'file_url' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                'thumbnail' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
                'tags' => 'Audio, Jingle, UI/UX, Creative',
                'downloads' => 512,
                'shares' => 230,
                'status' => 'published',
            ],
            [
                'title' => 'GST Registration & Tax Guide Flyer PDF',
                'type' => 'pdf',
                'category' => 'Marketing Materials',
                'entity_type' => 'vyapar_adnet',
                'entity_name' => 'Vyapar Adnet System Entity',
                'file_url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                'thumbnail' => 'https://images.unsplash.com/photo-1568667256549-094345857637?w=300',
                'tags' => 'PDF, Tax, GST, Flyer, Guide',
                'downloads' => 640,
                'shares' => 310,
                'status' => 'published',
            ],
        ];

        foreach ($assets as $item) {
            ContentAsset::updateOrCreate(
                ['title' => $item['title']],
                $item
            );
        }
    }
}
