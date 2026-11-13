<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's essential database tables for normal and production setup.
     * Fake business records and demo seeders are isolated in DemoDataSeeder.
     */
    public function run(): void
    {
        // 1. Root sponsor / default platform user account
        $user = User::firstOrCreate(
            ['email' => 'user@vyaparadnet.com'],
            [
                'name' => 'Vyapar Adnet Admin Sponsor',
                'user_code' => 'CB100001',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            ]
        );

        if (empty($user->user_code)) {
            $user->update(['user_code' => 'CB100001']);
        }

        // 2. Essential system initialization seeders only
        $this->call([
            AdminSeeder::class,
            EntityCategorySeeder::class,
            CategorySeeder::class,
        ]);
    }
}
