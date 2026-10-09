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
            $table->string('customer_user_code')->nullable()->after('customer_name');
            $table->string('sponsor')->nullable()->after('customer_user_code');
            $table->string('network_distribution_status')->default('pending_admin_distribution')->after('payment_date');
            $table->decimal('direct_commission', 12, 2)->default(0)->after('network_distribution_status');
            $table->decimal('level_commissions_total', 12, 2)->default(0)->after('direct_commission');
            $table->decimal('team_volume_bv', 12, 2)->default(0)->after('level_commissions_total');
            $table->boolean('commission_distributed')->default(false)->after('team_volume_bv');
            $table->json('distribution_details')->nullable()->after('commission_distributed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_payments', function (Blueprint $table) {
            $table->dropColumn([
                'customer_user_code',
                'sponsor',
                'network_distribution_status',
                'direct_commission',
                'level_commissions_total',
                'team_volume_bv',
                'commission_distributed',
                'distribution_details',
            ]);
        });
    }
};
