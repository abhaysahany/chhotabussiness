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
        Schema::create('content_assets', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('type')->default('image'); // image, video, audio, pdf
            $table->string('category'); // Marketing Banners, Promo Videos, Brand Jingles, Marketing Materials, Social Post, etc.
            $table->string('entity_type')->default('chhota_business'); // chhota_business, business, freelance
            $table->string('entity_name'); // Registered entity name or platform name
            $table->text('file_url'); // Direct storage URL or external link
            $table->text('thumbnail')->nullable(); // Preview thumbnail
            $table->string('tags'); // Comma-separated tags
            $table->unsignedInteger('downloads')->default(0);
            $table->unsignedInteger('shares')->default(0);
            $table->string('status')->default('published'); // published, draft
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_assets');
    }
};
