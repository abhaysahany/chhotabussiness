<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tableName = Schema::hasTable('orders') ? 'orders' : (Schema::hasTable('sales_records') ? 'sales_records' : null);

        if ($tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'direct_income_amount')) {
                    $table->decimal('direct_income_amount', 14, 2)->default(0);
                }
                if (!Schema::hasColumn($tableName, 'level_income_amount')) {
                    $table->decimal('level_income_amount', 14, 2)->default(0);
                }
                if (!Schema::hasColumn($tableName, 'reward_income_amount')) {
                    $table->decimal('reward_income_amount', 14, 2)->default(0);
                }
                if (!Schema::hasColumn($tableName, 'distributed_admin_cut_amount')) {
                    $table->decimal('distributed_admin_cut_amount', 14, 2)->default(0);
                }
                if (!Schema::hasColumn($tableName, 'income_distribution_status')) {
                    $table->string('income_distribution_status', 20)->default('pending');
                }
                if (!Schema::hasColumn($tableName, 'income_distributed_at')) {
                    $table->timestamp('income_distributed_at')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableName = Schema::hasTable('orders') ? 'orders' : (Schema::hasTable('sales_records') ? 'sales_records' : null);

        if ($tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $columnsToDrop = [];
                foreach ([
                    'direct_income_amount',
                    'level_income_amount',
                    'reward_income_amount',
                    'distributed_admin_cut_amount',
                    'income_distribution_status',
                    'income_distributed_at'
                ] as $column) {
                    if (Schema::hasColumn($tableName, $column)) {
                        $columnsToDrop[] = $column;
                    }
                }
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }
};
