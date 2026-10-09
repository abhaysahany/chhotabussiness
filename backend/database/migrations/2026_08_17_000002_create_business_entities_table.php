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
        Schema::create('business_entities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_category_id')->constrained('entity_categories')->onDelete('cascade');
            $table->string('name');
            $table->string('owner_name');
            $table->string('email');
            $table->string('phone');
            $table->text('address')->nullable();
            $table->string('registration_no')->nullable();
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('website')->nullable();
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->boolean('featured')->default(true); // For advertisements
            $table->json('documents')->nullable(); // JSON array of document objects: [{title, file_name, url, status}]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_entities');
    }
};
