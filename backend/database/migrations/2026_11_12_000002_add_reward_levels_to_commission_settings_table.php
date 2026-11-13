<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('commission_settings')) {
            return;
        }

        Schema::table('commission_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('commission_settings', 'reward_level_1_percent')) {
                $table->decimal('reward_level_1_percent', 5, 2)->default(0.00)->after('reward_percent');
            }
            if (!Schema::hasColumn('commission_settings', 'reward_level_2_percent')) {
                $table->decimal('reward_level_2_percent', 5, 2)->default(0.00)->after('reward_level_1_percent');
            }
        });

        // Migrate existing legacy reward_percent into reward_level_1_percent and set reward_level_2_percent = 0.00
        $rows = DB::table('commission_settings')->get();
        foreach ($rows as $row) {
            $legacyReward = round((float) ($row->reward_percent ?? 0.00), 2);
            DB::table('commission_settings')
                ->where('id', $row->id)
                ->update([
                    'reward_level_1_percent' => $legacyReward,
                    'reward_level_2_percent' => 0.00,
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('commission_settings')) {
            return;
        }

        // Preserve combined reward percent in legacy reward_percent column before dropping split columns
        if (Schema::hasColumn('commission_settings', 'reward_level_1_percent') && Schema::hasColumn('commission_settings', 'reward_level_2_percent')) {
            $rows = DB::table('commission_settings')->get();
            foreach ($rows as $row) {
                $combined = round((float) ($row->reward_level_1_percent ?? 0) + (float) ($row->reward_level_2_percent ?? 0), 2);
                DB::table('commission_settings')
                    ->where('id', $row->id)
                    ->update(['reward_percent' => $combined]);
            }
        }

        Schema::table('commission_settings', function (Blueprint $table) {
            if (Schema::hasColumn('commission_settings', 'reward_level_2_percent')) {
                $table->dropColumn('reward_level_2_percent');
            }
            if (Schema::hasColumn('commission_settings', 'reward_level_1_percent')) {
                $table->dropColumn('reward_level_1_percent');
            }
        });
    }
};
