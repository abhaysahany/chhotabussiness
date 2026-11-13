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
        Schema::create('entity_commission_settings', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 32); // 'business' | 'freelancer'
            $table->unsignedBigInteger('entity_id');
            $table->decimal('direct_percent', 5, 2)->default(0.00);
            $table->decimal('level_1_percent', 5, 2)->default(0.00);
            $table->decimal('level_2_percent', 5, 2)->default(0.00);
            $table->decimal('level_3_percent', 5, 2)->default(0.00);
            $table->decimal('level_4_percent', 5, 2)->default(0.00);
            $table->decimal('reward_percent', 5, 2)->default(0.00);
            $table->timestamps();

            // Enforce uniqueness for (entity_type, entity_id) combination
            $table->unique(['entity_type', 'entity_id'], 'entity_comm_settings_type_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entity_commission_settings');
    }
};
