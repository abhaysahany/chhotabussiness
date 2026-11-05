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
            if (!Schema::hasColumn('users', 'sponsor_onboarding_status')) {
                $table->string('sponsor_onboarding_status', 32)
                    ->default('completed')
                    ->after('sponsor_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'sponsor_onboarding_status')) {
                $table->dropColumn('sponsor_onboarding_status');
            }
        });
    }
};
