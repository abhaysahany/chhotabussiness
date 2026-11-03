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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('approval_status', 20)->default('confirmed')->after('status')->index();
            $table->unsignedBigInteger('admin_confirmed_by')->nullable()->after('approval_status');
            $table->timestamp('admin_confirmed_at')->nullable()->after('admin_confirmed_by');
            $table->unsignedBigInteger('admin_cancelled_by')->nullable()->after('admin_confirmed_at');
            $table->timestamp('admin_cancelled_at')->nullable()->after('admin_cancelled_by');
            $table->text('cancellation_reason')->nullable()->after('admin_cancelled_at');
        });

        // Ensure all historical records remain confirmed
        DB::table('orders')->update(['approval_status' => 'confirmed']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['approval_status']);
            $table->dropColumn([
                'approval_status',
                'admin_confirmed_by',
                'admin_confirmed_at',
                'admin_cancelled_by',
                'admin_cancelled_at',
                'cancellation_reason',
            ]);
        });
    }
};
