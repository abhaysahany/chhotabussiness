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
        if (Schema::hasTable('entity_commission_settings')) {
            // 1. Archive all historical entity-specific settings before schema transformation
            if (!Schema::hasTable('entity_commission_settings_archive')) {
                Schema::create('entity_commission_settings_archive', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('original_setting_id')->nullable();
                    $table->string('entity_type', 32)->nullable();
                    $table->unsignedBigInteger('entity_id')->nullable();
                    $table->decimal('direct_percent', 5, 2)->default(0.00);
                    $table->decimal('level_1_percent', 5, 2)->default(0.00);
                    $table->decimal('level_2_percent', 5, 2)->default(0.00);
                    $table->decimal('level_3_percent', 5, 2)->default(0.00);
                    $table->decimal('level_4_percent', 5, 2)->default(0.00);
                    $table->decimal('level_5_percent', 5, 2)->default(0.00);
                    $table->decimal('reward_percent', 5, 2)->default(0.00);
                    $table->boolean('is_custom')->default(false);
                    $table->timestamp('original_created_at')->nullable();
                    $table->timestamp('original_updated_at')->nullable();
                    $table->timestamp('archived_at')->nullable();
                });
            }

            if (DB::table('entity_commission_settings_archive')->count() === 0) {
                $existingRows = DB::table('entity_commission_settings')->orderBy('id', 'asc')->get();
                $now = now();
                foreach ($existingRows as $row) {
                    DB::table('entity_commission_settings_archive')->insert([
                        'original_setting_id' => $row->id,
                        'entity_type' => $row->entity_type ?? null,
                        'entity_id' => $row->entity_id ?? null,
                        'direct_percent' => $row->direct_percent ?? 0.00,
                        'level_1_percent' => $row->level_1_percent ?? 0.00,
                        'level_2_percent' => $row->level_2_percent ?? 0.00,
                        'level_3_percent' => $row->level_3_percent ?? 0.00,
                        'level_4_percent' => $row->level_4_percent ?? 0.00,
                        'level_5_percent' => $row->level_5_percent ?? 0.00,
                        'reward_percent' => $row->reward_percent ?? 0.00,
                        'is_custom' => (bool) ($row->is_custom ?? false),
                        'original_created_at' => $row->created_at ?? null,
                        'original_updated_at' => $row->updated_at ?? null,
                        'archived_at' => $now,
                    ]);
                }
            }

            // 2. Rename table to system-wide commission_settings
            if (!Schema::hasTable('commission_settings')) {
                Schema::rename('entity_commission_settings', 'commission_settings');
            }
        } elseif (!Schema::hasTable('commission_settings')) {
            // Fresh install safety fallback
            Schema::create('commission_settings', function (Blueprint $table) {
                $table->id();
                $table->string('setting_key', 64)->unique('commission_settings_setting_key_unique');
                $table->decimal('direct_percent', 5, 2)->default(0.00);
                $table->decimal('level_1_percent', 5, 2)->default(0.00);
                $table->decimal('level_2_percent', 5, 2)->default(0.00);
                $table->decimal('level_3_percent', 5, 2)->default(0.00);
                $table->decimal('level_4_percent', 5, 2)->default(0.00);
                $table->decimal('level_5_percent', 5, 2)->default(0.00);
                $table->decimal('reward_percent', 5, 2)->default(0.00);
                $table->unsignedBigInteger('updated_by_admin_id')->nullable();
                $table->timestamps();
            });
        }

        // 3. Remove legacy per-entity rows now preserved in archive
        DB::table('commission_settings')->delete();

        // 4. Drop composite entity unique index if present
        $indexes = collect(DB::select('SHOW INDEX FROM commission_settings'))->pluck('Key_name')->all();
        if (in_array('entity_comm_settings_type_id_unique', $indexes, true)) {
            Schema::table('commission_settings', function (Blueprint $table) {
                $table->dropUnique('entity_comm_settings_type_id_unique');
            });
        }

        // 5. Drop entity-specific columns and add singleton + audit columns
        Schema::table('commission_settings', function (Blueprint $table) {
            if (Schema::hasColumn('commission_settings', 'entity_type')) {
                $table->dropColumn('entity_type');
            }
            if (Schema::hasColumn('commission_settings', 'entity_id')) {
                $table->dropColumn('entity_id');
            }
            if (Schema::hasColumn('commission_settings', 'is_custom')) {
                $table->dropColumn('is_custom');
            }
            if (!Schema::hasColumn('commission_settings', 'setting_key')) {
                $table->string('setting_key', 64)->default('global')->after('id');
            }
            if (!Schema::hasColumn('commission_settings', 'updated_by_admin_id')) {
                $table->unsignedBigInteger('updated_by_admin_id')->nullable()->after('reward_percent');
            }
        });

        $updatedIndexes = collect(DB::select('SHOW INDEX FROM commission_settings'))->pluck('Key_name')->all();
        if (!in_array('commission_settings_setting_key_unique', $updatedIndexes, true)) {
            Schema::table('commission_settings', function (Blueprint $table) {
                $table->unique('setting_key', 'commission_settings_setting_key_unique');
            });
        }

        // 6. Seed the single canonical global configuration matching existing 40 / (0,16,12,8,4) / 20 distribution
        if (!DB::table('commission_settings')->where('setting_key', 'global')->exists()) {
            $now = now();
            DB::table('commission_settings')->insert([
                'setting_key' => 'global',
                'direct_percent' => 40.00,
                'level_1_percent' => 0.00,
                'level_2_percent' => 16.00,
                'level_3_percent' => 12.00,
                'level_4_percent' => 8.00,
                'level_5_percent' => 4.00,
                'reward_percent' => 20.00,
                'updated_by_admin_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
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

        $indexes = collect(DB::select('SHOW INDEX FROM commission_settings'))->pluck('Key_name')->all();
        if (in_array('commission_settings_setting_key_unique', $indexes, true)) {
            Schema::table('commission_settings', function (Blueprint $table) {
                $table->dropUnique('commission_settings_setting_key_unique');
            });
        }

        DB::table('commission_settings')->delete();

        Schema::table('commission_settings', function (Blueprint $table) {
            if (Schema::hasColumn('commission_settings', 'setting_key')) {
                $table->dropColumn('setting_key');
            }
            if (Schema::hasColumn('commission_settings', 'updated_by_admin_id')) {
                $table->dropColumn('updated_by_admin_id');
            }
            if (!Schema::hasColumn('commission_settings', 'entity_type')) {
                $table->string('entity_type', 32)->default('business')->after('id');
            }
            if (!Schema::hasColumn('commission_settings', 'entity_id')) {
                $table->unsignedBigInteger('entity_id')->default(0)->after('entity_type');
            }
            if (!Schema::hasColumn('commission_settings', 'is_custom')) {
                $table->boolean('is_custom')->default(false)->after('reward_percent');
            }
        });

        if (Schema::hasTable('entity_commission_settings_archive')) {
            $archived = DB::table('entity_commission_settings_archive')->orderBy('original_setting_id', 'asc')->get();
            foreach ($archived as $row) {
                DB::table('commission_settings')->insert([
                    'id' => $row->original_setting_id,
                    'entity_type' => $row->entity_type ?? 'business',
                    'entity_id' => $row->entity_id ?? 0,
                    'direct_percent' => $row->direct_percent ?? 0.00,
                    'level_1_percent' => $row->level_1_percent ?? 0.00,
                    'level_2_percent' => $row->level_2_percent ?? 0.00,
                    'level_3_percent' => $row->level_3_percent ?? 0.00,
                    'level_4_percent' => $row->level_4_percent ?? 0.00,
                    'level_5_percent' => $row->level_5_percent ?? 0.00,
                    'reward_percent' => $row->reward_percent ?? 0.00,
                    'is_custom' => (bool) ($row->is_custom ?? false),
                    'created_at' => $row->original_created_at,
                    'updated_at' => $row->original_updated_at,
                ]);
            }

            Schema::dropIfExists('entity_commission_settings_archive');
        }

        Schema::table('commission_settings', function (Blueprint $table) {
            $table->unique(['entity_type', 'entity_id'], 'entity_comm_settings_type_id_unique');
        });

        if (!Schema::hasTable('entity_commission_settings')) {
            Schema::rename('commission_settings', 'entity_commission_settings');
        }
    }
};
