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
        // 1. Direct Incomes Table
        if (!Schema::hasTable('direct_incomes')) {
            Schema::create('direct_incomes', function (Blueprint $table) {
                $table->id();
                $table->string('user_code', 50)->index();
                $table->string('sponsor_id', 50)->index();
                $table->decimal('total_amount', 15, 2)->default(0.00);
                $table->decimal('paid_amount', 15, 2)->default(0.00);
                $table->decimal('balance_amount', 15, 2)->default(0.00);
                $table->decimal('dump_amount', 15, 2)->default(0.00);
                $table->timestamps();
            });
        }

        // 2. Level Incomes Table
        if (!Schema::hasTable('level_incomes')) {
            Schema::create('level_incomes', function (Blueprint $table) {
                $table->id();
                $table->string('user_code', 50)->index();
                $table->string('level_id', 50)->index();
                $table->unsignedInteger('level');
                $table->decimal('total_amount', 15, 2)->default(0.00);
                $table->decimal('paid_amount', 15, 2)->default(0.00);
                $table->decimal('balance_amount', 15, 2)->default(0.00);
                $table->decimal('dump_amount', 15, 2)->default(0.00);
                $table->timestamps();
            });
        }

        // 3. Wallet Transfers Table
        if (!Schema::hasTable('wallet_transfers')) {
            Schema::create('wallet_transfers', function (Blueprint $table) {
                $table->id();
                $table->string('memberid', 50)->index();
                $table->string('walletType', 100)->nullable();
                $table->decimal('credit', 15, 2)->default(0.00);
                $table->decimal('debit', 15, 2)->default(0.00);
                $table->decimal('balance', 15, 2)->default(0.00);
                $table->text('particular')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transfers');
        Schema::dropIfExists('level_incomes');
        Schema::dropIfExists('direct_incomes');
    }
};
