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
        Schema::create('sale_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_record_id');
            $table->string('invoice_number');
            $table->string('entity_name')->default('Chhota Business Entity');
            $table->string('customer_name');
            $table->decimal('amount', 12, 2)->default(0); // Installment amount received
            $table->decimal('admin_commission_percent', 6, 2)->default(15);
            $table->decimal('admin_commission_cut', 12, 2)->default(0); // Admin commission released on this payment
            $table->decimal('net_entity_amount', 12, 2)->default(0); // Net entity amount on this payment
            $table->string('payment_method')->nullable();
            $table->string('reference_no')->nullable();
            $table->string('payment_type')->default('advance'); // 'advance' | 'balance' | 'full'
            $table->text('notes')->nullable();
            $table->dateTime('payment_date')->nullable();
            $table->timestamps();

            $table->foreign('sales_record_id')->references('id')->on('sales_records')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
    }
};
