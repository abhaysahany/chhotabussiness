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
        Schema::create('freelancer_entities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_category_id')->constrained('entity_categories')->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->string('title');
            $table->integer('experience_years')->default(1);
            $table->string('hourly_rate')->default('₹500/hr');
            $table->text('bio')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('portfolio_link')->nullable();
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->boolean('featured')->default(true); // For advertisements
            $table->json('documents')->nullable(); // JSON array of document objects
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_entities');
    }
};
