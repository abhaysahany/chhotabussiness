<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('direct_income_accounts');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Table permanently deprecated in favor of direct_incomes
    }
};
