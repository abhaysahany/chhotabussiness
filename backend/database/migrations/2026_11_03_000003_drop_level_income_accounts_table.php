<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop level_income_accounts table
        Schema::dropIfExists('level_income_accounts');

        // 2. Drop legacy labeling_income view if exists
        DB::statement("DROP VIEW IF EXISTS labeling_income");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS labeling_income");
    }
};
