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
        if (!Schema::hasTable('order_payment_dumps')) {
            Schema::create('order_payment_dumps', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
                $table->string('invoice_number', 100)->index();
                $table->unsignedBigInteger('entity_id')->nullable()->index();
                $table->string('entity_name', 255)->nullable();
                $table->string('customer_name', 255);
                $table->string('customer_user_code', 100)->nullable()->index();
                $table->decimal('dump_amount', 14, 2);
                $table->decimal('admin_commission_percent', 5, 2)->default(0.00);
                $table->decimal('admin_commission_cut', 14, 2)->default(0.00);
                $table->decimal('direct_income_amount', 14, 2)->default(0.00);
                $table->decimal('level_income_amount', 14, 2)->default(0.00);
                $table->decimal('reward_income_amount', 14, 2)->default(0.00);
                $table->text('dump_reason');
                $table->text('admin_rejection_reason')->nullable();
                $table->text('notes')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->index();
                $table->timestamp('requested_at')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable()->index();
                $table->timestamp('approved_at')->nullable();
                $table->unsignedBigInteger('rejected_by')->nullable()->index();
                $table->timestamp('rejected_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_payment_dumps');
    }
};
