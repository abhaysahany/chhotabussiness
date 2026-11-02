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
        // 1. Add dump_amount to orders table if absent
        $ordersTable = Schema::hasTable('orders') ? 'orders' : (Schema::hasTable('sales_records') ? 'sales_records' : null);
        if ($ordersTable && !Schema::hasColumn($ordersTable, 'dump_amount')) {
            Schema::table($ordersTable, function (Blueprint $table) {
                $table->decimal('dump_amount', 14, 2)->default(0.00)->after('gross_amount');
            });
        }

        // 2. Add payment-level income allocation tracking columns to sale_payments table
        if (Schema::hasTable('sale_payments')) {
            Schema::table('sale_payments', function (Blueprint $table) {
                if (!Schema::hasColumn('sale_payments', 'direct_income_amount')) {
                    $table->decimal('direct_income_amount', 14, 2)->default(0.00)->after('net_entity_amount');
                }
                if (!Schema::hasColumn('sale_payments', 'level_income_amount')) {
                    $table->decimal('level_income_amount', 14, 2)->default(0.00)->after('direct_income_amount');
                }
                if (!Schema::hasColumn('sale_payments', 'reward_income_amount')) {
                    $table->decimal('reward_income_amount', 14, 2)->default(0.00)->after('level_income_amount');
                }
                if (!Schema::hasColumn('sale_payments', 'distributed_admin_cut_amount')) {
                    $table->decimal('distributed_admin_cut_amount', 14, 2)->default(0.00)->after('reward_income_amount');
                }
                if (!Schema::hasColumn('sale_payments', 'income_distribution_status')) {
                    $table->string('income_distribution_status', 24)->default('pending')->after('distributed_admin_cut_amount');
                }
                if (!Schema::hasColumn('sale_payments', 'income_distributed_at')) {
                    $table->timestamp('income_distributed_at')->nullable()->after('income_distribution_status');
                }
                if (!Schema::hasColumn('sale_payments', 'income_distributed_by')) {
                    $table->unsignedBigInteger('income_distributed_by')->nullable()->after('income_distributed_at');
                }
            });

            // 3. Historical Backfill: Protect any historical payments whose parent order was already allocated in Phase 1
            if ($ordersTable) {
                $allocatedOrders = DB::table($ordersTable)
                    ->where('distributed_admin_cut_amount', '>', 0)
                    ->get();

                foreach ($allocatedOrders as $order) {
                    $payments = DB::table('sale_payments')
                        ->where('sales_record_id', $order->id)
                        ->get();

                    foreach ($payments as $payment) {
                        $cut = (float) ($payment->admin_commission_cut ?? 0);
                        if ($cut > 0) {
                            $totalPaise = (int) round($cut * 100);
                            $directPaise = (int) round($totalPaise * 0.40);
                            $levelPaise = (int) round($totalPaise * 0.40);
                            $rewardPaise = $totalPaise - $directPaise - $levelPaise;

                            DB::table('sale_payments')
                                ->where('id', $payment->id)
                                ->update([
                                    'direct_income_amount' => round($directPaise / 100, 2),
                                    'level_income_amount' => round($levelPaise / 100, 2),
                                    'reward_income_amount' => round($rewardPaise / 100, 2),
                                    'distributed_admin_cut_amount' => $cut,
                                    'income_distribution_status' => 'legacy_completed',
                                    'income_distributed_at' => $order->income_distributed_at ?? now(),
                                    'income_distributed_by' => 1,
                                ]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $ordersTable = Schema::hasTable('orders') ? 'orders' : (Schema::hasTable('sales_records') ? 'sales_records' : null);
        if ($ordersTable && Schema::hasColumn($ordersTable, 'dump_amount')) {
            Schema::table($ordersTable, function (Blueprint $table) {
                $table->dropColumn('dump_amount');
            });
        }

        if (Schema::hasTable('sale_payments')) {
            Schema::table('sale_payments', function (Blueprint $table) {
                $columnsToDrop = [];
                foreach ([
                    'direct_income_amount',
                    'level_income_amount',
                    'reward_income_amount',
                    'distributed_admin_cut_amount',
                    'income_distribution_status',
                    'income_distributed_at',
                    'income_distributed_by'
                ] as $column) {
                    if (Schema::hasColumn('sale_payments', $column)) {
                        $columnsToDrop[] = $column;
                    }
                }
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }
};
