<?php

use App\Models\BusinessEntity;
use App\Models\EntityCommissionSetting;
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
        Schema::table('entity_commission_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('entity_commission_settings', 'level_5_percent')) {
                $table->decimal('level_5_percent', 5, 2)->default(1.00)->after('level_4_percent');
            }
            if (!Schema::hasColumn('entity_commission_settings', 'is_custom')) {
                $table->boolean('is_custom')->default(false)->after('reward_percent');
            }
        });

        // 1. Existing customized settings (e.g. Apex Financial entity_id 1 and Freelancer entity_id 1)
        // Mark them as custom so they retain their status and are not treated as unconfigured defaults.
        DB::table('entity_commission_settings')->update([
            'is_custom' => true,
        ]);

        // 2. Populate default commission settings for all existing Business Entities that don't have settings yet
        $existingBusinesses = BusinessEntity::all();
        foreach ($existingBusinesses as $biz) {
            $hasSetting = DB::table('entity_commission_settings')
                ->where('entity_type', 'business')
                ->where('entity_id', $biz->id)
                ->exists();

            if (!$hasSetting) {
                DB::table('entity_commission_settings')->insert([
                    'entity_type' => 'business',
                    'entity_id' => $biz->id,
                    'direct_percent' => 10.00,
                    'level_1_percent' => 0.00,
                    'level_2_percent' => 4.00,
                    'level_3_percent' => 3.00,
                    'level_4_percent' => 2.00,
                    'level_5_percent' => 1.00,
                    'reward_percent' => 5.00,
                    'is_custom' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Populate default commission settings for any Freelancers that don't have settings yet
        $existingFreelancers = \App\Models\FreelancerEntity::all();
        foreach ($existingFreelancers as $free) {
            $hasSetting = DB::table('entity_commission_settings')
                ->where('entity_type', 'freelancer')
                ->where('entity_id', $free->id)
                ->exists();

            if (!$hasSetting) {
                DB::table('entity_commission_settings')->insert([
                    'entity_type' => 'freelancer',
                    'entity_id' => $free->id,
                    'direct_percent' => 10.00,
                    'level_1_percent' => 0.00,
                    'level_2_percent' => 4.00,
                    'level_3_percent' => 3.00,
                    'level_4_percent' => 2.00,
                    'level_5_percent' => 1.00,
                    'reward_percent' => 5.00,
                    'is_custom' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('entity_commission_settings', function (Blueprint $table) {
            if (Schema::hasColumn('entity_commission_settings', 'level_5_percent')) {
                $table->dropColumn('level_5_percent');
            }
            if (Schema::hasColumn('entity_commission_settings', 'is_custom')) {
                $table->dropColumn('is_custom');
            }
        });
    }
};
