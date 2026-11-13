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
        Schema::create('sales_records', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->date('date')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_name')->default('Vyapar Adnet Entity');
            $table->string('entity_type')->default('business'); // 'business' | 'freelance' | 'system'
            
            // Customer Details
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('customer_user_code')->nullable();
            $table->string('customer')->nullable(); // formatted display name
            $table->string('sponsor')->nullable();
            
            // Item & Offering Details
            $table->string('item');
            $table->string('item_type')->default('service'); // 'service' | 'product' | 'package'
            $table->string('category')->nullable();
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->integer('quantity')->default(1);
            
            // Financials
            $table->decimal('gross_amount', 12, 2)->default(0); // Total Project Value
            $table->decimal('taxable_amount', 12, 2)->default(0);
            $table->decimal('gst_tax', 12, 2)->default(0);
            $table->decimal('admin_commission_percent', 6, 2)->default(15);
            $table->decimal('admin_commission_cut', 12, 2)->default(0); // Total admin commission on collected amount
            $table->decimal('net_entity_payout', 12, 2)->default(0); // Total net entity earnings on collected amount
            $table->decimal('advance_payment', 12, 2)->default(0); // Total collected/paid amount so far
            $table->decimal('balance_due', 12, 2)->default(0); // Remaining uncollected balance
            
            // Payment Meta
            $table->string('payment_method')->nullable();
            $table->string('reference_no')->nullable();
            $table->string('status')->default('completed'); // 'partial' | 'completed' | 'pending' | 'cancelled'
            
            // MLM Distribution Meta
            $table->string('network_distribution_status')->default('pending_admin_distribution'); // 'pending_admin_distribution' | 'distributed'
            $table->json('distribution_details')->nullable();
            $table->decimal('direct_commission', 12, 2)->default(0);
            $table->decimal('level_commissions_total', 12, 2)->default(0);
            $table->decimal('team_volume_bv', 12, 2)->default(0);
            $table->boolean('commission_distributed')->default(false);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_records');
    }
};
