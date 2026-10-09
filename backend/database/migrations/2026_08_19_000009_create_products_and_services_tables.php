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
        // 1. Categories Table
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type')->default('both'); // product | service | both
            $table->string('icon')->nullable();
            $table->string('status')->default('active'); // active | inactive
            $table->timestamps();
        });

        // 2. Products Table
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->default('Software & IT');
            $table->string('owner_type')->default('business'); // business | freelancer | admin
            $table->string('owner_name')->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->decimal('admin_commission_percent', 5, 2)->default(10.00);
            $table->integer('stock')->default(100);
            $table->string('sku')->nullable();
            $table->string('status')->default('active'); // active | inactive
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 3. Services Table
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->default('Legal & Compliance');
            $table->string('owner_type')->default('business'); // business | freelancer | admin
            $table->string('owner_name')->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->decimal('admin_commission_percent', 5, 2)->default(15.00);
            $table->string('duration')->default('3 Business Days');
            $table->string('status')->default('active'); // active | inactive
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 4. Packages Table
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 10, 2)->default(0.00);
            $table->decimal('commission_percent', 5, 2)->default(10.00);
            $table->text('description')->nullable();
            $table->json('items_included')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packages');
        Schema::dropIfExists('services');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
