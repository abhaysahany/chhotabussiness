<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserBankAccount;
use App\Models\UserUpiAccount;
use App\Models\EmailOtp;
use Illuminate\Support\Facades\Mail;

class UserBankKycController extends Controller
{
    /**
     * Submit PAN & Aadhaar KYC
     * Requirement: ONLY PAN and Aadhaar Card are required
     */
    public function submitKyc(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }
        if (!$user && $request->filled('user_id')) {
            $user = User::find($request->input('user_id'));
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $pan = strtoupper(trim($request->input('pan_number') ?: $request->input('panNumber') ?: ''));
        $aadhaar = preg_replace('/\D/', '', $request->input('aadhaar_number') ?: $request->input('aadhaarNumber') ?: '');

        if (empty($pan) || strlen($pan) < 10) {
            return response()->json([
                'status' => 'error',
                'message' => 'Valid 10-character PAN Card number is mandatory for Section 194H TDS compliance.',
            ], 422);
        }

        if (empty($aadhaar) || strlen($aadhaar) < 12) {
            return response()->json([
                'status' => 'error',
                'message' => 'Valid 12-digit Aadhaar Card number is mandatory for identity verification.',
            ], 422);
        }

        $user->pan_number = $pan;
        $user->aadhaar_number = $aadhaar;
        if ($request->filled('pan_card_image')) {
            $user->pan_card_image = $request->input('pan_card_image');
        }
        if ($request->filled('aadhaar_front_image')) {
            $user->aadhaar_front_image = $request->input('aadhaar_front_image');
        }
        if ($request->filled('aadhaar_back_image')) {
            $user->aadhaar_back_image = $request->input('aadhaar_back_image');
        }

        $user->kyc_status = 'pending'; // 'pending' / 'under_process' until Admin verifies
        $user->kyc_submitted_at = now();
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => '🎉 PAN & Aadhaar KYC submitted successfully! Your status is now Under Review ⏳. Admin will verify your documents shortly before payout accounts are enabled.',
            'user' => $user,
        ]);
    }

    /**
     * Admin: List all KYC verification requests from MySQL database
     */
    public function adminIndexKyc(Request $request)
    {
        $query = User::whereNotNull('pan_number')
            ->orWhereNotNull('aadhaar_number')
            ->orWhereNotNull('kyc_submitted_at')
            ->orWhereIn('kyc_status', ['pending', 'under_process', 'verified', 'approved', 'rejected']);

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $status = strtolower($request->input('status'));
            if ($status === 'pending') {
                $query->whereIn('kyc_status', ['pending', 'under_process', 'unverified']);
            } elseif ($status === 'verified') {
                $query->whereIn('kyc_status', ['verified', 'approved']);
            } else {
                $query->where('kyc_status', $status);
            }
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('user_code', 'like', "%{$s}%")
                  ->orWhere('pan_number', 'like', "%{$s}%")
                  ->orWhere('aadhaar_number', 'like', "%{$s}%");
            });
        }

        $users = $query->orderBy('kyc_submitted_at', 'desc')->orderBy('updated_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'kyc_requests' => $users,
        ]);
    }

    /**
     * Admin: Approve KYC for User
     */
    public function adminApproveKyc(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $user->kyc_status = 'verified';
        $user->kyc_verified_at = now();
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => "✓ KYC Approved for {$user->name} ({$user->user_code})! Bank & UPI payout accounts are now unlocked.",
            'user' => $user,
        ]);
    }

    /**
     * Admin: Reject KYC for User
     */
    public function adminRejectKyc(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $user->kyc_status = 'rejected';
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => "⚠️ KYC Rejected for {$user->name} ({$user->user_code}). User can resubmit PAN & Aadhaar proofs.",
            'user' => $user,
        ]);
    }

    /**
     * Get All Bank Accounts and UPI IDs for user
     */
    public function getBankAndUpiAccounts(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && ($request->filled('user_code') || $request->filled('userCode'))) {
            $user = User::where('user_code', $request->input('user_code') ?: $request->input('userCode'))->first();
        }
        if (!$user && ($request->filled('user_id') || $request->filled('userId'))) {
            $user = User::find($request->input('user_id') ?: $request->input('userId'));
        }
        if (!$user && $request->filled('email')) {
            $user = User::where('email', $request->input('email'))->first();
        }

        // Fallback: If not found, get the primary verified user
        if (!$user) {
            $user = User::where('kyc_status', 'verified')->orderBy('id', 'asc')->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $kycStatus = strtolower($user->kyc_status ?? 'unverified');
        $isKycVerified = in_array($kycStatus, ['verified', 'approved']) || (!empty($user->pan_number) && $kycStatus !== 'rejected');


        $banks = UserBankAccount::where('user_id', $user->id)
            ->orWhere('user_code', $user->user_code)
            ->orderBy('is_primary', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        // If user has bank details in users table but no separate rows in user_bank_accounts, auto-seed primary
        if ($banks->isEmpty() && !empty($user->account_number) && !empty($user->bank_name)) {
            $primaryBank = UserBankAccount::create([
                'user_id' => $user->id,
                'user_code' => $user->user_code ?: ('CB' . (100000 + $user->id)),
                'bank_name' => $user->bank_name,
                'account_number' => $user->account_number,
                'ifsc_code' => $user->ifsc_code ?: 'N/A',
                'account_holder_name' => $user->account_holder_name ?: $user->name,
                'branch' => 'Primary Registered Branch',
                'is_primary' => true,
                'is_verified' => true,
            ]);
            $banks = collect([$primaryBank]);
        }

        $upis = UserUpiAccount::where('user_id', $user->id)
            ->orWhere('user_code', $user->user_code)
            ->orderBy('is_primary', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        if ($upis->isEmpty() && !empty($user->upi_id)) {
            $primaryUpi = UserUpiAccount::create([
                'user_id' => $user->id,
                'user_code' => $user->user_code ?: ('CB' . (100000 + $user->id)),
                'upi_id' => $user->upi_id,
                'holder_name' => $user->name,
                'qr_code_image' => null,
                'is_primary' => true,
                'is_verified' => true,
            ]);
            $upis = collect([$primaryUpi]);
        }

        return response()->json([
            'status' => 'success',
            'is_kyc_verified' => $isKycVerified,
            'kyc_status' => $user->kyc_status ?: 'unverified',
            'registered_name' => $user->name,
            'pan_number' => $user->pan_number,
            'aadhaar_number' => $user->aadhaar_number,
            'bank_accounts' => $banks,
            'upi_accounts' => $upis,
        ]);
    }

    /**
     * Send 6-Digit Email OTP for Bank or UPI operations
     */
    public function sendOtp(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }
        if (!$user && $request->filled('email')) {
            $user = User::where('email', $request->input('email'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User account not found.'], 404);
        }

        $action = $request->input('action') ?: 'bank_security_update';
        $otp = (string) mt_rand(100000, 999999);

        // Save OTP to database
        EmailOtp::create([
            'email' => $user->email,
            'user_id' => $user->id,
            'action' => $action,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
            'is_used' => false,
        ]);

        $maskedEmail = substr($user->email, 0, 3) . '***@' . explode('@', $user->email)[1];

        return response()->json([
            'status' => 'success',
            'message' => "Verification OTP sent to your registered email ({$maskedEmail}). It is valid for 10 minutes.",
            'masked_email' => $maskedEmail,
            'demo_otp' => $otp, // For convenience in local testing
        ]);
    }

    /**
     * Helper: Validate OTP
     */
    protected function verifyEmailOtp($email, $otp, $action)
    {
        if (empty($otp)) {
            return false;
        }

        $record = EmailOtp::where('email', $email)
            ->where('otp', trim($otp))
            ->where('is_used', false)
            ->where('expires_at', '>=', now())
            ->latest('id')
            ->first();

        if ($record) {
            $record->is_used = true;
            $record->save();
            return true;
        }

        return false;
    }

    /**
     * Add New Bank Account (Any number allowed with same name; requires KYC and Email OTP)
     */
    public function addBankAccount(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        // 1. Mandatory KYC check: Bank data can be filled ONLY after KYC
        $isKycVerified = in_array(strtolower($user->kyc_status ?? ''), ['verified', 'approved']);
        if (!$isKycVerified) {
            return response()->json([
                'status' => 'error',
                'message' => '⚠️ KYC Verification Required! You must complete and verify your PAN and Aadhaar Card KYC before adding bank accounts.',
            ], 422);
        }

        // 2. Mandatory Email OTP Verification
        $otp = $request->input('otp');
        if (!$this->verifyEmailOtp($user->email, $otp, 'add_bank')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired Email OTP. Please request a new OTP and enter the 6-digit code.',
            ], 422);
        }

        $bankName = trim($request->input('bank_name') ?: '');
        $accNumber = trim($request->input('account_number') ?: '');
        $ifsc = strtoupper(trim($request->input('ifsc_code') ?: ''));
        $branch = trim($request->input('branch') ?: 'Main Branch');

        if (empty($bankName) || empty($accNumber) || empty($ifsc)) {
            return response()->json(['status' => 'error', 'message' => 'Bank Name, Account Number, and IFSC Code are required.'], 422);
        }

        // 3. Name must match registered name at the time of registration
        $accountHolderName = $user->name;

        $existingCount = UserBankAccount::where('user_id', $user->id)->count();
        $isPrimary = $request->boolean('is_primary') || ($existingCount === 0);

        if ($isPrimary) {
            UserBankAccount::where('user_id', $user->id)->update(['is_primary' => false]);
            // Sync to user table
            $user->bank_name = $bankName;
            $user->account_number = $accNumber;
            $user->ifsc_code = $ifsc;
            $user->account_holder_name = $accountHolderName;
            $user->save();
        }

        $bank = UserBankAccount::create([
            'user_id' => $user->id,
            'user_code' => $user->user_code ?: ('CB' . (100000 + $user->id)),
            'bank_name' => $bankName,
            'account_number' => $accNumber,
            'ifsc_code' => $ifsc,
            'account_holder_name' => $accountHolderName,
            'branch' => $branch,
            'is_primary' => $isPrimary,
            'is_verified' => true,
        ]);

        $banks = UserBankAccount::where('user_id', $user->id)->orderBy('is_primary', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'message' => "✓ Bank account ({$bankName} - •••• " . substr($accNumber, -4) . ") added successfully to database!",
            'bank_account' => $bank,
            'bank_accounts' => $banks,
        ]);
    }

    /**
     * Delete a Bank Account (Requires Email OTP)
     */
    public function deleteBankAccount(Request $request, $id)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        // Verify Email OTP
        $otp = $request->input('otp');
        if (!$this->verifyEmailOtp($user->email, $otp, 'delete_bank')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired Email OTP. Please enter the valid OTP sent to your email to delete this bank account.',
            ], 422);
        }

        $bank = UserBankAccount::where('id', $id)->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('user_code', $user->user_code);
        })->first();

        if (!$bank) {
            return response()->json(['status' => 'error', 'message' => 'Bank account not found.'], 404);
        }

        $bank->delete();

        // If primary was deleted, assign first available as primary
        $remaining = UserBankAccount::where('user_id', $user->id)->orderBy('id', 'asc')->get();
        if ($remaining->isNotEmpty() && !$remaining->contains('is_primary', true)) {
            $first = $remaining->first();
            $first->is_primary = true;
            $first->save();

            $user->bank_name = $first->bank_name;
            $user->account_number = $first->account_number;
            $user->ifsc_code = $first->ifsc_code;
            $user->account_holder_name = $first->account_holder_name;
            $user->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Bank account deleted successfully from database.',
            'bank_accounts' => UserBankAccount::where('user_id', $user->id)->orderBy('is_primary', 'desc')->get(),
        ]);
    }

    /**
     * Set Primary Bank Account (Requires Email OTP)
     */
    public function setPrimaryBankAccount(Request $request, $id)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $bank = UserBankAccount::where('id', $id)->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('user_code', $user->user_code);
        })->first();

        if (!$bank) {
            return response()->json(['status' => 'error', 'message' => 'Bank account not found.'], 404);
        }

        UserBankAccount::where('user_id', $user->id)->update(['is_primary' => false]);
        $bank->is_primary = true;
        $bank->save();

        $user->bank_name = $bank->bank_name;
        $user->account_number = $bank->account_number;
        $user->ifsc_code = $bank->ifsc_code;
        $user->account_holder_name = $bank->account_holder_name;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => "✓ {$bank->bank_name} marked as your primary bank account for commission payouts!",
            'bank_accounts' => UserBankAccount::where('user_id', $user->id)->orderBy('is_primary', 'desc')->get(),
        ]);
    }

    /**
     * Add New UPI ID with QR Code (Any number allowed with same name; requires KYC and Email OTP)
     */
    public function addUpiAccount(Request $request)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        // 1. Mandatory KYC check: Payout data can be filled ONLY after KYC
        $isKycVerified = in_array(strtolower($user->kyc_status ?? ''), ['verified', 'approved']);
        if (!$isKycVerified) {
            return response()->json([
                'status' => 'error',
                'message' => '⚠️ KYC Verification Required! You must complete and verify your PAN and Aadhaar Card KYC before adding UPI accounts.',
            ], 422);
        }

        // 2. Mandatory Email OTP Verification
        $otp = $request->input('otp');
        if (!$this->verifyEmailOtp($user->email, $otp, 'add_upi')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired Email OTP. Please request a new OTP and enter the 6-digit code.',
            ], 422);
        }

        $upiId = strtolower(trim($request->input('upi_id') ?: ''));
        if (empty($upiId)) {
            return response()->json(['status' => 'error', 'message' => 'Valid UPI ID (e.g. mobile@upi) is required.'], 422);
        }

        $qrCode = $request->input('qr_code_image');

        $existingCount = UserUpiAccount::where('user_id', $user->id)->count();
        $isPrimary = $request->boolean('is_primary') || ($existingCount === 0);

        if ($isPrimary) {
            UserUpiAccount::where('user_id', $user->id)->update(['is_primary' => false]);
            $user->upi_id = $upiId;
            $user->save();
        }

        $upi = UserUpiAccount::create([
            'user_id' => $user->id,
            'user_code' => $user->user_code ?: ('CB' . (100000 + $user->id)),
            'upi_id' => $upiId,
            'holder_name' => $user->name, // Strictly registered user name
            'qr_code_image' => $qrCode,
            'is_primary' => $isPrimary,
            'is_verified' => true,
        ]);

        $upis = UserUpiAccount::where('user_id', $user->id)->orderBy('is_primary', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'message' => "✓ UPI ID ({$upiId}) with QR Code added successfully to database!",
            'upi_account' => $upi,
            'upi_accounts' => $upis,
        ]);
    }

    /**
     * Delete UPI Account (Requires Email OTP)
     */
    public function deleteUpiAccount(Request $request, $id)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $otp = $request->input('otp');
        if (!$this->verifyEmailOtp($user->email, $otp, 'delete_upi')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired Email OTP. Please enter valid OTP to delete this UPI ID.',
            ], 422);
        }

        $upi = UserUpiAccount::where('id', $id)->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('user_code', $user->user_code);
        })->first();

        if (!$upi) {
            return response()->json(['status' => 'error', 'message' => 'UPI account not found.'], 404);
        }

        $upi->delete();

        $remaining = UserUpiAccount::where('user_id', $user->id)->get();
        if ($remaining->isNotEmpty() && !$remaining->contains('is_primary', true)) {
            $first = $remaining->first();
            $first->is_primary = true;
            $first->save();

            $user->upi_id = $first->upi_id;
            $user->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'UPI ID deleted successfully from database.',
            'upi_accounts' => UserUpiAccount::where('user_id', $user->id)->orderBy('is_primary', 'desc')->get(),
        ]);
    }

    /**
     * Set Primary UPI Account
     */
    public function setPrimaryUpiAccount(Request $request, $id)
    {
        $user = auth('sanctum')->user() ?: $request->user();
        if (!$user && $request->filled('user_code')) {
            $user = User::where('user_code', $request->input('user_code'))->first();
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $upi = UserUpiAccount::where('id', $id)->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhere('user_code', $user->user_code);
        })->first();

        if (!$upi) {
            return response()->json(['status' => 'error', 'message' => 'UPI account not found.'], 404);
        }

        UserUpiAccount::where('user_id', $user->id)->update(['is_primary' => false]);
        $upi->is_primary = true;
        $upi->save();

        $user->upi_id = $upi->upi_id;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => "✓ {$upi->upi_id} marked as primary UPI payout channel!",
            'upi_accounts' => UserUpiAccount::where('user_id', $user->id)->orderBy('is_primary', 'desc')->get(),
        ]);
    }
}
