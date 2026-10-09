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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'commission_balance')) {
                $table->decimal('commission_balance', 12, 2)->default(0)->after('sponsor_id');
            }
            if (!Schema::hasColumn('users', 'kyc_status')) {
                $table->string('kyc_status')->default('unverified')->after('commission_balance');
            }
            if (!Schema::hasColumn('users', 'pan_number')) {
                $table->string('pan_number')->nullable()->after('kyc_status');
            }
            if (!Schema::hasColumn('users', 'bank_name')) {
                $table->string('bank_name')->nullable()->after('pan_number');
            }
            if (!Schema::hasColumn('users', 'account_number')) {
                $table->string('account_number')->nullable()->after('bank_name');
            }
            if (!Schema::hasColumn('users', 'ifsc_code')) {
                $table->string('ifsc_code')->nullable()->after('account_number');
            }
            if (!Schema::hasColumn('users', 'account_holder_name')) {
                $table->string('account_holder_name')->nullable()->after('ifsc_code');
            }
            if (!Schema::hasColumn('users', 'upi_id')) {
                $table->string('upi_id')->nullable()->after('account_holder_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'commission_balance',
                'kyc_status',
                'pan_number',
                'bank_name',
                'account_number',
                'ifsc_code',
                'account_holder_name',
                'upi_id'
            ]);
        });
    }
};
