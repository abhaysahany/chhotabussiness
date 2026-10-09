<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserPayout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserPayoutController extends Controller
{
    /**
     * List all payout records from the database.
     */
    public function index(Request $request)
    {
        $query = UserPayout::query();

        // Status Filter
        if ($request->has('status') && $request->status !== 'all' && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        // Method Filter
        if ($request->has('payment_method') && $request->payment_method !== 'all' && !empty($request->payment_method)) {
            $query->where('payment_method', $request->payment_method);
        }

        // Global Search
        if ($request->has('search') && !empty($request->search)) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('payout_code', 'like', $search)
                  ->orWhere('user_code', 'like', $search)
                  ->orWhere('member_name', 'like', $search)
                  ->orWhere('member_email', 'like', $search)
                  ->orWhere('sponsor', 'like', $search)
                  ->orWhere('utr_number', 'like', $search)
                  ->orWhere('bank_name', 'like', $search)
                  ->orWhere('account_number', 'like', $search)
                  ->orWhere('upi_id', 'like', $search)
                  ->orWhere('pan_number', 'like', $search);
            });
        }

        $payouts = $query->orderBy('request_date', 'desc')->orderBy('id', 'desc')->get();

        // Transform for unified camelCase and snake_case consumption
        $formatted = $payouts->map(function ($p) {
            return [
                'id' => $p->id,
                'payoutCode' => $p->payout_code,
                'payout_code' => $p->payout_code,
                'userId' => $p->user_id,
                'user_id' => $p->user_id,
                'userCode' => $p->user_code,
                'user_code' => $p->user_code,
                'memberName' => $p->member_name,
                'member_name' => $p->member_name,
                'memberEmail' => $p->member_email,
                'member_email' => $p->member_email,
                'memberPhone' => $p->member_phone,
                'member_phone' => $p->member_phone,
                'sponsor' => $p->sponsor,
                'availableCommissionBalance' => (float) $p->wallet_balance_before,
                'wallet_balance_before' => (float) $p->wallet_balance_before,
                'requestedAmount' => (float) $p->requested_amount,
                'requested_amount' => (float) $p->requested_amount,
                'tdsRate' => (float) $p->tds_rate,
                'tds_rate' => (float) $p->tds_rate,
                'tdsDeduction' => (float) $p->tds_deduction,
                'tds_deduction' => (float) $p->tds_deduction,
                'adminProcessingFee' => (float) $p->admin_processing_fee,
                'admin_processing_fee' => (float) $p->admin_processing_fee,
                'netPayableAmount' => (float) $p->net_payable_amount,
                'net_payable_amount' => (float) $p->net_payable_amount,
                'paymentMethod' => $p->payment_method,
                'payment_method' => $p->payment_method,
                'bankDetails' => [
                    'bankName' => $p->bank_name,
                    'accountNumber' => $p->account_number,
                    'ifscCode' => $p->ifsc_code,
                    'accountHolderName' => $p->account_holder_name ?: $p->member_name,
                    'upiId' => $p->upi_id,
                    'panNumber' => $p->pan_number,
                ],
                'kycStatus' => $p->kyc_status,
                'kyc_status' => $p->kyc_status,
                'status' => $p->status,
                'requestDate' => $p->request_date ? $p->request_date->format('Y-m-d H:i:s') : null,
                'request_date' => $p->request_date ? $p->request_date->format('Y-m-d H:i:s') : null,
                'processedDate' => $p->processed_date ? $p->processed_date->format('Y-m-d H:i:s') : null,
                'processed_date' => $p->processed_date ? $p->processed_date->format('Y-m-d H:i:s') : null,
                'utrNumber' => $p->utr_number,
                'utr_number' => $p->utr_number,
                'adminNotes' => $p->admin_notes,
                'admin_notes' => $p->admin_notes,
            ];
        });

        return response()->json([
            'status' => 'success',
            'payouts' => $formatted,
            'total' => $formatted->count(),
        ]);
    }

    /**
     * Generate Weekly Payout Requests Batch from Database:
     * Scans all users where:
     * 1. kyc_status == 'verified'
     * 2. commission_balance >= 500
     * 3. Has bank details or UPI
     * 4. Does not have an existing active 'pending' payout
     */
    public function generateWeeklyBatch(Request $request)
    {
        DB::beginTransaction();
        try {
            // Find all verified users with commission balance >= 500 and bank details
            $eligibleUsers = User::where(function ($q) {
                $q->where('kyc_status', 'verified')
                  ->orWhere('kyc_status', 'Verified');
            })
            ->where('commission_balance', '>=', 500)
            ->where(function ($q) {
                $q->where(function ($sub) {
                    $sub->whereNotNull('account_number')
                        ->where('account_number', '!=', '')
                        ->whereNotNull('ifsc_code')
                        ->where('ifsc_code', '!=', '');
                })->orWhere(function ($sub) {
                    $sub->whereNotNull('upi_id')
                        ->where('upi_id', '!=', '');
                });
            })
            ->get();

            $generatedCount = 0;
            $totalGrossAmount = 0;
            $batchRef = 'BATCH-WK-' . date('Y-W') . '-' . time();

            foreach ($eligibleUsers as $user) {
                // Check if user already has an active pending payout
                $hasPending = UserPayout::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->exists();

                if ($hasPending) {
                    continue;
                }

                $gross = (float) $user->commission_balance;
                if ($gross < 500) {
                    continue;
                }

                // 5% TDS under Section 194H
                $tdsRate = 5.00;
                $tds = round(($gross * $tdsRate) / 100, 2);
                $net = round($gross - $tds, 2);

                $latest = UserPayout::latest('id')->first();
                $nextSeq = $latest ? ($latest->id + 101) : (UserPayout::count() + 101);
                $payoutCode = 'PAY-' . date('Y') . '-' . $nextSeq;

                $paymentMethod = !empty($user->account_number) ? 'IMPS Direct Bank Transfer' : 'UPI Instant Payout';

                UserPayout::create([
                    'payout_code' => $payoutCode,
                    'user_id' => $user->id,
                    'user_code' => $user->user_code ?: ('CB' . (100000 + $user->id)),
                    'member_name' => $user->name,
                    'member_email' => $user->email,
                    'member_phone' => $user->phone,
                    'sponsor' => $user->sponsor_id ?: 'Network Direct',
                    'wallet_balance_before' => $gross,
                    'requested_amount' => $gross,
                    'tds_rate' => $tdsRate,
                    'tds_deduction' => $tds,
                    'admin_processing_fee' => 0,
                    'net_payable_amount' => $net,
                    'payment_method' => $paymentMethod,
                    'bank_name' => $user->bank_name ?: 'Registered Bank',
                    'account_number' => $user->account_number,
                    'ifsc_code' => $user->ifsc_code,
                    'account_holder_name' => $user->account_holder_name ?: $user->name,
                    'upi_id' => $user->upi_id,
                    'pan_number' => $user->pan_number,
                    'kyc_status' => 'verified',
                    'status' => 'pending',
                    'request_date' => now(),
                    'batch_reference' => $batchRef,
                ]);

                // Hold/Deduct user's commission balance while payout request is pending
                $user->commission_balance = 0;
                $user->save();

                $generatedCount++;
                $totalGrossAmount += $gross;
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Successfully generated {$generatedCount} weekly payout requests totaling ₹" . number_format($totalGrossAmount, 2) . " from verified users with balance > ₹500.",
                'generated_count' => $generatedCount,
                'total_gross_amount' => $totalGrossAmount,
                'batch_reference' => $batchRef,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate weekly payouts batch: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Authorize and Disburse Payout Request.
     */
    public function disburse(Request $request, $id)
    {
        $payout = UserPayout::where('id', $id)->orWhere('payout_code', $id)->first();

        if (!$payout) {
            return response()->json(['status' => 'error', 'message' => 'Payout request not found.'], 404);
        }

        $utr = $request->input('utr_number') ?: $request->input('utrNumber');
        if (empty($utr)) {
            $utr = 'UTR-' . date('Ymd') . rand(10000000, 99999999);
        }

        $paymentMethod = $request->input('payment_method') ?: $request->input('paymentMethod') ?: $payout->payment_method;
        $adminNotes = $request->input('admin_notes') ?: $request->input('adminNotes') ?: 'Direct bank transfer settlement disbursed by Finance Admin.';

        $payout->update([
            'status' => 'completed',
            'utr_number' => $utr,
            'payment_method' => $paymentMethod,
            'admin_notes' => $adminNotes,
            'processed_date' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Payout {$payout->payout_code} of ₹{$payout->net_payable_amount} successfully disbursed to {$payout->member_name} (UTR: {$utr})!",
            'payout' => $payout,
        ]);
    }

    /**
     * Reject Payout Request and refund funds back to user wallet.
     */
    public function reject(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $payout = UserPayout::where('id', $id)->orWhere('payout_code', $id)->first();

            if (!$payout) {
                return response()->json(['status' => 'error', 'message' => 'Payout request not found.'], 404);
            }

            $reason = $request->input('reason') ?: $request->input('admin_notes') ?: $request->input('adminNotes') ?: 'KYC or Bank account details invalid. Payout rejected.';

            // Refund gross requested amount back to user's commission balance if previously pending
            if ($payout->status === 'pending' && $payout->user_id) {
                $user = User::find($payout->user_id);
                if ($user) {
                    $user->commission_balance = round($user->commission_balance + $payout->requested_amount, 2);
                    $user->save();
                }
            }

            $payout->update([
                'status' => 'rejected',
                'admin_notes' => $reason,
                'processed_date' => now(),
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Payout {$payout->payout_code} rejected and gross amount of ₹{$payout->requested_amount} refunded to member wallet.",
                'payout' => $payout,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reject payout: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Payouts intelligence statistics & report data.
     */
    public function stats()
    {
        $completed = UserPayout::where('status', 'completed')->get();
        $pending = UserPayout::where('status', 'pending')->get();

        $lifetimeGross = (float) $completed->sum('requested_amount');
        $lifetimeNet = (float) $completed->sum('net_payable_amount');
        $lifetimeTds = (float) $completed->sum('tds_deduction');
        $avgPayout = $completed->count() > 0 ? round($lifetimeGross / $completed->count(), 2) : 0;

        $pendingGross = (float) $pending->sum('requested_amount');
        $pendingNet = (float) $pending->sum('net_payable_amount');
        $pendingTds = (float) $pending->sum('tds_deduction');

        return response()->json([
            'status' => 'success',
            'stats' => [
                'lifetime_net_disbursed' => $lifetimeNet,
                'lifetime_tds_collected' => $lifetimeTds,
                'lifetime_gross' => $lifetimeGross,
                'average_payout' => $avgPayout,
                'completed_count' => $completed->count(),
                'pending_count' => $pending->count(),
                'pending_gross' => $pendingGross,
                'pending_net' => $pendingNet,
                'pending_tds' => $pendingTds,
            ],
        ]);
    }

    /**
     * Auto-seed default user payouts if table is empty
     */
    private function ensureDefaultSeed()
    {
        if (UserPayout::count() === 0) {
            $defaultPayouts = [
                [
                    'payout_code' => 'PO-9821',
                    'user_code' => 'CB100001',
                    'member_name' => 'Rahul Verma',
                    'member_email' => 'rahul.verma@example.com',
                    'member_phone' => '+91 98765 43210',
                    'sponsor' => 'Vikram Singh (#1001)',
                    'wallet_balance_before' => 35000,
                    'requested_amount' => 15000,
                    'tds_rate' => 5.0,
                    'tds_deduction' => 750,
                    'admin_processing_fee' => 0,
                    'net_payable_amount' => 14250,
                    'payment_method' => 'bank_transfer',
                    'bank_name' => 'State Bank of India',
                    'account_number' => '•••• 5678',
                    'ifsc_code' => 'SBIN0001234',
                    'account_holder_name' => 'Rahul Verma',
                    'upi_id' => 'rahul.verma@okaxis',
                    'pan_number' => 'ABCDE1234F',
                    'kyc_status' => 'verified',
                    'status' => 'completed',
                    'request_date' => '2026-08-10 11:30:00',
                    'processed_date' => '2026-08-11 15:45:00',
                    'utr_number' => 'UTR-982341901',
                    'admin_notes' => 'Direct NEFT Disbursal Verified',
                ],
                [
                    'payout_code' => 'PO-9822',
                    'user_code' => 'CB100001',
                    'member_name' => 'Rahul Verma',
                    'member_email' => 'rahul.verma@example.com',
                    'member_phone' => '+91 98765 43210',
                    'sponsor' => 'Vikram Singh (#1001)',
                    'wallet_balance_before' => 20000,
                    'requested_amount' => 12000,
                    'tds_rate' => 5.0,
                    'tds_deduction' => 600,
                    'admin_processing_fee' => 0,
                    'net_payable_amount' => 11400,
                    'payment_method' => 'upi',
                    'bank_name' => 'State Bank of India',
                    'account_number' => '•••• 5678',
                    'ifsc_code' => 'SBIN0001234',
                    'account_holder_name' => 'Rahul Verma',
                    'upi_id' => 'rahul.verma@okaxis',
                    'pan_number' => 'ABCDE1234F',
                    'kyc_status' => 'verified',
                    'status' => 'completed',
                    'request_date' => '2026-07-25 09:15:00',
                    'processed_date' => '2026-07-26 14:20:00',
                    'utr_number' => 'UTR-872134012',
                    'admin_notes' => 'Instant UPI settlement done',
                ],
                [
                    'payout_code' => 'PO-9823',
                    'user_code' => 'CB100001',
                    'member_name' => 'Rahul Verma',
                    'member_email' => 'rahul.verma@example.com',
                    'member_phone' => '+91 98765 43210',
                    'sponsor' => 'Vikram Singh (#1001)',
                    'wallet_balance_before' => 18000,
                    'requested_amount' => 8500,
                    'tds_rate' => 5.0,
                    'tds_deduction' => 425,
                    'admin_processing_fee' => 0,
                    'net_payable_amount' => 8075,
                    'payment_method' => 'bank_transfer',
                    'bank_name' => 'HDFC Bank',
                    'account_number' => '•••• 9012',
                    'ifsc_code' => 'HDFC0004321',
                    'account_holder_name' => 'Rahul Verma',
                    'upi_id' => 'rahul.verma@okhdfcbank',
                    'pan_number' => 'ABCDE1234F',
                    'kyc_status' => 'verified',
                    'status' => 'completed',
                    'request_date' => '2026-07-10 16:40:00',
                    'processed_date' => '2026-07-11 11:10:00',
                    'utr_number' => 'UTR-761209341',
                    'admin_notes' => 'IMPS Batch Clearance',
                ],
                [
                    'payout_code' => 'PO-9824',
                    'user_code' => 'CB100001',
                    'member_name' => 'Rahul Verma',
                    'member_email' => 'rahul.verma@example.com',
                    'member_phone' => '+91 98765 43210',
                    'sponsor' => 'Vikram Singh (#1001)',
                    'wallet_balance_before' => 24500,
                    'requested_amount' => 5000,
                    'tds_rate' => 5.0,
                    'tds_deduction' => 250,
                    'admin_processing_fee' => 0,
                    'net_payable_amount' => 4750,
                    'payment_method' => 'upi',
                    'bank_name' => 'State Bank of India',
                    'account_number' => '•••• 5678',
                    'ifsc_code' => 'SBIN0001234',
                    'account_holder_name' => 'Rahul Verma',
                    'upi_id' => 'rahul.verma@okaxis',
                    'pan_number' => 'ABCDE1234F',
                    'kyc_status' => 'verified',
                    'status' => 'pending',
                    'request_date' => '2026-08-19 18:20:00',
                    'admin_notes' => 'Scheduled for weekly Tuesday payout cycle',
                ],
            ];

            foreach ($defaultPayouts as $dp) {
                UserPayout::create($dp);
            }
        }
    }

    /**
     * User: List payout history for authenticated user with date filters and statistics
     */
    public function getUserPayouts(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        $userCode = $request->input('user_code') ?: $user?->user_code;
        $userId = $user?->id ?: $request->input('user_id');

        if (!$user && ($userCode || $userId)) {
            $user = User::where(function ($q) use ($userCode, $userId) {
                if ($userCode) $q->where('user_code', $userCode);
                if ($userId) $q->orWhere('id', $userId);
            })->first();
        }

        $query = UserPayout::query();
        if ($user) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('user_code', $user->user_code);
            });
        } elseif ($userCode) {
            $query->where('user_code', $userCode);
        }

        // Status Filter
        if ($request->filled('status') && $request->input('status') !== 'all' && $request->input('status') !== 'All') {
            $query->where('status', strtolower($request->input('status')));
        }

        // Date Presets & Custom Date Range Filters
        if ($request->filled('date_preset')) {
            $preset = $request->input('date_preset');
            if ($preset === 'today') {
                $query->whereDate('request_date', now()->toDateString());
            } elseif ($preset === 'week') {
                $query->whereBetween('request_date', [now()->startOfWeek(), now()->endOfWeek()]);
            } elseif ($preset === 'month') {
                $query->whereBetween('request_date', [now()->startOfMonth(), now()->endOfMonth()]);
            } elseif ($preset === 'last_month') {
                $query->whereBetween('request_date', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()]);
            }
        }

        if ($request->filled('start_date')) {
            $query->whereDate('request_date', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('request_date', '<=', $request->input('end_date'));
        }

        $payouts = $query->orderBy('request_date', 'desc')->orderBy('id', 'desc')->get();

        // Calculate statistics across all user payouts
        $allUserPayoutsQuery = UserPayout::query();
        if ($user) {
            $allUserPayoutsQuery->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('user_code', $user->user_code);
            });
        } elseif ($userCode) {
            $allUserPayoutsQuery->where('user_code', $userCode);
        }
        $allUserPayouts = $allUserPayoutsQuery->get();

        $completedPayouts = $allUserPayouts->where('status', 'completed');
        $pendingPayouts = $allUserPayouts->where('status', 'pending');
        $rejectedPayouts = $allUserPayouts->where('status', 'rejected');

        $totalWithdrawnGross = (float) $completedPayouts->sum('requested_amount');
        $totalWithdrawnNet = (float) $completedPayouts->sum('net_payable_amount');
        $totalTdsDeducted = (float) $completedPayouts->sum('tds_deduction');
        $totalPendingGross = (float) $pendingPayouts->sum('requested_amount');
        $totalPendingNet = (float) $pendingPayouts->sum('net_payable_amount');
        $currentWalletBalance = (float) ($user ? $user->commission_balance : 0);
        $kycStatus = $user ? ($user->kyc_status ?: 'unverified') : 'unverified';
        $isKycVerified = in_array(strtolower($kycStatus), ['verified', 'approved']);

        return response()->json([
            'status' => 'success',
            'payouts' => $payouts,
            'summary' => [
                'availableCommissionBalance' => $currentWalletBalance,
                'totalWithdrawnGross' => $totalWithdrawnGross,
                'totalWithdrawnNet' => $totalWithdrawnNet,
                'totalTdsDeducted' => $totalTdsDeducted,
                'totalPendingAmount' => $totalPendingGross,
                'expectedPayoutAmount' => $totalPendingNet,
                'completedCount' => $completedPayouts->count(),
                'pendingCount' => $pendingPayouts->count(),
                'rejectedCount' => $rejectedPayouts->count(),
                'totalCount' => $allUserPayouts->count(),
                'kycStatus' => $kycStatus,
                'isKycVerified' => $isKycVerified,
                'user' => $user ? [
                    'id' => $user->id,
                    'user_code' => $user->user_code,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'commission_balance' => (float) $user->commission_balance,
                    'kyc_status' => $user->kyc_status,
                    'pan_number' => $user->pan_number,
                    'bank_name' => $user->bank_name,
                    'account_number' => $user->account_number,
                    'ifsc_code' => $user->ifsc_code,
                    'account_holder_name' => $user->account_holder_name,
                    'upi_id' => $user->upi_id,
                ] : null,
            ],
        ]);
    }

    /**
     * User: Submit a new withdrawal request from available balance
     * Rules:
     * 1. Minimum gross amount: ₹500 before any statutory TDS deduction
     * 2. KYC must be verified ('verified' / 'approved')
     * 3. Amount <= available commission balance
     * 4. Deduct gross amount from commission balance and create pending payout record in MySQL database
     */
    public function requestWithdrawal(Request $request)
    {
        $all = $request->all() ?: [];
        $rawBody = file_get_contents('php://input');
        if (!empty($rawBody)) {
            $parsed = json_decode($rawBody, true);
            if (is_array($parsed)) {
                $all = array_merge($all, $parsed);
            }
        }

        $rawAmount = $request->input('requested_amount') 
            ?? $request->input('requestedAmount') 
            ?? $request->input('amount') 
            ?? ($all['requested_amount'] ?? null)
            ?? ($all['requestedAmount'] ?? null)
            ?? ($all['amount'] ?? null);


        if ($rawAmount === null || $rawAmount === '' || !is_numeric($rawAmount)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Valid withdrawal amount is required.',
            ], 422);
        }

        $amount = (float) $rawAmount;

        // Minimum ₹500 calculated on GROSS before any deduction
        if ($amount < 500) {
            return response()->json([
                'status' => 'error',
                'message' => 'Minimum withdrawal amount is ₹500 before any deduction. Please enter ₹500 or more.',
            ], 422);
        }


        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && (!empty($all['user_code']) || !empty($all['userCode']))) {
            $code = $all['user_code'] ?? $all['userCode'];
            $user = User::where('user_code', $code)->first();
        }
        if (!$user && (!empty($all['user_id']) || !empty($all['userId']))) {
            $uid = $all['user_id'] ?? $all['userId'];
            $user = User::find($uid);
        }
        if (!$user && !empty($all['email'])) {
            $user = User::where('email', $all['email'])->first();
        }

        // Fallback: If in session or first active user
        if (!$user) {
            $user = User::where('kyc_status', 'verified')->orderBy('id', 'asc')->first();
        }

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User account not found in database.',
            ], 404);
        }

        // KYC Verification Check
        $kycStatus = strtolower($user->kyc_status ?? 'unverified');
        if ($kycStatus !== 'verified' && $kycStatus !== 'approved') {
            return response()->json([
                'status' => 'error',
                'message' => '⚠️ KYC Verification Required! You must have a verified KYC profile (PAN and Bank Details) before requesting commission withdrawals. Please complete KYC verification first.',
                'kyc_status' => $user->kyc_status ?? 'unverified',
                'requires_kyc' => true,
            ], 422);
        }

        // Commission Balance Check
        $availableBalance = (float) $user->commission_balance;
        if ($amount > $availableBalance) {
            return response()->json([
                'status' => 'error',
                'message' => "Insufficient commission wallet balance! You requested ₹" . number_format($amount, 2) . ", but your available balance is ₹" . number_format($availableBalance, 2) . ".",
                'available_balance' => $availableBalance,
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Deduct requested amount from user's commission balance in database
            $walletBefore = $availableBalance;
            $walletAfter = round(max(0, $availableBalance - $amount), 2);
            $user->commission_balance = $walletAfter;
            $user->save();

            // Calculate 5% statutory TDS (Section 194H) on gross amount
            $tdsRate = 5.0;
            $tdsAmount = round(($amount * $tdsRate) / 100, 2);
            $netPayable = round($amount - $tdsAmount, 2);

            $latest = UserPayout::latest('id')->first();
            $nextSeq = $latest ? ($latest->id + 101) : (UserPayout::count() + 101);
            $payoutCode = 'PAY-' . date('Y') . '-' . $nextSeq;

            $paymentMethod = $all['payment_method'] ?? $all['paymentMethod'] ?? $request->input('payment_method') ?? $request->input('paymentMethod') ?? '';
            $upiId = $all['upi_id'] ?? $all['upiId'] ?? $request->input('upi_id') ?? $request->input('upiId') ?? ($user->upi_id ?? null);
            $bankNameInput = $all['bank_name'] ?? $all['bankName'] ?? $request->input('bank_name') ?? $request->input('bankName');
            $accountNumberInput = $all['account_number'] ?? $all['accountNumber'] ?? $request->input('account_number') ?? $request->input('accountNumber');

            $isUpi = (
                $paymentMethod === 'UPI Instant Payout' ||
                $paymentMethod === 'UPI' ||
                $paymentMethod === 'upi' ||
                (!empty($upiId) && empty($bankNameInput) && empty($accountNumberInput))
            );

            $bankName = $isUpi ? null : ($bankNameInput ?: ($user->bank_name ?: 'Primary Bank'));
            $accountNumber = $isUpi ? null : ($accountNumberInput ?: ($user->account_number ?: '•••• N/A'));
            $ifscCode = $isUpi ? null : ($all['ifsc_code'] ?? $all['ifscCode'] ?? $request->input('ifsc_code') ?? ($user->ifsc_code ?: 'N/A'));
            $holderName = $all['account_holder_name'] ?? $all['accountHolderName'] ?? $request->input('account_holder_name') ?? $user->name;

            $payout = UserPayout::create([
                'payout_code' => $payoutCode,
                'user_id' => $user->id,
                'user_code' => $user->user_code ?: ('CB' . (100000 + $user->id)),
                'member_name' => $user->name,
                'member_email' => $user->email,
                'member_phone' => $all['phone'] ?? $request->input('phone') ?? ($user->phone ?? ''),
                'sponsor' => $user->sponsor_id ?: 'Direct',
                'wallet_balance_before' => $walletBefore,
                'requested_amount' => $amount,
                'tds_rate' => $tdsRate,
                'tds_deduction' => $tdsAmount,
                'admin_processing_fee' => 0,
                'net_payable_amount' => $netPayable,
                'payment_method' => $isUpi ? 'UPI Instant Payout' : 'IMPS Bank Transfer',
                'bank_name' => $bankName,
                'account_number' => $accountNumber,
                'ifsc_code' => $ifscCode,
                'account_holder_name' => $holderName,
                'upi_id' => $isUpi ? $upiId : null,
                'pan_number' => $user->pan_number ?: 'N/A',
                'kyc_status' => $user->kyc_status ?? 'verified',
                'status' => 'pending',
                'request_date' => now(),
                'admin_notes' => $isUpi ? ("User requested payout to UPI: " . $upiId) : ("User requested payout to Bank: " . $bankName),
            ]);


            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "🎉 Withdrawal request of ₹" . number_format($amount, 2) . " (Net: ₹" . number_format($netPayable, 2) . " after 5% TDS) submitted successfully to database! Reference: {$payoutCode}",
                'payout' => [
                    'id' => $payout->id,
                    'payout_code' => $payout->payout_code,
                    'payoutCode' => $payout->payout_code,
                    'user_code' => $payout->user_code,
                    'member_name' => $payout->member_name,
                    'requested_amount' => (float) $payout->requested_amount,
                    'requestedAmount' => (float) $payout->requested_amount,
                    'tds_deduction' => (float) $payout->tds_deduction,
                    'tdsDeduction' => (float) $payout->tds_deduction,
                    'net_payable_amount' => (float) $payout->net_payable_amount,
                    'netPayableAmount' => (float) $payout->net_payable_amount,
                    'payment_method' => $payout->payment_method,
                    'status' => $payout->status,
                    'request_date' => $payout->request_date ? $payout->request_date->format('Y-m-d H:i:s') : now()->toDateTimeString(),
                    'bankDetails' => [
                        'bankName' => $payout->bank_name,
                        'accountNumber' => $payout->account_number,
                        'upiId' => $payout->upi_id,
                    ],
                ],
                'remaining_commission_balance' => $walletAfter,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process withdrawal request: ' . $e->getMessage(),
            ], 500);
        }
    }

}
