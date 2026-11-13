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
        // TASK 2: Create or update total_level_incomes table
        if (!Schema::hasTable('total_level_incomes')) {
            Schema::create('total_level_incomes', function (Blueprint $table) {
                $table->id();
                $table->string('user_code', 50)->index();
                $table->string('level_id', 50)->index();
                $table->string('level', 50);
                $table->string('payment_type', 50)->default('advance');
                $table->decimal('total_amount', 15, 2)->default(0.00);
                $table->decimal('paid_amount', 15, 2)->default(0.00);
                $table->decimal('balance_amount', 15, 2)->default(0.00);
                $table->decimal('dump_amount', 15, 2)->default(0.00);
                $table->timestamps();
            });
        }

        // TASK 1: Modify existing level_incomes table
        if (Schema::hasTable('level_incomes')) {
            Schema::table('level_incomes', function (Blueprint $table) {
                // Ensure payment_type exists
                if (!Schema::hasColumn('level_incomes', 'payment_type')) {
                    $table->string('payment_type', 50)->default('advance')->after('payment_id');
                }

                // Drop the four amount columns
                $columnsToDrop = [];
                foreach (['total_amount', 'paid_amount', 'balance_amount', 'dump_amount'] as $col) {
                    if (Schema::hasColumn('level_incomes', $col)) {
                        $columnsToDrop[] = $col;
                    }
                }

                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('level_incomes')) {
            Schema::table('level_incomes', function (Blueprint $table) {
                if (!Schema::hasColumn('level_incomes', 'total_amount')) {
                    $table->decimal('total_amount', 15, 2)->default(0.00);
                }
                if (!Schema::hasColumn('level_incomes', 'paid_amount')) {
                    $table->decimal('paid_amount', 15, 2)->default(0.00);
                }
                if (!Schema::hasColumn('level_incomes', 'balance_amount')) {
                    $table->decimal('balance_amount', 15, 2)->default(0.00);
                }
                if (!Schema::hasColumn('level_incomes', 'dump_amount')) {
                    $table->decimal('dump_amount', 15, 2)->default(0.00);
                }
            });
        }

        Schema::dropIfExists('total_level_incomes');
    }
};
