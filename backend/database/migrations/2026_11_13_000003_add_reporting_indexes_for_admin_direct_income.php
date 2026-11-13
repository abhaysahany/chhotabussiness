<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Additive performance indexes for Admin Direct Income reporting queries.
     */
    public function up(): void
    {
        Schema::table('direct_income_order_summaries', function (Blueprint $table) {
            if (!Schema::hasIndex('direct_income_order_summaries', 'idx_summary_last_dist')) {
                $table->index('last_distribution_at', 'idx_summary_last_dist');
            }
            if (!Schema::hasIndex('direct_income_order_summaries', 'idx_summary_created_at')) {
                $table->index('created_at', 'idx_summary_created_at');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasIndex('orders', 'idx_orders_entity_id')) {
                $table->index('entity_id', 'idx_orders_entity_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('direct_income_order_summaries', function (Blueprint $table) {
            $table->dropIndex('idx_summary_last_dist');
            $table->dropIndex('idx_summary_created_at');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_entity_id');
        });
    }
};
