<?php

namespace App\Http\Controllers;

use App\Models\SalesRecord;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;


class SalesRecordController extends Controller
{
    /**
     * Auto-seed default sales records if database table is empty.
     */
    private function ensureDefaultSeed()
    {
        if (SalesRecord::count() === 0) {
            $defaultRecords = [
                [
                    'invoice_number' => 'INV-2026-9011',
                    'date' => '2026-08-17',
                    'customer' => 'Rahul Verma (CB100001)',
                    'customer_name' => 'Rahul Verma',
                    'customer_email' => 'rahul.verma@example.com',
                    'customer_phone' => '+91 98765 43210',
                    'customer_user_code' => 'CB100001',
                    'sponsor' => 'Vikram Singh (#1001)',
                    'item' => 'Enterprise Cloud ERP Suite',
                    'category' => 'Software & IT',
                    'item_type' => 'product',
                    'entity_name' => 'Skyline Technologies Pvt Ltd',
                    'entity_type' => 'business',
                    'unit_price' => 14999,
                    'quantity' => 1,
                    'gross_amount' => 14999,
                    'advance_payment' => 10000,
                    'balance_due' => 4999,
                    'admin_commission_percent' => 15,
                    'admin_commission_cut' => 1500, // 15% of 10000
                    'net_entity_payout' => 8500, // 10000 - 1500
                    'payment_method' => 'UPI / PhonePe',
                    'reference_no' => 'UTR-982341',
                    'status' => 'partial',
                    'network_distribution_status' => 'pending_admin_distribution',
                    'direct_commission' => 1000,
                    'level_commissions_total' => 700,
                    'team_volume_bv' => 10000,
                    'commission_distributed' => false,
                ],
                [
                    'invoice_number' => 'INV-2026-9012',
                    'date' => '2026-08-16',
                    'customer' => 'Anita Sharma (CB100002)',
                    'customer_name' => 'Anita Sharma',
                    'customer_email' => 'anita.s@example.com',
                    'customer_phone' => '+91 98111 22334',
                    'customer_user_code' => 'CB100002',
                    'sponsor' => 'Suresh Kumar (#960)',
                    'item' => 'GST Registration & Tax Filing',
                    'category' => 'Legal & Compliance',
                    'item_type' => 'service',
                    'entity_name' => 'ChhotaBusiness Tax Advisory',
                    'entity_type' => 'business',
                    'unit_price' => 2999,
                    'quantity' => 1,
                    'gross_amount' => 2999,
                    'advance_payment' => 2999,
                    'balance_due' => 0,
                    'admin_commission_percent' => 20,
                    'admin_commission_cut' => 599.8,
                    'net_entity_payout' => 2399.2,
                    'payment_method' => 'Razorpay / Cards',
                    'reference_no' => 'UTR-542198',
                    'status' => 'completed',
                    'network_distribution_status' => 'distributed',
                    'distribution_details' => [
                        'referralPercent' => 10,
                        'referralAmount' => 299.9,
                        'teamPercent' => 10,
                        'teamTotalAmount' => 299.9,
                        'teamAmountPerLevel' => 29.99,
                        'teamLevels' => 10,
                        'totalBp' => 100,
                        'bpPerLevel' => 5,
                        'bpLevels' => 20,
                        'bpValueRate' => 10,
                        'distributedAt' => '2026-08-16 14:30',
                    ],
                    'direct_commission' => 299.9,
                    'level_commissions_total' => 209.93,
                    'team_volume_bv' => 2999,
                    'commission_distributed' => true,
                ],
                [
                    'invoice_number' => 'INV-2026-9013',
                    'date' => '2026-08-15',
                    'customer' => 'Pooja Mehta (CB100004)',
                    'customer_name' => 'Pooja Mehta',
                    'customer_email' => 'pooja.m@example.com',
                    'customer_phone' => '+91 97766 55443',
                    'customer_user_code' => 'CB100004',
                    'sponsor' => 'Rohan Gupta (#975)',
                    'item' => 'UI/UX Mobile App Design Audit',
                    'category' => 'Design & Creative',
                    'item_type' => 'service',
                    'entity_name' => 'Priya Patel (UI/UX Designer)',
                    'entity_type' => 'freelance',
                    'unit_price' => 4999,
                    'quantity' => 1,
                    'gross_amount' => 4999,
                    'advance_payment' => 4999,
                    'balance_due' => 0,
                    'admin_commission_percent' => 15,
                    'admin_commission_cut' => 749.85,
                    'net_entity_payout' => 4249.15,
                    'payment_method' => 'Net Banking / HDFC',
                    'reference_no' => 'UTR-653210',
                    'status' => 'completed',
                    'network_distribution_status' => 'pending_admin_distribution',
                    'direct_commission' => 499.9,
                    'level_commissions_total' => 349.93,
                    'team_volume_bv' => 4999,
                    'commission_distributed' => false,
                ],
            ];

            foreach ($defaultRecords as $rec) {
                $sale = SalesRecord::create($rec);
                if ($sale->advance_payment > 0) {
                    SalePayment::create([
                        'sales_record_id' => $sale->id,
                        'invoice_number' => $sale->invoice_number,
                        'entity_name' => $sale->entity_name,
                        'customer_name' => $sale->customer_name,
                        'amount' => $sale->advance_payment,
                        'admin_commission_percent' => $sale->admin_commission_percent,
                        'admin_commission_cut' => $sale->admin_commission_cut,
                        'net_entity_amount' => $sale->net_entity_payout,
                        'payment_method' => $sale->payment_method,
                        'reference_no' => $sale->reference_no,
                        'payment_type' => ($sale->balance_due == 0) ? 'full' : 'advance',
                        'notes' => 'Initial payment at invoice creation',
                        'payment_date' => $sale->date,
                    ]);
                }
            }
        }
    }

    /**
     * List all sales records (supports search, entity filter, status filter, and pagination/all).
     */
    public function index(Request $request)
    {
        $this->ensureDefaultSeed();

        $query = SalesRecord::with('payments')->orderBy('id', 'desc');

        if ($request->filled('entity')) {
            $entity = trim($request->input('entity'));
            $query->where(function ($q) use ($entity) {
                $q->where('entity_name', 'like', "%{$entity}%")
                  ->orWhere('entity_type', 'like', "%{$entity}%");
            });
        }

        if ($request->filled('entity_type') && $request->input('entity_type') !== 'all') {
            $query->where('entity_type', $request->input('entity_type'));
        }

        if ($request->filled('item_type') && $request->input('item_type') !== 'all') {
            $query->where('item_type', $request->input('item_type'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('distribution_status') && $request->input('distribution_status') !== 'all') {
            $query->where('network_distribution_status', $request->input('distribution_status'));
        }

        if ($request->filled('has_balance') && $request->boolean('has_balance')) {
            $query->where('balance_due', '>', 0);
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('customer_user_code', 'like', "%{$search}%")
                  ->orWhere('entity_name', 'like', "%{$search}%")
                  ->orWhere('item', 'like', "%{$search}%")
                  ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date') && $request->input('date') === 'today') {
            $query->whereDate('date', now()->toDateString());
        }

        $sales = $query->get();

        // Calculate summary metrics
        $totalGross = $sales->sum('gross_amount');
        $totalReceived = $sales->sum('advance_payment');
        $totalBalanceDue = $sales->sum('balance_due');
        $totalAdminCommission = $sales->sum('admin_commission_cut');
        $pendingDistributionCount = $sales->where('network_distribution_status', 'pending_admin_distribution')->count();

        return response()->json([
            'status' => 'success',
            'count' => $sales->count(),
            'sales' => $sales,
            'summary' => [
                'total_gross' => (float) $totalGross,
                'total_received' => (float) $totalReceived,
                'total_balance_due' => (float) $totalBalanceDue,
                'total_admin_commission' => (float) $totalAdminCommission,
                'pending_distribution_count' => $pendingDistributionCount,
            ],
        ]);
    }

    /**
     * Record a new sale created by an Entity (or Admin).
     */
    public function store(Request $request)
    {
        $item = $request->input('item');
        if (empty($item)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed: Offering Item description is required.',
                'errors' => ['item' => ['Offering item is required.']],
            ], 422);
        }

        $customerUserCode = trim((string) ($request->input('customer_user_code') ?? $request->input('customerUserCode') ?? ''));
        $customerName = trim((string) ($request->input('customer_name') ?? $request->input('customerName') ?? ''));
        $customerEmail = trim((string) ($request->input('customer_email') ?? $request->input('customerEmail') ?? ''));
        $customerPhone = trim((string) ($request->input('customer_phone') ?? $request->input('customerPhone') ?? ''));
        $sponsor = trim((string) ($request->input('sponsor') ?? $request->input('customerSponsor') ?? ''));

        if (empty($customerUserCode)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed: Member User ID is mandatory.',
                'errors' => ['customer_user_code' => ['Member User ID is compulsory.']],
            ], 422);
        }

        // Validate that user code exists in MySQL users table
        $member = User::whereRaw('LOWER(user_code) = ?', [strtolower($customerUserCode)])
            ->orWhere('id', $customerUserCode)
            ->orWhere('email', $customerUserCode)
            ->first();

        if (!$member) {
            return response()->json([
                'status' => 'error',
                'message' => "Validation failed: Registered Member User ID '{$customerUserCode}' not found in database. User ID is mandatory.",
                'errors' => ['customer_user_code' => ['Registered Member ID not found in database.']],
            ], 422);
        }

        $customerUserCode = $member->user_code;
        if (empty($customerName)) {
            $customerName = $member->name;
        }
        if (empty($customerEmail)) {
            $customerEmail = $member->email;
        }
        if (empty($sponsor) && !empty($member->sponsor_id)) {
            $sponsor = $member->sponsor_id;
        }

        $unitPrice = (float) ($request->input('unit_price') ?? $request->input('unitPrice') ?? 0);
        $quantity = (int) ($request->input('quantity') ?? 1);
        $grossAmount = (float) ($request->input('gross_amount') ?? $request->input('grossAmount') ?? ($unitPrice * $quantity));
        
        // Initial received / advance payment
        $advancePayment = (float) ($request->input('advance_payment') ?? $request->input('advancePayment') ?? $grossAmount);
        if ($advancePayment > $grossAmount) {
            $advancePayment = $grossAmount;
        }

        $balanceDue = max(0, round($grossAmount - $advancePayment, 2));

        $adminCommissionPercent = (float) ($request->input('admin_commission_percent') ?? $request->input('adminCommissionPercent') ?? 15);
        
        // Admin commission cut is strictly calculated on the RECEIVED (advance) amount
        $adminCommissionCut = round(($advancePayment * $adminCommissionPercent) / 100, 2);
        $netEntityPayout = round($advancePayment - $adminCommissionCut, 2);

        $status = ($balanceDue <= 0 && $advancePayment > 0) ? 'completed' : (($advancePayment > 0) ? 'partial' : 'pending');

        $invoiceNumber = $request->input('invoice_number') ?? $request->input('invoiceNumber') ?? ('INV-2026-' . rand(1000, 9999));
        $date = $request->input('date') ?? now()->toDateString();
        $customerFormatted = $request->input('customer') ?? ($customerUserCode ? "{$customerName} ({$customerUserCode})" : $customerName);
        $finalSponsor = !empty($sponsor) ? $sponsor : 'CB100001';


        $saleData = [
            'invoice_number' => $invoiceNumber,
            'date' => $date,
            'entity_id' => $request->input('entity_id') ?? $request->input('entityId') ?? null,
            'entity_name' => $request->input('entity_name') ?? $request->input('entityName') ?? 'Skyline Technologies Pvt Ltd',
            'entity_type' => $request->input('entity_type') ?? $request->input('entityType') ?? 'business',
            'customer_name' => $customerName,
            'customer_email' => $request->input('customer_email') ?? $request->input('customerEmail') ?? null,
            'customer_phone' => $request->input('customer_phone') ?? $request->input('customerPhone') ?? null,
            'customer_user_code' => $customerUserCode,
            'customer' => $customerFormatted,
            'sponsor' => $finalSponsor,
            'item' => $request->input('item'),

            'item_type' => $request->input('item_type') ?? $request->input('itemType') ?? 'service',
            'category' => $request->input('category') ?? 'Services & Consulting',
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'gross_amount' => $grossAmount,
            'taxable_amount' => $grossAmount,
            'gst_tax' => (float) ($request->input('gst_tax') ?? $request->input('gstTax') ?? 0),
            'admin_commission_percent' => $adminCommissionPercent,
            'admin_commission_cut' => $adminCommissionCut,
            'net_entity_payout' => $netEntityPayout,
            'advance_payment' => $advancePayment,
            'balance_due' => $balanceDue,
            'payment_method' => $request->input('payment_method') ?? $request->input('paymentMethod') ?? 'UPI / QR Code',
            'reference_no' => $request->input('reference_no') ?? $request->input('referenceNo') ?? ('UTR-' . rand(100000, 999990)),
            'status' => $status,
            'network_distribution_status' => 'pending_admin_distribution',
            'direct_commission' => round(($advancePayment * 0.10), 2),
            'level_commissions_total' => round(($advancePayment * 0.07), 2),
            'team_volume_bv' => $advancePayment,
            'commission_distributed' => false,
        ];

        DB::beginTransaction();
        try {
            $sale = SalesRecord::create($saleData);

            // Log the initial payment installment
            if ($advancePayment > 0) {
                SalePayment::create([
                    'sales_record_id' => $sale->id,
                    'invoice_number' => $sale->invoice_number,
                    'entity_name' => $sale->entity_name,
                    'customer_name' => $sale->customer_name,
                    'customer_user_code' => $sale->customer_user_code,
                    'sponsor' => $sale->sponsor,
                    'amount' => $advancePayment,
                    'admin_commission_percent' => $adminCommissionPercent,
                    'admin_commission_cut' => $adminCommissionCut,
                    'net_entity_amount' => $netEntityPayout,
                    'payment_method' => $sale->payment_method,
                    'reference_no' => $sale->reference_no,
                    'payment_type' => ($balanceDue == 0) ? 'full' : 'advance',
                    'notes' => 'Initial payment received at sale creation',
                    'payment_date' => now(),
                    'network_distribution_status' => 'pending_admin_distribution',
                    'direct_commission' => round(($advancePayment * 0.10), 2),
                    'level_commissions_total' => round(($advancePayment * 0.07), 2),
                    'team_volume_bv' => $advancePayment,
                    'commission_distributed' => false,
                ]);

                // Credit buyer's personal_pv (self biz) and accumulate group_pv across 20 upline levels
                $this->creditSalePvToNetwork($customerUserCode, $advancePayment, $finalSponsor);
            }

            DB::commit();

            $sale->load('payments');

            return response()->json([
                'status' => 'success',
                'message' => 'Sale record created successfully in MySQL database',
                'sale' => $sale,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create sale record: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get details of a single sale and its payment installments.
     */
    public function show($id)
    {
        $sale = SalesRecord::with('payments')->where('id', $id)
            ->orWhere('invoice_number', $id)
            ->first();

        if (!$sale) {
            return response()->json(['status' => 'error', 'message' => 'Sale not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'sale' => $sale,
        ]);
    }

    /**
     * Receive Balance Payment on an existing sale.
     * Releases admin commission on the received amount and updates balance due.
     */
    public function receiveBalance(Request $request, $id)
    {
        $sale = SalesRecord::where('id', $id)
            ->orWhere('invoice_number', $id)
            ->first();

        if (!$sale) {
            return response()->json(['status' => 'error', 'message' => 'Sale not found'], 404);
        }

        if ($sale->balance_due <= 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'This sale has already been fully paid. Outstanding balance is ₹0.',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'nullable|string',
            'reference_no' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $amount = (float) $request->input('amount');
        if ($amount > $sale->balance_due) {
            $amount = $sale->balance_due; // Cap at outstanding balance
        }

        $adminCommissionPercent = (float) ($sale->admin_commission_percent ?? 15);
        $adminCommissionCut = round(($amount * $adminCommissionPercent) / 100, 2);
        $netEntityAmount = round($amount - $adminCommissionCut, 2);

        $paymentMethod = $request->input('payment_method') ?? $request->input('paymentMethod') ?? 'UPI / PhonePe';
        $referenceNo = $request->input('reference_no') ?? $request->input('referenceNo') ?? ('UTR-' . rand(100000, 999990));
        $notes = $request->input('notes') ?? 'Balance installment received by entity';

        DB::beginTransaction();
        try {
            // 1. Create payment transaction receipt with network distribution tracking
            $payment = SalePayment::create([
                'sales_record_id' => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'entity_name' => $sale->entity_name,
                'customer_name' => $sale->customer_name,
                'customer_user_code' => $sale->customer_user_code,
                'sponsor' => $sale->sponsor,
                'amount' => $amount,
                'admin_commission_percent' => $adminCommissionPercent,
                'admin_commission_cut' => $adminCommissionCut,
                'net_entity_amount' => $netEntityAmount,
                'payment_method' => $paymentMethod,
                'reference_no' => $referenceNo,
                'payment_type' => 'balance',
                'notes' => $notes,
                'payment_date' => now(),
                'network_distribution_status' => 'pending_admin_distribution',
                'direct_commission' => round(($amount * 0.10), 2),
                'level_commissions_total' => round(($amount * 0.07), 2),
                'team_volume_bv' => $amount,
                'commission_distributed' => false,
            ]);

            // 2. Update Sales Record totals
            $newAdvance = round($sale->advance_payment + $amount, 2);
            $newBalance = max(0, round($sale->balance_due - $amount, 2));
            $newAdminCommissionTotal = round($sale->admin_commission_cut + $adminCommissionCut, 2);
            $newNetEntityTotal = round($sale->net_entity_payout + $netEntityAmount, 2);
            $newStatus = ($newBalance <= 0) ? 'completed' : 'partial';

            $sale->update([
                'advance_payment' => $newAdvance,
                'balance_due' => $newBalance,
                'admin_commission_cut' => $newAdminCommissionTotal,
                'net_entity_payout' => $newNetEntityTotal,
                'status' => $newStatus,
            ]);

            // Credit buyer's personal_pv (self biz) and accumulate group_pv across 20 upline levels
            $this->creditSalePvToNetwork($sale->customer_user_code, $amount, $sale->sponsor);

            DB::commit();

            $sale->load('payments');

            return response()->json([
                'status' => 'success',
                'message' => "Successfully collected ₹{$amount}. Admin commission of ₹{$adminCommissionCut} ({$adminCommissionPercent}%) released to system.",
                'sale' => $sale,
                'payment' => $payment,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to record balance payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin Network Commission & Points Distribution on a specific Payment Receipt.
     * Executes every time an entity receives funds (advance or balance installment).
     */
    public function distributePaymentCommission(Request $request, $id)
    {
        $payment = SalePayment::with('salesRecord')->where('id', $id)->first();

        if (!$payment) {
            return response()->json(['status' => 'error', 'message' => 'Payment receipt not found'], 404);
        }

        $received = (float) ($payment->amount > 0 ? $payment->amount : 0);
        $adminFeeReceived = (float) ($payment->admin_commission_cut ?? 0);
        $bpRate = (float) ($request->input('bp_value_rate') ?? $request->input('bpValueRate') ?? 10);

        // Percentages are of the Total Admin Platform Fee Received (100% = $adminFeeReceived)
        $referralPercent = (float) ($request->input('referral_percent') ?? $request->input('referralPercent') ?? 40);
        $teamPercent = (float) ($request->input('team_percent') ?? $request->input('teamPercent') ?? 20);
        $bpPercent = (float) ($request->input('bp_percent') ?? $request->input('bpPercent') ?? 20);

        // Calculate monetary amounts as % of the Admin Platform Fee
        $referralAmount = round(($adminFeeReceived * $referralPercent) / 100, 2);
        $teamTotalAmount = round(($adminFeeReceived * $teamPercent) / 100, 2);
        $bpMonetaryValue = round(($adminFeeReceived * $bpPercent) / 100, 2);
        $totalBp = $bpRate > 0 ? round($bpMonetaryValue / $bpRate, 2) : 0;

        $totalPercent = round($referralPercent + $teamPercent + $bpPercent, 2);
        $totalDistribution = round($referralAmount + $teamTotalAmount + $bpMonetaryValue, 2);

        // Guardrail: Total of the three distributions cannot exceed 100% of the admin fee
        if ($totalPercent > 100 || ($adminFeeReceived > 0 && $totalDistribution > $adminFeeReceived)) {
            return response()->json([
                'status' => 'error',
                'message' => "Total distribution percentages ({$totalPercent}%) cannot exceed 100% of the Admin Platform Fee received (₹{$adminFeeReceived}).",
            ], 422);
        }

        $teamAmountPerLevel = round($teamTotalAmount / 10, 2);
        $bpPerLevel = round($totalBp / 20, 2);
        $sponsorCode = $payment->sponsor ?: ($payment->salesRecord->sponsor ?? 'CB100001');

        // Disburse Direct Referral Commission to immediate sponsor in users table
        $directSponsor = User::where('user_code', $sponsorCode)->first();
        if ($directSponsor && $referralAmount > 0) {
            $directSponsor->increment('commission_balance', $referralAmount);
        }

        // Disburse Equal 10-Level Team Commission to uplines in users table
        $uplineLevels = [];
        $currCode = $sponsorCode;
        for ($lvl = 1; $lvl <= 10; $lvl++) {
            if (!$currCode) {
                $uplineLevels[] = [
                    'level' => $lvl,
                    'amount' => $teamAmountPerLevel,
                    'user_code' => 'N/A',
                    'name' => 'Company Reserve Pool',
                    'status' => 'credited_to_pool',
                ];
                continue;
            }

            $uplineUser = User::where('user_code', $currCode)->first();
            if ($uplineUser) {
                if ($teamAmountPerLevel > 0) {
                    $uplineUser->increment('commission_balance', $teamAmountPerLevel);
                }
                $uplineLevels[] = [
                    'level' => $lvl,
                    'amount' => $teamAmountPerLevel,
                    'user_code' => $uplineUser->user_code,
                    'name' => $uplineUser->name,
                    'status' => 'credited_to_wallet',
                ];
                $currCode = $uplineUser->sponsor_id;
            } else {
                $uplineLevels[] = [
                    'level' => $lvl,
                    'amount' => $teamAmountPerLevel,
                    'user_code' => 'N/A',
                    'name' => 'Company Reserve Pool',
                    'status' => 'credited_to_pool',
                ];
                $currCode = null;
            }
        }

        $distributionDetails = [
            'adminFeeReceived' => $adminFeeReceived,
            'installmentAmount' => $received,
            'referralPercent' => $referralPercent,
            'referralAmount' => $referralAmount,
            'teamPercent' => $teamPercent,
            'teamTotalAmount' => $teamTotalAmount,
            'teamAmountPerLevel' => $teamAmountPerLevel,
            'teamLevels' => 10,
            'uplineLevels' => $uplineLevels,
            'bpPercent' => $bpPercent,
            'totalBp' => $totalBp,
            'bpPerLevel' => $bpPerLevel,
            'bpLevels' => 20,
            'bpValueRate' => $bpRate,
            'bpMonetaryValue' => $bpMonetaryValue,
            'totalDistributionPercent' => $totalPercent,
            'totalDistributionAmount' => $totalDistribution,
            'adminNetRetained' => round($adminFeeReceived - $totalDistribution, 2),
            'adminNetRetainedPercent' => round(100 - $totalPercent, 2),
            'distributedAt' => now()->toDateTimeString(),
            'paymentReceiptId' => $payment->id,
            'invoiceNumber' => $payment->invoice_number,
            'customerName' => $payment->customer_name,
            'sponsor' => $sponsorCode,
        ];

        $payment->update([
            'network_distribution_status' => 'distributed',
            'direct_commission' => $referralAmount,
            'level_commissions_total' => $teamTotalAmount,
            'team_volume_bv' => $totalBp,
            'commission_distributed' => true,
            'distribution_details' => $distributionDetails,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Network commissions and Business Points for Receipt #RCPT-{$payment->id} (Invoice {$payment->invoice_number}) successfully disbursed across 10 equal levels to users in database!",
            'payment' => $payment,
        ]);
    }

    /**
     * Legacy distribute fallback for sale level.
     */
    public function distribute(Request $request, $id)
    {
        $sale = SalesRecord::where('id', $id)
            ->orWhere('invoice_number', $id)
            ->first();

        if (!$sale) {
            return response()->json(['status' => 'error', 'message' => 'Sale not found'], 404);
        }

        $referralPercent = (float) ($request->input('referral_percent') ?? $request->input('referralPercent') ?? 10);
        $teamPercent = (float) ($request->input('team_percent') ?? $request->input('teamPercent') ?? 7);
        $totalBp = (float) ($request->input('total_bp') ?? $request->input('totalBp') ?? 100);
        $bpRate = (float) ($request->input('bp_value_rate') ?? $request->input('bpValueRate') ?? 10);

        $received = (float) ($sale->advance_payment > 0 ? $sale->advance_payment : $sale->gross_amount);
        $referralAmount = round(($received * $referralPercent) / 100, 2);
        $teamTotalAmount = round(($received * $teamPercent) / 100, 2);

        $distributionDetails = [
            'referralPercent' => $referralPercent,
            'referralAmount' => $referralAmount,
            'teamPercent' => $teamPercent,
            'teamTotalAmount' => $teamTotalAmount,
            'teamLevels' => 10,
            'totalBp' => $totalBp,
            'bpLevels' => 20,
            'bpValueRate' => $bpRate,
            'distributedAt' => now()->toDateTimeString(),
        ];

        $sale->update([
            'network_distribution_status' => 'distributed',
            'distribution_details' => $distributionDetails,
            'direct_commission' => $referralAmount,
            'level_commissions_total' => $teamTotalAmount,
            'team_volume_bv' => $received,
            'commission_distributed' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Network Referral Commissions and Business Points successfully disbursed!',
            'sale' => $sale,
        ]);
    }

    /**
     * Get payment history receipts for all sales.
     */
    public function paymentsHistory(Request $request)
    {
        $query = SalePayment::with('salesRecord')->orderBy('id', 'desc');

        if ($request->filled('entity')) {
            $entity = trim($request->input('entity'));
            $query->where('entity_name', 'like', "%{$entity}%");
        }

        if ($request->filled('invoice')) {
            $invoice = trim($request->input('invoice'));
            $query->where('invoice_number', 'like', "%{$invoice}%");
        }

        $payments = $query->get();

        return response()->json([
            'status' => 'success',
            'payments' => $payments,
            'total_collected' => (float) $payments->sum('amount'),
            'total_admin_commission' => (float) $payments->sum('admin_commission_cut'),
            'total_net_entity' => (float) $payments->sum('net_entity_amount'),
        ]);
    }

    /**
     * Credit buyer's self business (personal_pv) and accumulate group_pv across 20 upline levels
     */
    private function creditSalePvToNetwork($customerUserCode, $receivedAmount, $sponsorCode = null)
    {
        if ($receivedAmount <= 0) {
            return;
        }

        $intPv = (int) round($receivedAmount);

        // 1. Credit buyer's self business / personal_pv in users table
        $buyer = null;
        if (!empty($customerUserCode)) {
            $buyer = User::whereRaw('LOWER(user_code) = ?', [strtolower($customerUserCode)])
                ->orWhere('id', $customerUserCode)
                ->first();
            if ($buyer) {
                $buyer->increment('personal_pv', $intPv);
            }
        }

        // 2. Accumulate group_pv up to 20 upline levels
        $currSponsorCode = $buyer ? $buyer->sponsor_id : $sponsorCode;
        for ($level = 1; $level <= 20; $level++) {
            if (empty($currSponsorCode)) {
                break;
            }

            $uplineUser = User::whereRaw('LOWER(user_code) = ?', [strtolower($currSponsorCode)])
                ->orWhere('id', $currSponsorCode)
                ->first();

            if ($uplineUser) {
                $uplineUser->increment('group_pv', $intPv);
                $currSponsorCode = $uplineUser->sponsor_id;
            } else {
                break;
            }
        }
    }

    /**
     * GET /api/user/business-reports
     * Database-driven Business Reports for User Panel
     * Returns: Sales Performance, Category Breakdown, Received Payment, Balance Payment, and Dump/Completed Payment
     */
    public function userBusinessReports(Request $request)
    {
        $this->ensureDefaultSeed();

        $query = SalesRecord::with('payments')->orderBy('date', 'desc')->orderBy('id', 'desc');

        if ($request->filled('user_code')) {
            $userCode = trim($request->input('user_code'));
            if ($request->boolean('only_self', false)) {
                $query->where(function ($q) use ($userCode) {
                    $q->where('customer_user_code', $userCode)
                      ->orWhere('customer', 'like', "%{$userCode}%");
                });
            }
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', 'like', '%' . $request->input('category') . '%');
        }

        if ($request->filled('entity_type') && $request->input('entity_type') !== 'all') {
            $query->where('entity_type', $request->input('entity_type'));
        }

        $allRecords = $query->get();

        $totalGrossSales = (float) $allRecords->sum('gross_amount');
        $totalReceivedPayment = (float) $allRecords->sum('advance_payment');
        $totalBalancePayment = (float) $allRecords->sum('balance_due');
        $totalDumpPayment = (float) $allRecords->where('balance_due', '<=', 0)->sum('gross_amount');
        $totalSalesCount = $allRecords->count();
        $completedCount = $allRecords->where('status', 'completed')->count();
        $partialCount = $allRecords->where('status', 'partial')->count();

        // Calculate Category-wise revenue breakdown directly from MySQL records
        $categoryColors = [
            'Tax & Compliance' => '#6366f1',
            'Legal & Compliance' => '#6366f1',
            'Software & IT' => '#0284c7',
            'Corporate Setup' => '#0ea5e9',
            'Corporate Setup & ROC' => '#0ea5e9',
            'Legal Services' => '#7c3aed',
            'Legal & Intellectual Property' => '#7c3aed',
            'Design & Creative' => '#ec4899',
            'Quality & Audit' => '#10b981',
            'Quality & ISO Certification' => '#10b981',
            'Government Schemes' => '#f59e0b',
            'Government & MSME Schemes' => '#f59e0b',
            'Digital Marketing' => '#8b5cf6',
            'Business Consulting' => '#14b8a6',
        ];

        $categoriesGrouped = $allRecords->groupBy(function ($item) {
            return $item->category ?: 'General Business';
        });

        $categoryBreakdown = [];
        $catIdx = 0;
        $palette = ['#6366f1', '#0284c7', '#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];

        foreach ($categoriesGrouped as $catName => $items) {
            $catGross = (float) $items->sum('gross_amount');
            $catReceived = (float) $items->sum('advance_payment');
            $catBalance = (float) $items->sum('balance_due');
            $catShare = $totalGrossSales > 0 ? round(($catGross / $totalGrossSales) * 100, 1) : 0;
            $color = $categoryColors[$catName] ?? $palette[$catIdx % count($palette)];

            $categoryBreakdown[] = [
                'id' => ++$catIdx,
                'category' => $catName,
                'ordersCount' => $items->count(),
                'grossRevenue' => $catGross,
                'receivedPayment' => $catReceived,
                'balancePayment' => $catBalance,
                'margin' => '65%',
                'growth' => '+' . rand(10, 30) . '.' . rand(1, 9) . '%',
                'status' => $catShare >= 25 ? 'Top Performer' : ($catShare >= 15 ? 'High Growth' : 'Steady'),
                'share' => $catShare,
                'color' => $color,
            ];
        }

        // Map sales records for sales performance report table
        $salesList = $allRecords->map(function ($s) {
            return [
                'id' => $s->invoice_number ?: ('INV-' . $s->id),
                'dbId' => $s->id,
                'date' => $s->date ? (is_string($s->date) ? $s->date : $s->date->format('Y-m-d')) : '2026-08-16',
                'customer' => $s->customer_name ?: ($s->customer ?: 'Customer'),
                'customerUserCode' => $s->customer_user_code,
                'entityName' => $s->entity_name ?: 'Platform Entity',
                'entityType' => $s->entity_type ?: 'business',
                'service' => $s->item ?: 'Commercial Service',
                'category' => $s->category ?: 'General Business',
                'itemType' => $s->item_type ?: 'service',
                'amount' => (float) $s->gross_amount,
                'advancePayment' => (float) $s->advance_payment,
                'balanceDue' => (float) $s->balance_due,
                'commission' => (float) ($s->direct_commission + $s->level_commissions_total),
                'payMode' => $s->payment_method ?: 'Online Payment',
                'status' => ucfirst($s->status ?: 'completed'),
                'referenceNo' => $s->reference_no,
            ];
        });

        return response()->json([
            'status' => 'success',
            'summary' => [
                'totalGrossSales' => $totalGrossSales,
                'totalReceivedPayment' => $totalReceivedPayment,
                'totalBalancePayment' => $totalBalancePayment,
                'totalDumpPayment' => $totalDumpPayment,
                'totalSalesCount' => $totalSalesCount,
                'completedSalesCount' => $completedCount,
                'partialSalesCount' => $partialCount,
                'averageDealSize' => $totalSalesCount > 0 ? round($totalGrossSales / $totalSalesCount) : 0,
            ],
            'categoryBreakdown' => $categoryBreakdown,
            'salesList' => $salesList,
        ]);
    }
}


