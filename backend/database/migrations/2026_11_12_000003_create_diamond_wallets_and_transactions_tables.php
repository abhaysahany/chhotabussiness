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
        if (!Schema::hasTable('diamond_wallets')) {
            Schema::create('diamond_wallets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique('diamond_wallets_user_id_unique');
                $table->decimal('diamond_balance', 16, 4)->default(0.0000);
                $table->decimal('level_1_diamonds', 16, 4)->default(0.0000);
                $table->decimal('level_2_diamonds', 16, 4)->default(0.0000);
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('diamond_transactions')) {
            Schema::create('diamond_transactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->index('diamond_tx_user_id_idx');
                $table->unsignedBigInteger('order_id')->nullable()->index('diamond_tx_order_id_idx');
                $table->unsignedBigInteger('sale_payment_id')->nullable()->index('diamond_tx_payment_id_idx');
                $table->string('source_reference', 120);
                $table->unsignedTinyInteger('reward_level'); // 1 = Direct Sponsor, 2 = Sponsor's Sponsor
                $table->unsignedBigInteger('source_member_id')->nullable()->index('diamond_tx_source_member_idx');
                $table->string('source_member_code', 64)->nullable();
                $table->decimal('allocated_amount', 14, 2)->default(0.00);
                $table->decimal('conversion_rate', 10, 2)->default(100.00);
                $table->decimal('diamond_quantity', 16, 4)->default(0.0000);
                $table->decimal('balance_after', 16, 4)->default(0.0000);
                $table->string('transaction_type', 32)->default('credit'); // 'credit' | 'reversal'
                $table->string('description', 255)->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->unique(['sale_payment_id', 'reward_level', 'transaction_type'], 'diamond_tx_payment_level_type_unique');
                $table->unique(['source_reference', 'transaction_type'], 'diamond_tx_source_ref_type_unique');
            });
        }

        if (!Schema::hasTable('diamond_reward_audits')) {
            Schema::create('diamond_reward_audits', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id')->nullable()->index('diamond_audit_order_id_idx');
                $table->unsignedBigInteger('sale_payment_id')->nullable()->index('diamond_audit_payment_id_idx');
                $table->unsignedTinyInteger('reward_level');
                $table->unsignedBigInteger('source_member_id')->nullable();
                $table->string('source_member_code', 64)->nullable();
                $table->string('target_sponsor_code', 64)->nullable();
                $table->unsignedBigInteger('target_user_id')->nullable();
                $table->decimal('allocated_amount', 14, 2)->default(0.00);
                $table->decimal('conversion_rate', 10, 2)->default(100.00);
                $table->decimal('diamond_quantity', 16, 4)->default(0.0000);
                $table->string('status', 48); // 'credited', 'skipped_missing_sponsor', 'skipped_ineligible_sponsor', 'skipped_self_referral', 'skipped_zero_amount', 'reversed'
                $table->string('reason', 255)->nullable();
                $table->timestamps();

                $table->unique(['sale_payment_id', 'reward_level', 'status'], 'diamond_audit_payment_level_status_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diamond_reward_audits');
        Schema::dropIfExists('diamond_transactions');
        Schema::dropIfExists('diamond_wallets');
    }
};
