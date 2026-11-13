<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('sales_records') && !Schema::hasTable('orders')) {
            // 1. Drop existing foreign key on sale_payments pointing to sales_records
            if (Schema::hasTable('sale_payments')) {
                // Find existing constraint name dynamically or use standard Laravel naming
                $constraint = DB::selectOne("
                    SELECT CONSTRAINT_NAME 
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = DATABASE() 
                      AND TABLE_NAME = 'sale_payments' 
                      AND COLUMN_NAME = 'sales_record_id' 
                      AND REFERENCED_TABLE_NAME IS NOT NULL
                ");

                if ($constraint && !empty($constraint->CONSTRAINT_NAME)) {
                    Schema::table('sale_payments', function (Blueprint $table) use ($constraint) {
                        $table->dropForeign($constraint->CONSTRAINT_NAME);
                    });
                }
            }

            // 2. In-place rename of sales_records to orders
            Schema::rename('sales_records', 'orders');

            // 3. Re-add foreign key pointing to orders.id
            if (Schema::hasTable('sale_payments')) {
                Schema::table('sale_payments', function (Blueprint $table) {
                    $table->foreign('sales_record_id')
                          ->references('id')
                          ->on('orders')
                          ->onDelete('cascade');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders') && !Schema::hasTable('sales_records')) {
            // 1. Drop foreign key pointing to orders
            if (Schema::hasTable('sale_payments')) {
                $constraint = DB::selectOne("
                    SELECT CONSTRAINT_NAME 
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = DATABASE() 
                      AND TABLE_NAME = 'sale_payments' 
                      AND COLUMN_NAME = 'sales_record_id' 
                      AND REFERENCED_TABLE_NAME IS NOT NULL
                ");

                if ($constraint && !empty($constraint->CONSTRAINT_NAME)) {
                    Schema::table('sale_payments', function (Blueprint $table) use ($constraint) {
                        $table->dropForeign($constraint->CONSTRAINT_NAME);
                    });
                }
            }

            // 2. In-place rename of orders back to sales_records
            Schema::rename('orders', 'sales_records');

            // 3. Re-add foreign key pointing to sales_records.id
            if (Schema::hasTable('sale_payments')) {
                Schema::table('sale_payments', function (Blueprint $table) {
                    $table->foreign('sales_record_id')
                          ->references('id')
                          ->on('sales_records')
                          ->onDelete('cascade');
                });
            }
        }
    }
};
