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
        Schema::create('user_payouts', function (Blueprint $table) {
            $table->id();
            $table->string('payout_code')->unique(); // e.g. PAY-2026-101
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_code'); // e.g. CB100001
            $table->string('member_name');
            $table->string('member_email')->nullable();
            $table->string('member_phone')->nullable();
            $table->string('sponsor')->nullable();
            
            // Financials
            $table->decimal('wallet_balance_before', 12, 2)->default(0);
            $table->decimal('requested_amount', 12, 2)->default(0); // Gross requested
            $table->decimal('tds_rate', 5, 2)->default(5.00); // 5% TDS u/s 194H
            $table->decimal('tds_deduction', 12, 2)->default(0);
            $table->decimal('admin_processing_fee', 12, 2)->default(0);
            $table->decimal('net_payable_amount', 12, 2)->default(0); // Net disbursed to bank

            // Banking & KYC Information
            $table->string('payment_method')->default('IMPS Direct Bank Transfer');
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('ifsc_code')->nullable();
            $table->string('account_holder_name')->nullable();
            $table->string('upi_id')->nullable();
            $table->string('pan_number')->nullable();
            $table->string('kyc_status')->default('verified');

            // Processing & Status
            $table->string('status')->default('pending'); // pending | completed | rejected
            $table->dateTime('request_date');
            $table->dateTime('processed_date')->nullable();
            $table->string('utr_number')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('batch_reference')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_payouts');
    }
};
