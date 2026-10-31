<?php

namespace Database\Seeders;

use App\Models\Reward;
use App\Models\RewardClaim;
use App\Models\User;
use Illuminate\Database\Seeder;

class RewardSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Rewards Master Catalog
        $rewards = [
            [
                'title' => 'Smart Fitness Band & Pulse Tracker',
                'image' => 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600',
                'required_bp' => 50,
                'category' => 'Gadgets & Electronics',
                'description' => 'Waterproof OLED smart fitness band with continuous heart rate monitoring, step tracking, sleep analytics, and 14-day battery life.',
                'reward_value_inr' => 2499.00,
                'status' => 'active',
            ],
            [
                'title' => 'High-Bass Active Noise Cancelling Earbuds',
                'image' => 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
                'required_bp' => 100,
                'category' => 'Gadgets & Electronics',
                'description' => 'Premium wireless Bluetooth 5.3 earbuds with 35dB hybrid active noise cancellation, quad-mic ENC call clarity, and wireless charging case.',
                'reward_value_inr' => 4999.00,
                'status' => 'active',
            ],
            [
                'title' => 'Executive Smart Watch with AMOLED Display',
                'image' => 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
                'required_bp' => 200,
                'category' => 'Gadgets & Electronics',
                'description' => 'Luxury stainless steel Bluetooth calling smartwatch with vibrant always-on AMOLED display, GPS navigation, and 100+ sports modes.',
                'reward_value_inr' => 8999.00,
                'status' => 'active',
            ],
            [
                'title' => '5G Android Tablet with Stylus Pen (128GB)',
                'image' => 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600',
                'required_bp' => 500,
                'category' => 'Gadgets & Electronics',
                'description' => '10.6-inch 2K IPS display Android tablet with octa-core processor, dual stereo speakers, magnetic stylus pen, and 7500mAh power bank battery.',
                'reward_value_inr' => 22999.00,
                'status' => 'active',
            ],
            [
                'title' => 'Goa 3-Days / 2-Nights Luxury Beach Resort Holiday',
                'image' => 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
                'required_bp' => 800,
                'category' => 'Travel & Holiday Vacations',
                'description' => 'All-inclusive 5-star beach resort holiday voucher for 2 persons in North Goa including buffet breakfast, airport transfers, and sunset boat cruise.',
                'reward_value_inr' => 35000.00,
                'status' => 'active',
            ],
            [
                'title' => 'Apple iPad Air (M2 Chip, 128GB Wi-Fi)',
                'image' => 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600',
                'required_bp' => 1500,
                'category' => 'Premium Technology',
                'description' => 'Latest generation Apple iPad Air powered by ultra-fast Apple Silicon M2 processor, Liquid Retina display, and Touch ID biometric security.',
                'reward_value_inr' => 59900.00,
                'status' => 'active',
            ],
            [
                'title' => 'Apple iPhone 16 Pro Max (256GB)',
                'image' => 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600',
                'required_bp' => 3500,
                'category' => 'Premium Technology',
                'description' => 'Flagship Grade 5 Titanium iPhone 16 Pro Max with A18 Pro Bionic chip, 48MP fusion camera with 5x telephoto optical zoom, and Action Button.',
                'reward_value_inr' => 144900.00,
                'status' => 'active',
            ],
            [
                'title' => 'Dubai 5-Days / 4-Nights International Luxury Tour',
                'image' => 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600',
                'required_bp' => 5000,
                'category' => 'Travel & Holiday Vacations',
                'description' => 'Grand international holiday package for 2 persons with flights, 5-star hotel stay, Desert Safari with BBQ dinner, Burj Khalifa Top Deck, and Yacht dinner.',
                'reward_value_inr' => 210000.00,
                'status' => 'active',
            ],
        ];

        foreach ($rewards as $r) {
            Reward::updateOrCreate(['title' => $r['title']], $r);
        }

        // 4. Seed initial claims for testing
        $firstUser = User::first();
        $sampleClaims = [
            [
                'claim_code' => 'CLM-2026-101',
                'user_id' => $firstUser ? $firstUser->id : 1,
                'user_code' => 'CB100001',
                'member_name' => 'Rahul Verma',
                'member_email' => 'rahul.verma@example.com',
                'member_phone' => '+91 98765 43210',
                'reward_id' => 1,
                'reward_title' => 'Smart Fitness Band & Pulse Tracker',
                'reward_image' => 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600',
                'points_deducted' => 50,
                'bp_balance_before' => 400.00,
                'bp_balance_after' => 350.00,
                'shipping_address' => 'Flat 402, Imperial Heights, Andheri West',
                'shipping_city' => 'Mumbai',
                'shipping_state' => 'Maharashtra',
                'shipping_pincode' => '400053',
                'status' => 'dispatched',
                'courier_partner' => 'Blue Dart Express',
                'tracking_number' => 'BLUEDART-8930491823',
                'admin_notes' => 'Dispatched via Express surface courier.',
                'claim_date' => now()->subDays(2),
                'processed_date' => now()->subDay(),
            ],
            [
                'claim_code' => 'CLM-2026-102',
                'user_id' => $firstUser ? $firstUser->id : 1,
                'user_code' => 'CB100002',
                'member_name' => 'Anita Sharma',
                'member_email' => 'anita.s@example.com',
                'member_phone' => '+91 98111 22334',
                'reward_id' => 2,
                'reward_title' => 'High-Bass Active Noise Cancelling Earbuds',
                'reward_image' => 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
                'points_deducted' => 100,
                'bp_balance_before' => 550.00,
                'bp_balance_after' => 450.00,
                'shipping_address' => 'House 14, Sector 21-C, Near Community Center',
                'shipping_city' => 'Chandigarh',
                'shipping_state' => 'Punjab',
                'shipping_pincode' => '160022',
                'status' => 'pending',
                'courier_partner' => null,
                'tracking_number' => null,
                'admin_notes' => null,
                'claim_date' => now()->subHours(8),
                'processed_date' => null,
            ],
        ];

        foreach ($sampleClaims as $claim) {
            RewardClaim::firstOrCreate(['user_id' => $claim['user_id'], 'reward_id' => $claim['reward_id']], $claim);
        }
    }
}
