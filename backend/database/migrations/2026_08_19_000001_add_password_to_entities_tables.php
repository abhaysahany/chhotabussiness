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
        Schema::table('business_entities', function (Blueprint $table) {
            if (!Schema::hasColumn('business_entities', 'password')) {
                $table->string('password')->nullable()->after('phone');
            }
        });

        Schema::table('freelancer_entities', function (Blueprint $table) {
            if (!Schema::hasColumn('freelancer_entities', 'password')) {
                $table->string('password')->nullable()->after('phone');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_entities', function (Blueprint $table) {
            if (Schema::hasColumn('business_entities', 'password')) {
                $table->dropColumn('password');
            }
        });

        Schema::table('freelancer_entities', function (Blueprint $table) {
            if (Schema::hasColumn('freelancer_entities', 'password')) {
                $table->dropColumn('password');
            }
        });
    }
};
