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
        // 1. Add order and installment payment references to direct_incomes
        if (Schema::hasTable('direct_incomes')) {
            Schema::table('direct_incomes', function (Blueprint $table) {
                if (!Schema::hasColumn('direct_incomes', 'order_id')) {
                    $table->unsignedBigInteger('order_id')->nullable()->after('id')->comment('Parent Order ID');
                }
                if (!Schema::hasColumn('direct_incomes', 'sale_payment_id')) {
                    $table->unsignedBigInteger('sale_payment_id')->nullable()->after('order_id')->comment('Parent Sale Payment ID');
                }
                if (!Schema::hasColumn('direct_incomes', 'source_user_code')) {
                    $table->string('source_user_code', 50)->nullable()->after('sale_payment_id')->comment('Purchaser user_code');
                }
                if (!Schema::hasColumn('direct_incomes', 'percentage')) {
                    $table->decimal('percentage', 5, 2)->nullable()->after('source_user_code')->comment('Direct income % applied');
                }

                // Add performance indexes if not present
                $table->index('user_code', 'direct_incomes_user_code_index');
                $table->index('order_id', 'direct_incomes_order_id_index');
                $table->index('sale_payment_id', 'direct_incomes_sale_payment_id_index');
                $table->index(['order_id', 'sale_payment_id'], 'direct_incomes_order_payment_index');
            });
        }

        // 2. Add performance index on orders(sponsor, approval_status)
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['sponsor', 'approval_status'], 'orders_sponsor_approval_index');
            });
        }

        // 3. Add performance index on sale_payments(sales_record_id, income_distribution_status)
        if (Schema::hasTable('sale_payments')) {
            Schema::table('sale_payments', function (Blueprint $table) {
                $table->index(['sales_record_id', 'income_distribution_status'], 'sale_payments_record_income_status_index');
                $table->index('sponsor', 'sale_payments_sponsor_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sale_payments')) {
            Schema::table('sale_payments', function (Blueprint $table) {
                $table->dropIndex('sale_payments_record_income_status_index');
                $table->dropIndex('sale_payments_sponsor_index');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex('orders_sponsor_approval_index');
            });
        }

        if (Schema::hasTable('direct_incomes')) {
            Schema::table('direct_incomes', function (Blueprint $table) {
                $table->dropIndex('direct_incomes_order_payment_index');
                $table->dropIndex('direct_incomes_sale_payment_id_index');
                $table->dropIndex('direct_incomes_order_id_index');
                $table->dropIndex('direct_incomes_user_code_index');

                $table->dropColumn([
                    'order_id',
                    'sale_payment_id',
                    'source_user_code',
                    'percentage',
                ]);
            });
        }
    }
};
