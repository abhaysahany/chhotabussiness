<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'rank')) {
                $table->string('rank')->default('Bronze Starter')->after('kyc_status');
            }
            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->after('rank');
            }
            if (!Schema::hasColumn('users', 'location')) {
                $table->string('location')->nullable()->after('status');
            }
            if (!Schema::hasColumn('users', 'personal_pv')) {
                $table->unsignedInteger('personal_pv')->default(0)->after('location');
            }
            if (!Schema::hasColumn('users', 'group_pv')) {
                $table->unsignedBigInteger('group_pv')->default(0)->after('personal_pv');
            }
        });

        // Ensure Root user (CB100001) is Crown Diamond with active rank
        DB::table('users')->where('user_code', 'CB100001')->update([
            'rank' => 'Crown Diamond',
            'status' => 'active',
            'location' => 'Mumbai, Maharashtra',
            'personal_pv' => 3500,
            'group_pv' => 4310000,
            'kyc_status' => 'verified',
        ]);

        // Seed 7-Level generation hierarchy linked to CB100001
        $defaultPassword = Hash::make('password123');

        $networkSeedUsers = [
            // --- LEVEL 1 (Direct to CB100001) ---
            [
                'user_code' => 'CB100201',
                'name' => 'Rahul Sharma',
                'email' => 'rahul.sharma@gmail.com',
                'phone' => '+91 98765 43210',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100001',
                'rank' => 'Gold Executive',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Mumbai, Maharashtra',
                'personal_pv' => 1250,
                'group_pv' => 450000,
                'commission_balance' => 14500.00,
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(60),
                'updated_at' => now()->subDays(60),
            ],
            [
                'user_code' => 'CB100202',
                'name' => 'Priya Verma',
                'email' => 'priya.v@outlook.com',
                'phone' => '+91 98123 45678',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100001',
                'rank' => 'Silver Leader',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Delhi NCR',
                'personal_pv' => 850,
                'group_pv' => 280000,
                'commission_balance' => 9200.00,
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(55),
                'updated_at' => now()->subDays(55),
            ],
            [
                'user_code' => 'CB100203',
                'name' => 'Amitabh Kumar',
                'email' => 'amitabh.k@yahoo.com',
                'phone' => '+91 97654 32109',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100001',
                'rank' => 'Platinum Pro',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Bengaluru, Karnataka',
                'personal_pv' => 2400,
                'group_pv' => 380000,
                'commission_balance' => 38000.00,
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(45),
                'updated_at' => now()->subDays(45),
            ],
            [
                'user_code' => 'CB100204',
                'name' => 'Sneha Kulkarni',
                'email' => 'sneha.kul@gmail.com',
                'phone' => '+91 99887 76655',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100001',
                'rank' => 'Bronze Starter',
                'status' => 'inactive',
                'kyc_status' => 'unverified',
                'location' => 'Pune, Maharashtra',
                'personal_pv' => 400,
                'group_pv' => 21000,
                'commission_balance' => 2100.00,
                'avatar' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(30),
                'updated_at' => now()->subDays(30),
            ],
            [
                'user_code' => 'CB100205',
                'name' => 'Vikramaditya Singh',
                'email' => 'vikram.singh@gmail.com',
                'phone' => '+91 91234 56789',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100001',
                'rank' => 'Diamond Director',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Jaipur, Rajasthan',
                'personal_pv' => 3500,
                'group_pv' => 760000,
                'commission_balance' => 76000.00,
                'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(25),
                'updated_at' => now()->subDays(25),
            ],

            // --- LEVEL 2 (Sponsored by Rahul Sharma CB100201 & Priya Verma CB100202) ---
            [
                'user_code' => 'CB100301',
                'name' => 'Rohan Mehra',
                'email' => 'rohan.m@gmail.com',
                'phone' => '+91 98222 33344',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100201',
                'rank' => 'Gold Executive',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Ahmedabad, Gujarat',
                'personal_pv' => 1100,
                'group_pv' => 185000,
                'commission_balance' => 12500.00,
                'avatar' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(40),
                'updated_at' => now()->subDays(40),
            ],
            [
                'user_code' => 'CB100302',
                'name' => 'Neha Gupta',
                'email' => 'neha.g@gmail.com',
                'phone' => '+91 98333 44455',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100201',
                'rank' => 'Bronze Starter',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Surat, Gujarat',
                'personal_pv' => 600,
                'group_pv' => 52000,
                'commission_balance' => 4800.00,
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(35),
                'updated_at' => now()->subDays(35),
            ],
            [
                'user_code' => 'CB100303',
                'name' => 'Deepak Patel',
                'email' => 'deepak.p@gmail.com',
                'phone' => '+91 98444 55566',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100202',
                'rank' => 'Silver Leader',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Chandigarh',
                'personal_pv' => 900,
                'group_pv' => 74000,
                'commission_balance' => 6500.00,
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(32),
                'updated_at' => now()->subDays(32),
            ],

            // --- LEVEL 3 (Sponsored by Rohan Mehra CB100301) ---
            [
                'user_code' => 'CB100401',
                'name' => 'Aarav Joshi',
                'email' => 'aarav.j@gmail.com',
                'phone' => '+91 98555 66677',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100301',
                'rank' => 'Silver Leader',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Indore, Madhya Pradesh',
                'personal_pv' => 950,
                'group_pv' => 89000,
                'commission_balance' => 7800.00,
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(28),
                'updated_at' => now()->subDays(28),
            ],
            [
                'user_code' => 'CB100402',
                'name' => 'Kavita Nair',
                'email' => 'kavita.n@gmail.com',
                'phone' => '+91 98666 77788',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100301',
                'rank' => 'Bronze Starter',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Kochi, Kerala',
                'personal_pv' => 500,
                'group_pv' => 31000,
                'commission_balance' => 3200.00,
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(24),
                'updated_at' => now()->subDays(24),
            ],

            // --- LEVEL 4 (Sponsored by Aarav Joshi CB100401) ---
            [
                'user_code' => 'CB100501',
                'name' => 'Vikas Pandey',
                'email' => 'vikas.p@gmail.com',
                'phone' => '+91 98777 88899',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100401',
                'rank' => 'Diamond Director',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Lucknow, UP',
                'personal_pv' => 3200,
                'group_pv' => 620000,
                'commission_balance' => 54000.00,
                'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(20),
                'updated_at' => now()->subDays(20),
            ],

            // --- LEVEL 5 (Sponsored by Vikas Pandey CB100501) ---
            [
                'user_code' => 'CB100601',
                'name' => 'Manish Tiwari',
                'email' => 'manish.t@gmail.com',
                'phone' => '+91 98888 99900',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100501',
                'rank' => 'Platinum Pro',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Patna, Bihar',
                'personal_pv' => 1800,
                'group_pv' => 240000,
                'commission_balance' => 22000.00,
                'avatar' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(15),
            ],

            // --- LEVEL 6 (Sponsored by Manish Tiwari CB100601) ---
            [
                'user_code' => 'CB100701',
                'name' => 'Sunil Choudhary',
                'email' => 'sunil.c@gmail.com',
                'phone' => '+91 98999 00011',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100601',
                'rank' => 'Gold Executive',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Ranchi, Jharkhand',
                'personal_pv' => 1300,
                'group_pv' => 95000,
                'commission_balance' => 9500.00,
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(10),
            ],

            // --- LEVEL 7 (Sponsored by Sunil Choudhary CB100701) ---
            [
                'user_code' => 'CB100801',
                'name' => 'Karan Singhal',
                'email' => 'karan.s@gmail.com',
                'phone' => '+91 99000 11122',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100701',
                'rank' => 'Silver Leader',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Bhopal, MP',
                'personal_pv' => 750,
                'group_pv' => 45000,
                'commission_balance' => 4200.00,
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],

            // --- LEVEL 8 (Sponsored by Karan Singhal CB100801) ---
            [
                'user_code' => 'CB100901',
                'name' => 'Pooja Hegde',
                'email' => 'pooja.h@gmail.com',
                'phone' => '+91 99111 22233',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100801',
                'rank' => 'Bronze Starter',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Hyderabad, Telangana',
                'personal_pv' => 600,
                'group_pv' => 32000,
                'commission_balance' => 3200.00,
                'avatar' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subDays(4),
            ],

            // --- LEVEL 9 (Sponsored by Pooja Hegde CB100901) ---
            [
                'user_code' => 'CB101001',
                'name' => 'Naveen Reddy',
                'email' => 'naveen.r@gmail.com',
                'phone' => '+91 99222 33344',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB100901',
                'rank' => 'Silver Leader',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Visakhapatnam, AP',
                'personal_pv' => 800,
                'group_pv' => 22000,
                'commission_balance' => 2200.00,
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(3),
            ],

            // --- LEVEL 10 (Sponsored by Naveen Reddy CB101001) ---
            [
                'user_code' => 'CB101101',
                'name' => 'Divya Bansal',
                'email' => 'divya.b@gmail.com',
                'phone' => '+91 99333 44455',
                'password' => $defaultPassword,
                'sponsor_id' => 'CB101001',
                'rank' => 'Bronze Starter',
                'status' => 'active',
                'kyc_status' => 'verified',
                'location' => 'Chandigarh',
                'personal_pv' => 450,
                'group_pv' => 15000,
                'commission_balance' => 1500.00,
                'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
        ];

        foreach ($networkSeedUsers as $userData) {
            $existing = DB::table('users')->where('user_code', $userData['user_code'])->orWhere('email', $userData['email'])->first();
            if ($existing) {
                DB::table('users')->where('id', $existing->id)->update($userData);
            } else {
                DB::table('users')->insert($userData);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['rank', 'status', 'location', 'personal_pv', 'group_pv']);
        });
    }
};
