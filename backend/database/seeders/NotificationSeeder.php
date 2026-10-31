<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        Notification::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        $userCount = User::count();
        $firstUser = User::first();

        $notifications = [
            [
                'title' => 'Weekly Payout Batch Disbursed Successfully',
                'message' => 'The scheduled weekly commission payout batch has been processed to all verified bank accounts via NEFT/IMPS. Check your Payout History for transaction UTR numbers.',
                'type' => 'success',
                'target_audience' => 'all_users',
                'target_user_id' => null,
                'target_user_code' => null,
                'target_user_name' => null,
                'action_url' => '/payout-history',
                'recipients_count' => $userCount ?: 120,
                'created_by' => 'Executive Finance Desk',
                'created_at' => now()->subHours(2),
            ],
            [
                'title' => 'KYC Verification Reminder',
                'message' => 'Complete your PAN Card and Bank Account verification under Profile Settings to unlock automated weekly direct bank withdrawals exceeding ₹500.',
                'type' => 'warning',
                'target_audience' => 'inactive_users',
                'target_user_id' => null,
                'target_user_code' => null,
                'target_user_name' => null,
                'action_url' => '/profile',
                'recipients_count' => 45,
                'created_by' => 'Compliance Team',
                'created_at' => now()->subDay(),
            ],
            [
                'title' => 'New Milestone Reward Added: Apple iPhone 16 Pro Max',
                'message' => 'We have added brand new luxury milestone rewards to the Business Points (BP) catalog! Redeem with 3,500 BP.',
                'type' => 'announcement',
                'target_audience' => 'all_users',
                'target_user_id' => null,
                'target_user_code' => null,
                'target_user_name' => null,
                'action_url' => '/reward-details',
                'recipients_count' => $userCount ?: 120,
                'created_by' => 'Admin Desk',
                'created_at' => now()->subDays(2),
            ],
            [
                'title' => 'Welcome to Vyapar Adnet Affiliate Network',
                'message' => 'Your affiliate account has been activated with direct Level 1 referral commissions and 7-level override bonuses. Start by sharing your custom tracking link.',
                'type' => 'info',
                'target_audience' => 'single_user',
                'target_user_id' => $firstUser ? $firstUser->id : 1,
                'target_user_code' => $firstUser ? ($firstUser->user_code ?: 'CB100001') : 'CB100001',
                'target_user_name' => $firstUser ? $firstUser->name : 'Rahul Verma',
                'action_url' => '/referral-link',
                'recipients_count' => 1,
                'created_by' => 'Partner Onboarding Desk',
                'created_at' => now()->subDays(3),
            ],
        ];

        foreach ($notifications as $n) {
            Notification::create($n);
        }
    }
}
