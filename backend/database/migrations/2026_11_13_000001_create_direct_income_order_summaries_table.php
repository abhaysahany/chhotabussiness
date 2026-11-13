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
        if (!Schema::hasTable('direct_income_order_summaries')) {
            Schema::create('direct_income_order_summaries', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->comment('Beneficiary Sponsor users.id');
                $table->string('user_code', 50)->comment('Beneficiary Sponsor user_code');
                $table->unsignedBigInteger('order_id')->comment('Parent Order ID');
                $table->string('invoice_number', 255)->comment('Order Invoice Number');
                $table->string('source_user_code', 50)->comment('Purchasing Member user_code');
                $table->string('source_user_name', 255)->nullable()->comment('Purchasing Member display name');
                $table->string('item_name', 255)->nullable()->comment('Product or Service name');
                $table->decimal('order_gross_amount', 14, 2)->default(0.00)->comment('Original Order Gross Amount');
                $table->decimal('total_expected_amount', 14, 2)->default(0.00)->comment('Expected Direct Income on order');
                $table->decimal('total_distributed_amount', 14, 2)->default(0.00)->comment('Actual Direct Income credited');
                $table->decimal('total_pending_amount', 14, 2)->default(0.00)->comment('Remaining eligible Direct Income');
                $table->decimal('total_dump_amount', 14, 2)->default(0.00)->comment('Approved Dump direct income portion');
                $table->unsignedInteger('distribution_count')->default(0)->comment('Number of installment distributions');
                $table->string('distribution_status', 24)->default('pending')->comment('pending, partial, completed');
                $table->timestamp('last_distribution_at')->nullable()->comment('Last distribution timestamp');
                $table->timestamps();

                // Critical Unique Constraint: exactly one summary per Beneficiary and Order
                $table->unique(['user_id', 'order_id'], 'unique_user_order');

                // Performance & filtering indexes
                $table->index('user_code', 'direct_income_summaries_user_code_index');
                $table->index('order_id', 'direct_income_summaries_order_id_index');
                $table->index('distribution_status', 'direct_income_summaries_status_index');
                $table->index('invoice_number', 'direct_income_summaries_invoice_index');
                $table->index(['user_id', 'distribution_status'], 'direct_income_summaries_user_status_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('direct_income_order_summaries');
    }
};
