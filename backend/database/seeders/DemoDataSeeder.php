<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the demo / sample data seeders for local development testing only.
     * Blocked from execution in production or non-local environments.
     */
    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            $this->command?->warn('DemoDataSeeder is strictly restricted to local and testing environments.');
            return;
        }

        $this->command?->info('Seeding isolated development/demo business records...');

        $this->call([
            EntitySeeder::class,
            ProductCatalogSeeder::class,
            RewardSeeder::class,
            UserPayoutSeeder::class,
            NotificationSeeder::class,
            SupportTicketSeeder::class,
        ]);

        $this->command?->info('Demo data seeding completed.');
    }
}
