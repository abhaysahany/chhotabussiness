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
        // Note: direct_income_accounts and level_income_accounts tables removed in favor of direct_incomes and level_incomes

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
