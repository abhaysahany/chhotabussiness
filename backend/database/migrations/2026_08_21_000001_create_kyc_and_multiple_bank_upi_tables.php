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
        // 1. Extend users table for Aadhaar and KYC document storage
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'aadhaar_number')) {
                $table->string('aadhaar_number')->nullable()->after('pan_number');
            }
            if (!Schema::hasColumn('users', 'pan_card_image')) {
                $table->text('pan_card_image')->nullable()->after('aadhaar_number');
            }
            if (!Schema::hasColumn('users', 'aadhaar_front_image')) {
                $table->text('aadhaar_front_image')->nullable()->after('pan_card_image');
            }
            if (!Schema::hasColumn('users', 'aadhaar_back_image')) {
                $table->text('aadhaar_back_image')->nullable()->after('aadhaar_front_image');
            }
            if (!Schema::hasColumn('users', 'kyc_submitted_at')) {
                $table->timestamp('kyc_submitted_at')->nullable()->after('kyc_status');
            }
            if (!Schema::hasColumn('users', 'kyc_verified_at')) {
                $table->timestamp('kyc_verified_at')->nullable()->after('kyc_submitted_at');
            }
        });

        // 2. Create user_bank_accounts table for multiple bank accounts
        if (!Schema::hasTable('user_bank_accounts')) {
            Schema::create('user_bank_accounts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('user_code')->index();
                $table->string('bank_name');
                $table->string('account_number');
                $table->string('ifsc_code');
                $table->string('account_holder_name');
                $table->string('branch')->nullable();
                $table->boolean('is_primary')->default(false);
                $table->boolean('is_verified')->default(true);
                $table->timestamps();
            });
        }

        // 3. Create user_upi_accounts table for multiple UPI IDs with QR code
        if (!Schema::hasTable('user_upi_accounts')) {
            Schema::create('user_upi_accounts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('user_code')->index();
                $table->string('upi_id');
                $table->string('holder_name');
                $table->text('qr_code_image')->nullable();
                $table->boolean('is_primary')->default(false);
                $table->boolean('is_verified')->default(true);
                $table->timestamps();
            });
        }

        // 4. Create email_otps table for OTP verification when modifying bank/UPI
        if (!Schema::hasTable('email_otps')) {
            Schema::create('email_otps', function (Blueprint $table) {
                $table->id();
                $table->string('email')->index();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action'); // 'add_bank', 'update_bank', 'delete_bank', 'add_upi', 'delete_upi'
                $table->string('otp', 10);
                $table->timestamp('expires_at');
                $table->boolean('is_used')->default(false);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_otps');
        Schema::dropIfExists('user_upi_accounts');
        Schema::dropIfExists('user_bank_accounts');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'aadhaar_number',
                'pan_card_image',
                'aadhaar_front_image',
                'aadhaar_back_image',
                'kyc_submitted_at',
                'kyc_verified_at',
            ]);
        });
    }
};
