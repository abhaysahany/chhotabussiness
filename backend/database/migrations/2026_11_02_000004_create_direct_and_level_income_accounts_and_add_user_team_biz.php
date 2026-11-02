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
        // 1. Task 1: Direct Income Summary Table (One record per recipient User)
        if (!Schema::hasTable('direct_income_accounts')) {
            Schema::create('direct_income_accounts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
                $table->string('member_id')->nullable();
                $table->string('user_name')->nullable();
                $table->decimal('total_amount', 14, 2)->default(0.00);
                $table->decimal('paid_amount', 14, 2)->default(0.00);
                $table->decimal('balance_amount', 14, 2)->default(0.00);
                $table->decimal('dump_amount', 14, 2)->default(0.00);
                $table->timestamps();
            });
        }

        // 2. Task 2: Level Income Summary Table (Separate records for Levels 2, 3, 4, and 5)
        if (!Schema::hasTable('level_income_accounts')) {
            Schema::create('level_income_accounts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('member_id')->nullable();
                $table->string('user_name')->nullable();
                $table->unsignedTinyInteger('level_number'); // 2, 3, 4, or 5
                $table->decimal('total_amount', 14, 2)->default(0.00);
                $table->decimal('paid_amount', 14, 2)->default(0.00);
                $table->decimal('balance_amount', 14, 2)->default(0.00);
                $table->decimal('dump_amount', 14, 2)->default(0.00);
                $table->timestamps();

                $table->unique(['user_id', 'level_number']);
            });
        }

        // 3. Task 3: Add team_biz to users table if absent (Monetary balance in INR, defaults to 0.00)
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'team_biz')) {
            Schema::table('users', function (Blueprint $table) {
                $table->decimal('team_biz', 14, 2)->default(0.00)->after('group_pv');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'team_biz')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('team_biz');
            });
        }

        Schema::dropIfExists('level_income_accounts');
        Schema::dropIfExists('direct_income_accounts');
    }
};
