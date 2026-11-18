<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates Global Commission Plan:
     * - Direct Income: 40.00%
     * - Level 1: 0.00%
     * - Level 2: 20.00%
     * - Level 3 to 5: 0.00%
     * - Reward Level 1 (Direct Sponsor): 20.00%
     * - Reward Level 2 (2nd Upline): 20.00%
     * Total: 40% + 20% + 40% = 100.00%
     */
    public function up(): void
    {
        if (Schema::hasTable('commission_settings')) {
            $now = now();
            $exists = DB::table('commission_settings')->where('setting_key', 'global')->exists();

            if ($exists) {
                DB::table('commission_settings')->where('setting_key', 'global')->update([
                    'direct_percent' => 40.00,
                    'level_1_percent' => 0.00,
                    'level_2_percent' => 20.00,
                    'level_3_percent' => 0.00,
                    'level_4_percent' => 0.00,
                    'level_5_percent' => 0.00,
                    'reward_percent' => 40.00,
                    'reward_level_1_percent' => 20.00,
                    'reward_level_2_percent' => 20.00,
                    'updated_at' => $now,
                ]);
            } else {
                DB::table('commission_settings')->insert([
                    'setting_key' => 'global',
                    'direct_percent' => 40.00,
                    'level_1_percent' => 0.00,
                    'level_2_percent' => 20.00,
                    'level_3_percent' => 0.00,
                    'level_4_percent' => 0.00,
                    'level_5_percent' => 0.00,
                    'reward_percent' => 40.00,
                    'reward_level_1_percent' => 20.00,
                    'reward_level_2_percent' => 20.00,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('commission_settings')) {
            DB::table('commission_settings')->where('setting_key', 'global')->update([
                'direct_percent' => 40.00,
                'level_1_percent' => 0.00,
                'level_2_percent' => 16.00,
                'level_3_percent' => 12.00,
                'level_4_percent' => 8.00,
                'level_5_percent' => 4.00,
                'reward_percent' => 20.00,
                'reward_level_1_percent' => 10.00,
                'reward_level_2_percent' => 10.00,
                'updated_at' => now(),
            ]);
        }
    }
};
