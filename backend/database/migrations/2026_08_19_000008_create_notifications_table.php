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
        // Master notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('announcement'); // info | success | warning | announcement
            $table->string('target_audience')->default('all_users'); // single_user | active_users | inactive_users | all_users
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('target_user_code')->nullable();
            $table->string('target_user_name')->nullable();
            $table->string('action_url')->nullable();
            $table->integer('recipients_count')->default(0);
            $table->string('created_by')->default('Admin Desk');
            $table->timestamps();
        });

        // User reads tracking ledger
        Schema::create('user_notification_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('user_code')->nullable();
            $table->foreignId('notification_id')->constrained('notifications')->cascadeOnDelete();
            $table->boolean('is_read')->default(true);
            $table->dateTime('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notification_reads');
        Schema::dropIfExists('notifications');
    }
};
