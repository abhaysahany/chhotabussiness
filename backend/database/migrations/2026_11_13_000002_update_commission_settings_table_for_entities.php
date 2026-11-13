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
        // 1. Add entity_type, entity_id, is_custom to commission_settings if not present
        if (Schema::hasTable('commission_settings')) {
            Schema::table('commission_settings', function (Blueprint $table) {
                if (!Schema::hasColumn('commission_settings', 'entity_type')) {
                    $table->string('entity_type', 32)->nullable()->after('setting_key')->index();
                }
                if (!Schema::hasColumn('commission_settings', 'entity_id')) {
                    $table->unsignedBigInteger('entity_id')->nullable()->after('entity_type')->index();
                }
                if (!Schema::hasColumn('commission_settings', 'is_custom')) {
                    $table->boolean('is_custom')->default(false)->after('reward_level_2_percent');
                }
            });

            // 2. Restore archived records into commission_settings if archive exists
            if (Schema::hasTable('entity_commission_settings_archive')) {
                $archived = DB::table('entity_commission_settings_archive')->get();
                foreach ($archived as $row) {
                    $settingKey = 'entity_' . $row->entity_type . '_' . $row->entity_id;
                    $exists = DB::table('commission_settings')
                        ->where('setting_key', $settingKey)
                        ->orWhere(function ($q) use ($row) {
                            $q->where('entity_type', $row->entity_type)
                              ->where('entity_id', $row->entity_id);
                        })
                        ->exists();

                    if (!$exists) {
                        DB::table('commission_settings')->insert([
                            'setting_key' => $settingKey,
                            'entity_type' => $row->entity_type,
                            'entity_id' => $row->entity_id,
                            'direct_percent' => $row->direct_percent ?? 0.00,
                            'level_1_percent' => $row->level_1_percent ?? 0.00,
                            'level_2_percent' => $row->level_2_percent ?? 0.00,
                            'level_3_percent' => $row->level_3_percent ?? 0.00,
                            'level_4_percent' => $row->level_4_percent ?? 0.00,
                            'level_5_percent' => $row->level_5_percent ?? 0.00,
                            'reward_percent' => $row->reward_percent ?? 0.00,
                            'is_custom' => $row->is_custom ?? 0,
                            'created_at' => $row->original_created_at ?? now(),
                            'updated_at' => $row->original_updated_at ?? now(),
                        ]);
                    }
                }
            }

            // 3. Create or replace VIEW entity_commission_settings pointing to commission_settings
            try {
                DB::statement('CREATE OR REPLACE VIEW entity_commission_settings AS SELECT * FROM commission_settings');
            } catch (\Throwable $e) {
                // Ignore view creation error if user lacks view privileges
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            DB::statement('DROP VIEW IF EXISTS entity_commission_settings');
        } catch (\Throwable $e) {}

        if (Schema::hasTable('commission_settings')) {
            Schema::table('commission_settings', function (Blueprint $table) {
                $cols = [];
                if (Schema::hasColumn('commission_settings', 'entity_type')) $cols[] = 'entity_type';
                if (Schema::hasColumn('commission_settings', 'entity_id')) $cols[] = 'entity_id';
                if (Schema::hasColumn('commission_settings', 'is_custom')) $cols[] = 'is_custom';
                if (!empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }
    }
};
