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
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_code')->unique();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name');
            $table->string('user_email');
            $table->string('subject');
            $table->string('category')->default('General');
            $table->enum('priority', ['Low', 'Medium', 'High', 'Urgent'])->default('Medium');
            $table->enum('status', ['Open', 'In Progress', 'Resolved', 'Closed'])->default('Open');
            $table->timestamps();
        });

        Schema::create('support_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ticket_id');
            $table->enum('sender_type', ['user', 'admin', 'bot'])->default('user');
            $table->string('sender_name');
            $table->text('message');
            $table->string('attachment')->nullable();
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('support_tickets')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_messages');
        Schema::dropIfExists('support_tickets');
    }
};
