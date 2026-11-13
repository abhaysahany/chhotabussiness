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
        // 1. Add bp_balance to users if not present
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'bp_balance')) {
                $table->decimal('bp_balance', 12, 2)->default(0)->after('commission_balance');
            }
        });

        // 2. Create rewards master table
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('image')->nullable();
            $table->integer('required_bp')->default(100);
            $table->string('category')->default('Gadgets & Electronics');
            $table->text('description')->nullable();
            $table->decimal('reward_value_inr', 12, 2)->nullable();
            $table->string('status')->default('active'); // active | inactive
            $table->timestamps();
        });

        // 3. Create reward_claims table
        Schema::create('reward_claims', function (Blueprint $table) {
            $table->id();
            $table->string('claim_code')->unique(); // e.g. CLM-2026-101
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_code');
            $table->string('member_name');
            $table->string('member_email')->nullable();
            $table->string('member_phone')->nullable();
            $table->foreignId('reward_id')->nullable()->constrained('rewards')->nullOnDelete();
            $table->string('reward_title');
            $table->string('reward_image')->nullable();
            $table->integer('points_deducted');
            $table->decimal('bp_balance_before', 12, 2)->default(0);
            $table->decimal('bp_balance_after', 12, 2)->default(0);
            $table->text('shipping_address')->nullable();
            $table->string('shipping_city')->nullable();
            $table->string('shipping_state')->nullable();
            $table->string('shipping_pincode')->nullable();
            $table->string('status')->default('pending'); // pending | approved | dispatched | delivered | rejected
            $table->string('courier_partner')->nullable();
            $table->string('tracking_number')->nullable();
            $table->text('admin_notes')->nullable();
            $table->dateTime('claim_date');
            $table->dateTime('processed_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reward_claims');
        Schema::dropIfExists('rewards');
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'bp_balance')) {
                $table->dropColumn('bp_balance');
            }
        });
    }
};
