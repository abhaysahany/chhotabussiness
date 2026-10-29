<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
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

        $this->call([
            AdminSeeder::class,
            EntitySeeder::class,
            SupportTicketSeeder::class,
        ]);
    }
}
