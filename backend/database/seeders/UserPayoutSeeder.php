<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserPayout;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserPayoutSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure KYC-verified users with bank accounts exist
        $usersData = [
            [
                'user_code' => 'CB100001',
                'name' => 'Rahul Verma',
                'email' => 'rahul.verma@example.com',
                'phone' => '+91 98765 43210',
                'sponsor_id' => 'Vikram Singh (#1001)',
                'commission_balance' => 18500.00,
                'kyc_status' => 'verified',
                'pan_number' => 'ABCDE1234F',
                'bank_name' => 'HDFC Bank Ltd',
                'account_number' => '50100234918231',
                'ifsc_code' => 'HDFC0001234',
                'account_holder_name' => 'Rahul Verma',
                'upi_id' => 'rahulverma@okhdfcbank',
            ],
            [
                'user_code' => 'CB100002',
                'name' => 'Anita Sharma',
                'email' => 'anita.s@example.com',
                'phone' => '+91 98111 22334',
                'sponsor_id' => 'Suresh Kumar (#960)',
                'commission_balance' => 12400.00,
                'kyc_status' => 'verified',
                'pan_number' => 'BKUPS9871P',
                'bank_name' => 'State Bank of India',
                'account_number' => '31298450192',
                'ifsc_code' => 'SBIN0004567',
                'account_holder_name' => 'Anita Sharma',
                'upi_id' => 'anitasharma@okaxis',
            ],
            [
                'user_code' => 'CB100003',
                'name' => 'Amit Patel',
                'email' => 'amit.patel@example.com',
                'phone' => '+91 97234 56789',
                'sponsor_id' => 'CB100001',
                'commission_balance' => 6800.00,
                'kyc_status' => 'verified',
                'pan_number' => 'CKZPA4321Q',
                'bank_name' => 'ICICI Bank',
                'account_number' => '001801594821',
                'ifsc_code' => 'ICIC0000018',
                'account_holder_name' => 'Amit Patel',
                'upi_id' => 'amitpatel@icici',
            ],
            [
                'user_code' => 'CB100004',
                'name' => 'Pooja Hegde',
                'email' => 'pooja.h@example.com',
                'phone' => '+91 99001 88776',
                'sponsor_id' => 'CB100002',
                'commission_balance' => 25000.00,
                'kyc_status' => 'verified',
                'pan_number' => 'DFGPH5566K',
                'bank_name' => 'Axis Bank',
                'account_number' => '91802003847583',
                'ifsc_code' => 'UTIB0000521',
                'account_holder_name' => 'Pooja Hegde',
                'upi_id' => 'poojahegde@axisbank',
            ],
            [
                'user_code' => 'CB100005',
                'name' => 'Deepak Joshi',
                'email' => 'deepak.j@example.com',
                'phone' => '+91 94567 11223',
                'sponsor_id' => 'CB100001',
                'commission_balance' => 950.00,
                'kyc_status' => 'verified',
                'pan_number' => 'ERTDJ3344L',
                'bank_name' => 'Kotak Mahindra Bank',
                'account_number' => '4812903847',
                'ifsc_code' => 'KKBK0000214',
                'account_holder_name' => 'Deepak Joshi',
                'upi_id' => 'deepakjoshi@kotak',
            ],
            [
                'user_code' => 'CB100006',
                'name' => 'Kavita Reddy (Low Balance Test)',
                'email' => 'kavita.r@example.com',
                'phone' => '+91 98450 12345',
                'sponsor_id' => 'CB100002',
                'commission_balance' => 350.00, // Less than ₹500 - should NOT be auto-generated in weekly batch
                'kyc_status' => 'verified',
                'pan_number' => 'ABCDE9999K',
                'bank_name' => 'HDFC Bank',
                'account_number' => '50100987654321',
                'ifsc_code' => 'HDFC0000001',
                'account_holder_name' => 'Kavita Reddy',
                'upi_id' => 'kavita@hdfc',
            ],
        ];

        foreach ($usersData as $data) {
            $user = User::where('user_code', $data['user_code'])->orWhere('email', $data['email'])->first();
            if ($user) {
                $user->update($data);
            } else {
                User::create(array_merge($data, [
                    'password' => Hash::make('password123'),
                ]));
            }
        }

        // 2. Clear old demo payouts and seed initial database payout records
        UserPayout::truncate();

        $samplePayouts = [
            [
                'payout_code' => 'PAY-2026-101',
                'user_code' => 'CB100001',
                'member_name' => 'Rahul Verma',
                'member_email' => 'rahul.verma@example.com',
                'member_phone' => '+91 98765 43210',
                'sponsor' => 'Vikram Singh (#1001)',
                'wallet_balance_before' => 28500.00,
                'requested_amount' => 15000.00,
                'tds_rate' => 5.00,
                'tds_deduction' => 750.00,
                'admin_processing_fee' => 0.00,
                'net_payable_amount' => 14250.00,
                'payment_method' => 'IMPS Direct Bank Transfer',
                'bank_name' => 'HDFC Bank Ltd',
                'account_number' => '50100234918231',
                'ifsc_code' => 'HDFC0001234',
                'account_holder_name' => 'Rahul Verma',
                'upi_id' => 'rahulverma@okhdfcbank',
                'pan_number' => 'ABCDE1234F',
                'kyc_status' => 'verified',
                'status' => 'pending',
                'request_date' => now()->subDays(1),
                'processed_date' => null,
                'utr_number' => null,
                'admin_notes' => null,
                'batch_reference' => 'BATCH-WK-2026-33',
            ],
            [
                'payout_code' => 'PAY-2026-102',
                'user_code' => 'CB100002',
                'member_name' => 'Anita Sharma',
                'member_email' => 'anita.s@example.com',
                'member_phone' => '+91 98111 22334',
                'sponsor' => 'Suresh Kumar (#960)',
                'wallet_balance_before' => 18200.00,
                'requested_amount' => 12000.00,
                'tds_rate' => 5.00,
                'tds_deduction' => 600.00,
                'admin_processing_fee' => 0.00,
                'net_payable_amount' => 11400.00,
                'payment_method' => 'UPI Instant Payout',
                'bank_name' => 'State Bank of India',
                'account_number' => '31298450192',
                'ifsc_code' => 'SBIN0004567',
                'account_holder_name' => 'Anita Sharma',
                'upi_id' => 'anitasharma@okaxis',
                'pan_number' => 'BKUPS9871P',
                'kyc_status' => 'verified',
                'status' => 'pending',
                'request_date' => now()->subHours(18),
                'processed_date' => null,
                'utr_number' => null,
                'admin_notes' => null,
                'batch_reference' => 'BATCH-WK-2026-33',
            ],
            [
                'payout_code' => 'PAY-2026-103',
                'user_code' => 'CB100003',
                'member_name' => 'Amit Patel',
                'member_email' => 'amit.patel@example.com',
                'member_phone' => '+91 97234 56789',
                'sponsor' => 'Rahul Verma (CB100001)',
                'wallet_balance_before' => 9800.00,
                'requested_amount' => 5000.00,
                'tds_rate' => 5.00,
                'tds_deduction' => 250.00,
                'admin_processing_fee' => 0.00,
                'net_payable_amount' => 4750.00,
                'payment_method' => 'NEFT Transfer',
                'bank_name' => 'ICICI Bank',
                'account_number' => '001801594821',
                'ifsc_code' => 'ICIC0000018',
                'account_holder_name' => 'Amit Patel',
                'upi_id' => 'amitpatel@icici',
                'pan_number' => 'CKZPA4321Q',
                'kyc_status' => 'verified',
                'status' => 'pending',
                'request_date' => now()->subHours(6),
                'processed_date' => null,
                'utr_number' => null,
                'admin_notes' => null,
                'batch_reference' => 'BATCH-WK-2026-33',
            ],
            [
                'payout_code' => 'PAY-2026-104',
                'user_code' => 'CB100004',
                'member_name' => 'Pooja Hegde',
                'member_email' => 'pooja.h@example.com',
                'member_phone' => '+91 99001 88776',
                'sponsor' => 'Anita Sharma (CB100002)',
                'wallet_balance_before' => 34000.00,
                'requested_amount' => 25000.00,
                'tds_rate' => 5.00,
                'tds_deduction' => 1250.00,
                'admin_processing_fee' => 0.00,
                'net_payable_amount' => 23750.00,
                'payment_method' => 'IMPS Direct Bank Transfer',
                'bank_name' => 'Axis Bank',
                'account_number' => '91802003847583',
                'ifsc_code' => 'UTIB0000521',
                'account_holder_name' => 'Pooja Hegde',
                'upi_id' => 'poojahegde@axisbank',
                'pan_number' => 'DFGPH5566K',
                'kyc_status' => 'verified',
                'status' => 'completed',
                'request_date' => now()->subDays(3),
                'processed_date' => now()->subDays(3)->addHours(2),
                'utr_number' => 'UTR-89341209845',
                'admin_notes' => 'Direct IMPS disbursement authorized by Finance Desk.',
                'batch_reference' => 'BATCH-WK-2026-32',
            ],
            [
                'payout_code' => 'PAY-2026-105',
                'user_code' => 'CB100005',
                'member_name' => 'Deepak Joshi',
                'member_email' => 'deepak.j@example.com',
                'member_phone' => '+91 94567 11223',
                'sponsor' => 'Rahul Verma (CB100001)',
                'wallet_balance_before' => 14500.00,
                'requested_amount' => 10000.00,
                'tds_rate' => 5.00,
                'tds_deduction' => 500.00,
                'admin_processing_fee' => 0.00,
                'net_payable_amount' => 9500.00,
                'payment_method' => 'UPI Instant Payout',
                'bank_name' => 'Kotak Mahindra Bank',
                'account_number' => '4812903847',
                'ifsc_code' => 'KKBK0000214',
                'account_holder_name' => 'Deepak Joshi',
                'upi_id' => 'deepakjoshi@kotak',
                'pan_number' => 'ERTDJ3344L',
                'kyc_status' => 'verified',
                'status' => 'completed',
                'request_date' => now()->subDays(4),
                'processed_date' => now()->subDays(4)->addHours(1),
                'utr_number' => 'UPI-9923847561',
                'admin_notes' => 'Settled via UPI Instant gateway batch.',
                'batch_reference' => 'BATCH-WK-2026-32',
            ],
        ];

        foreach ($samplePayouts as $p) {
            $user = User::where('user_code', $p['user_code'])->first();
            if ($user) {
                $p['user_id'] = $user->id;
            }
            UserPayout::create($p);
        }
    }
}
