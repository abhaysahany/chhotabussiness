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
        Schema::table('sale_payments', function (Blueprint $table) {
            $columnsToDrop = [
                'network_distribution_status',
                'direct_commission',
                'level_commissions_total',
                'team_volume_bv',
                'commission_distributed',
                'distribution_details',
            ];

            $existing = array_filter($columnsToDrop, function ($col) {
                return Schema::hasColumn('sale_payments', $col);
            });

            if (!empty($existing)) {
                $table->dropColumn(array_values($existing));
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_payments', 'network_distribution_status')) {
                $table->string('network_distribution_status')->default('pending_admin_distribution')->after('payment_date');
            }
            if (!Schema::hasColumn('sale_payments', 'direct_commission')) {
                $table->decimal('direct_commission', 12, 2)->default(0)->after('network_distribution_status');
            }
            if (!Schema::hasColumn('sale_payments', 'level_commissions_total')) {
                $table->decimal('level_commissions_total', 12, 2)->default(0)->after('direct_commission');
            }
            if (!Schema::hasColumn('sale_payments', 'team_volume_bv')) {
                $table->decimal('team_volume_bv', 12, 2)->default(0)->after('level_commissions_total');
            }
            if (!Schema::hasColumn('sale_payments', 'commission_distributed')) {
                $table->boolean('commission_distributed')->default(false)->after('team_volume_bv');
            }
            if (!Schema::hasColumn('sale_payments', 'distribution_details')) {
                $table->json('distribution_details')->nullable()->after('commission_distributed');
            }
        });
    }
};
