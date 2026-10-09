<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Alter users table image columns to LONGTEXT to accommodate full base64 photos
        DB::statement('ALTER TABLE users MODIFY pan_card_image LONGTEXT NULL');
        DB::statement('ALTER TABLE users MODIFY aadhaar_front_image LONGTEXT NULL');
        DB::statement('ALTER TABLE users MODIFY aadhaar_back_image LONGTEXT NULL');

        if (Schema::hasTable('user_upi_accounts')) {
            DB::statement('ALTER TABLE user_upi_accounts MODIFY qr_code_image LONGTEXT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down needed
    }
};
