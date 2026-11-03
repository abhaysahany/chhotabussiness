<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Service;
use App\Models\BusinessEntity;
use App\Models\FreelancerEntity;
use App\Models\EntityCommissionSetting;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Resolve the active Entity context from Bearer token, authenticated user, or request parameters.
     */
    protected function resolveEntityContext(Request $request)
    {
        // Requests to admin endpoints must never be scoped to an individual entity
        if ($request->is('api/admin/*') || $request->is('admin/*')) {
            return null;
        }

        // 1. Check authenticated user via Sanctum or Token
        $user = $request->user();
        if (!$user && $request->bearerToken()) {
            if (class_exists(PersonalAccessToken::class)) {
                $token = PersonalAccessToken::findToken($request->bearerToken());
                if ($token && $token->tokenable) {
                    $user = $token->tokenable;
                }
            }
        }

        // If the authenticated user is an Admin, never scope as an entity
        if ($user instanceof Admin || (is_object($user) && get_class($user) === 'App\Models\Admin')) {
            return null;
        }

        if ($user) {
            $business = BusinessEntity::where('email', $user->email)->first();
            if ($business) {
                return [
                    'id' => (int) $business->id,
                    'name' => $business->name,
                    'type' => 'business',
                    'user' => $user,
                ];
            }

            $freelancer = FreelancerEntity::where('email', $user->email)->first();
            if ($freelancer) {
                return [
                    'id' => (int) $freelancer->id,
                    'name' => $freelancer->name,
                    'type' => 'freelance',
                    'user' => $user,
                ];
            }
        }

        // 2. Check explicit request parameters (e.g. from frontend or API filters)
        $entityId = $request->input('entity_id') ?? $request->input('entityId');
        $entityName = $request->input('entity_name') ?? $request->input('entityName') ?? $request->input('entity');
        $entityType = $request->input('entity_type') ?? $request->input('entityType');

        if ($entityId) {
            $business = BusinessEntity::find($entityId);
            if ($business) {
                return [
                    'id' => (int) $business->id,
                    'name' => $business->name,
                    'type' => 'business',
                    'user' => null,
                ];
            }
            $freelancer = FreelancerEntity::find($entityId);
            if ($freelancer) {
                return [
                    'id' => (int) $freelancer->id,
                    'name' => $freelancer->name,
                    'type' => 'freelance',
                    'user' => null,
                ];
            }
        }

        if ($entityName) {
            $business = BusinessEntity::where('name', $entityName)->first();
            if ($business) {
                return [
                    'id' => (int) $business->id,
                    'name' => $business->name,
                    'type' => 'business',
                    'user' => null,
                ];
            }
            $freelancer = FreelancerEntity::where('name', $entityName)->first();
            if ($freelancer) {
                return [
                    'id' => (int) $freelancer->id,
                    'name' => $freelancer->name,
                    'type' => 'freelance',
                    'user' => null,
                ];
            }

            return [
                'id' => $entityId ? (int) $entityId : null,
                'name' => $entityName,
                'type' => $entityType ?: 'business',
                'user' => null,
            ];
        }

        return null;
    }

    /**
     * List all orders (supports search, entity filter, status filter, and dual order/sale serialization).
     */
    public function index(Request $request)
    {
        $query = Order::with('payments')->orderBy('id', 'desc');

        // Resolve authenticated entity if present
        $authEntity = $this->resolveEntityContext($request);
        $isAdminRoute = $request->is('api/admin/*') || $request->is('admin/*');

        if (!$isAdminRoute && $authEntity && $authEntity['user']) {
            // Strict authorization scoping: authenticated entity user can ONLY access its own orders
            $query->where(function ($q) use ($authEntity) {
                if (!empty($authEntity['id'])) {
                    $q->where('entity_id', $authEntity['id']);
                }
                if (!empty($authEntity['name'])) {
                    $q->orWhere('entity_name', $authEntity['name']);
                }
            });
        } else {
            // Unauthenticated or general/admin query: filter by entity_id and/or entity name
            if ($request->filled('entity_id')) {
                $query->where('entity_id', $request->input('entity_id'));
            }

            if ($request->filled('entity')) {
                $entity = trim($request->input('entity'));
                $query->where(function ($q) use ($entity) {
                    $q->where('entity_name', 'like', "%{$entity}%")
                      ->orWhere('entity_id', $entity);
                });
            }
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

        $orders = $query->get();

        // Calculate summary metrics
        $totalGross = (float) $orders->sum('gross_amount');
        $totalReceived = (float) $orders->sum('advance_payment');
        $totalBalanceDue = (float) $orders->sum('balance_due');
        $totalExpectedCommission = (float) $orders->sum(fn($o) => $o->expected_admin_cut);
        $totalCollectedCommission = (float) $orders->sum(fn($o) => $o->admin_commission_collected);
        $totalRemainingCommission = max(0.0, round($totalExpectedCommission - $totalCollectedCommission, 2));
        $totalDistributedCommission = (float) $orders->sum('distributed_admin_cut_amount');
        $pendingDistributionCount = $orders->filter(function ($o) {
            return $o->payments->contains(function ($p) {
                return $p->income_distribution_status === 'pending' && (float) ($p->admin_commission_cut ?? 0) > 0;
            });
        })->count();

        return response()->json([
            'status' => 'success',
            'count' => $orders->count(),
            'orders' => $orders,
            'sales' => $orders, // backward compatibility
            'summary' => [
                'total_gross' => $totalGross,
                'total_received' => $totalReceived,
                'total_balance_due' => $totalBalanceDue,
                'total_admin_commission' => $totalExpectedCommission,
                'expected_admin_commission' => $totalExpectedCommission,
                'collected_admin_commission' => $totalCollectedCommission,
                'remaining_admin_commission' => $totalRemainingCommission,
                'distributed_admin_commission' => $totalDistributedCommission,
                'pending_distribution_count' => $pendingDistributionCount,
            ],
        ]);
    }

    /**
     * Record a new order created by an Entity (or Admin).
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

        $itemName = $request->input('item');
        $itemType = $request->input('item_type') ?? $request->input('itemType') ?? 'service';

        // Resolve Entity context: Authenticated entity takes top precedence
        $entityContext = $this->resolveEntityContext($request);
        $entityId = $entityContext['id'] ?? $request->input('entity_id') ?? $request->input('entityId') ?? null;
        $entityName = $entityContext['name'] ?? $request->input('entity_name') ?? $request->input('entityName') ?? null;
        $entityType = $entityContext['type'] ?? $request->input('entity_type') ?? $request->input('entityType') ?? 'business';

        $catalogItem = null;
        if ($itemType === 'product') {
            $catalogItem = Product::where('name', $itemName)->first();
        } else {
            $catalogItem = Service::where('name', $itemName)->first();
        }

        // Selling entity takes precedence over catalog owner
        $finalEntityName = $entityName ?: ($catalogItem?->owner_name ?: 'Skyline Technologies Pvt Ltd');
        $finalEntityType = $entityType ?: ($catalogItem?->owner_type ?: 'business');
        $finalEntityId = $entityId ? (int) $entityId : ($catalogItem?->owner_id ?: null);

        // Prevent accidental duplicate orders from rapid clicks (within 30 seconds)
        $recentDuplicate = Order::where('customer_user_code', $customerUserCode)
            ->where(function ($q) use ($finalEntityId, $finalEntityName) {
                if ($finalEntityId) {
                    $q->where('entity_id', $finalEntityId)
                      ->orWhere('entity_name', $finalEntityName);
                } else {
                    $q->where('entity_name', $finalEntityName);
                }
            })
            ->where('item', $itemName)
            ->where('gross_amount', $grossAmount)
            ->where('advance_payment', $advancePayment)
            ->where('created_at', '>=', now()->subSeconds(30))
            ->first();

        if ($recentDuplicate) {
            $recentDuplicate->load('payments');
            return response()->json([
                'status' => 'success',
                'message' => 'Order already recorded (duplicate submission prevented).',
                'order' => $recentDuplicate,
                'sale' => $recentDuplicate,
                'duplicate_prevented' => true,
            ], 200);
        }

        $commissionConfig = EntityCommissionSetting::resolveForEntity(
            $finalEntityType,
            $finalEntityName,
            $finalEntityId ? (int) $finalEntityId : null
        );

        $directPercent = (float) $commissionConfig['direct_percent'];
        $levelsTotalPercent = (float) $commissionConfig['network_levels_total'];
        $totalCommissionPercent = (float) $commissionConfig['total_commission_percent'];

        $adminCommissionPercent = (float) ($catalogItem?->admin_commission_percent ?? $request->input('admin_commission_percent') ?? $request->input('adminCommissionPercent') ?? $totalCommissionPercent);
        if ($adminCommissionPercent <= 0) {
            $adminCommissionPercent = 15.0;
        }

        if ($advancePayment > $grossAmount) {
            return response()->json([
                'status' => 'error',
                'message' => "Advance payment (₹" . number_format($advancePayment, 2) . ") cannot exceed total project amount of ₹" . number_format($grossAmount, 2) . ".",
            ], 422);
        }
        
        // 1. Overall Order-Level Expected Admin Commission (Order Gross Amount * Commission % / 100)
        $expectedOrderAdminCommission = round(($grossAmount * $adminCommissionPercent) / 100, 2);

        // 2. Payment-Level Admin Commission snapshot for initial advance payment receipt
        $advanceAdminCommissionCut = round(($advancePayment * $adminCommissionPercent) / 100, 2);
        $netEntityPayout = round($advancePayment - $advanceAdminCommissionCut, 2);

        $directCommission = round(($advancePayment * $directPercent) / 100, 2);
        $levelCommissionsTotal = round(($advancePayment * $levelsTotalPercent) / 100, 2);

        $invoiceNumber = $request->input('invoice_number') ?? $request->input('invoiceNumber') ?? ('INV-' . date('Y') . '-' . rand(10000, 99999));

        $status = ($balanceDue == 0) ? 'completed' : (($advancePayment > 0) ? 'partial' : 'pending');

        $finalSponsor = $sponsor ?: ($member?->sponsor_id ?: null);

        $orderData = [
            'invoice_number' => $invoiceNumber,
            'date' => $request->input('date') ?? date('Y-m-d'),
            'entity_id' => $finalEntityId,
            'entity_name' => $finalEntityName,
            'entity_type' => $finalEntityType,
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'customer_phone' => $customerPhone,
            'customer_user_code' => $customerUserCode,
            'customer' => "{$customerName} ({$customerUserCode})",
            'sponsor' => $finalSponsor,
            'item' => $itemName,
            'item_type' => $itemType,
            'category' => $request->input('category') ?? ($catalogItem?->category ?? 'General'),
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'gross_amount' => $grossAmount,
            'dump_amount' => (float) ($request->input('dump_amount') ?? $request->input('dumpAmount') ?? 0.0),
            'taxable_amount' => round($grossAmount / 1.18, 2),
            'gst_tax' => round($grossAmount - ($grossAmount / 1.18), 2),
            'admin_commission_percent' => $adminCommissionPercent,
            'admin_commission_cut' => $expectedOrderAdminCommission,
            'net_entity_payout' => $netEntityPayout,
            'advance_payment' => $advancePayment,
            'balance_due' => $balanceDue,
            'payment_method' => $request->input('payment_method') ?? $request->input('paymentMethod') ?? 'UPI / QR Code',
            'reference_no' => $request->input('reference_no') ?? $request->input('referenceNo') ?? ('UTR-' . rand(100000, 999990)),
            'status' => $status,
            'income_distribution_status' => 'pending',
            'network_distribution_status' => 'pending_admin_distribution',
            'direct_commission' => $directCommission,
            'level_commissions_total' => $levelCommissionsTotal,
            'team_volume_bv' => $advancePayment,
            'commission_distributed' => false,
        ];

        DB::beginTransaction();
        try {
            $order = Order::create($orderData);

            // Log the initial payment installment
            if ($advancePayment > 0) {
                SalePayment::create([
                    'sales_record_id' => $order->id,
                    'invoice_number' => $order->invoice_number,
                    'entity_name' => $order->entity_name,
                    'customer_name' => $order->customer_name,
                    'customer_user_code' => $order->customer_user_code,
                    'sponsor' => $order->sponsor,
                    'amount' => $advancePayment,
                    'admin_commission_percent' => $adminCommissionPercent,
                    'admin_commission_cut' => $advanceAdminCommissionCut,
                    'net_entity_amount' => $netEntityPayout,
                    'payment_method' => $order->payment_method,
                    'reference_no' => $order->reference_no,
                    'payment_type' => ($balanceDue == 0) ? 'full' : 'advance',
                    'notes' => 'Initial payment received at order creation',
                    'payment_date' => now(),
                    'income_distribution_status' => 'pending',
                    'direct_income_amount' => 0.0,
                    'level_income_amount' => 0.0,
                    'reward_income_amount' => 0.0,
                    'distributed_admin_cut_amount' => 0.0,
                ]);

                // Credit buyer's personal_pv (self biz) and accumulate group_pv across 20 upline levels
                $this->creditSalePvToNetwork($customerUserCode, $advancePayment, $finalSponsor);
            }

            DB::commit();

            $order->load('payments');

            return response()->json([
                'status' => 'success',
                'message' => 'Order and invoice created successfully in MySQL database',
                'order' => $order,
                'sale' => $order, // backward compatibility
                'invoice_number' => $invoiceNumber,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create order record: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get details of a single order and its payment installments.
     */
    public function show(Request $request, $id)
    {
        $query = Order::with('payments')->where(function ($q) use ($id) {
            $q->where('id', $id)
              ->orWhere('invoice_number', $id);
        });

        // Enforce entity authorization if authenticated as entity user (bypass for admin)
        $authEntity = $this->resolveEntityContext($request);
        $isAdminRoute = $request->is('api/admin/*') || $request->is('admin/*');
        if (!$isAdminRoute && $authEntity && $authEntity['user']) {
            $query->where(function ($q) use ($authEntity) {
                if (!empty($authEntity['id'])) {
                    $q->where('entity_id', $authEntity['id']);
                }
                if (!empty($authEntity['name'])) {
                    $q->orWhere('entity_name', $authEntity['name']);
                }
            });
        }

        $order = $query->first();

        if (!$order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found or unauthorized'], 404);
        }

        return response()->json([
            'status' => 'success',
            'order' => $order,
            'sale' => $order, // backward compatibility
        ]);
    }

    /**
     * Receive Balance Payment on an existing order.
     * Releases admin commission on the received amount and updates balance due.
     */
    public function receiveBalance(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->orWhere('invoice_number', $id)
            ->first();

        if (!$order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        if ($order->balance_due <= 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'This order has already been fully paid. Outstanding balance is ₹0.',
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
        if ($amount <= 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment amount must be greater than zero.',
            ], 422);
        }

        if ($amount > $order->balance_due) {
            return response()->json([
                'status' => 'error',
                'message' => "Payment amount (₹" . number_format($amount, 2) . ") exceeds the outstanding balance due of ₹" . number_format($order->balance_due, 2) . ".",
            ], 422);
        }

        $adminCommissionPercent = (float) ($order->admin_commission_percent ?? 15);
        if ($adminCommissionPercent <= 0) {
            $adminCommissionPercent = 15.0;
        }
        $adminCommissionCut = round(($amount * $adminCommissionPercent) / 100, 2);
        $netEntityAmount = round($amount - $adminCommissionCut, 2);

        $commissionConfig = EntityCommissionSetting::resolveForEntity(
            $order->entity_type,
            $order->entity_name,
            $order->entity_id ? (int) $order->entity_id : null
        );

        $directPercent = (float) $commissionConfig['direct_percent'];
        $levelsTotalPercent = (float) $commissionConfig['network_levels_total'];
        $directCommission = round(($amount * $directPercent) / 100, 2);
        $levelCommissionsTotal = round(($amount * $levelsTotalPercent) / 100, 2);

        $paymentMethod = $request->input('payment_method') ?? $request->input('paymentMethod') ?? 'UPI / PhonePe';
        $referenceNo = $request->input('reference_no') ?? $request->input('referenceNo') ?? ('UTR-' . rand(100000, 999990));
        $notes = $request->input('notes') ?? 'Balance installment received by entity';

        DB::beginTransaction();
        try {
            // 1. Create payment transaction receipt with network distribution tracking
            $payment = SalePayment::create([
                'sales_record_id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'entity_name' => $order->entity_name,
                'customer_name' => $order->customer_name,
                'customer_user_code' => $order->customer_user_code,
                'sponsor' => $order->sponsor,
                'amount' => $amount,
                'admin_commission_percent' => $adminCommissionPercent,
                'admin_commission_cut' => $adminCommissionCut,
                'net_entity_amount' => $netEntityAmount,
                'payment_method' => $paymentMethod,
                'reference_no' => $referenceNo,
                'payment_type' => 'balance',
                'notes' => $notes,
                'payment_date' => now(),
                'income_distribution_status' => 'pending',
                'direct_income_amount' => 0.0,
                'level_income_amount' => 0.0,
                'reward_income_amount' => 0.0,
                'distributed_admin_cut_amount' => 0.0,
            ]);

            // 2. Update Order totals atomically
            $newAdvance = round($order->advance_payment + $amount, 2);
            $newBalance = max(0.0, round($order->gross_amount - $newAdvance, 2));
            $newNetEntityTotal = round($order->net_entity_payout + $netEntityAmount, 2);
            $newStatus = ($newBalance <= 0) ? 'completed' : 'partial';

            // Order-level expected Admin Commission remains the expected total on the project
            $expectedAdminCommission = (float) ($order->admin_commission_cut > 0
                ? $order->admin_commission_cut
                : round(($order->gross_amount * $adminCommissionPercent) / 100, 2));

            $order->update([
                'advance_payment' => $newAdvance,
                'balance_due' => $newBalance,
                'admin_commission_cut' => $expectedAdminCommission,
                'net_entity_payout' => $newNetEntityTotal,
                'status' => $newStatus,
            ]);

            app(\App\Services\AdminIncomeAllocationService::class)->syncOrderIncomeDistributionStatus($order);

            // Credit buyer's personal_pv (self biz) and accumulate group_pv across 20 upline levels
            $this->creditSalePvToNetwork($order->customer_user_code, $amount, $order->sponsor);

            DB::commit();

            $order->load('payments');

            return response()->json([
                'status' => 'success',
                'message' => "Successfully collected ₹{$amount}. Admin commission of ₹{$adminCommissionCut} ({$adminCommissionPercent}%) released to system.",
                'order' => $order,
                'sale' => $order, // backward compatibility
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
     * DEPRECATED & DISABLED: Legacy 10-level commission and BP distribution module has been disabled.
     * Admin Commission allocations are handled exclusively via Order Management (40/40/20 architecture):
     * POST /api/admin/payments/{paymentId}/income-allocation
     */
    public function distributePaymentCommission(Request $request, $id)
    {
        return response()->json([
            'status' => 'error',
            'code' => 'LEGACY_MODULE_DISABLED',
            'message' => 'Legacy payment commission distribution has been permanently disabled. Admin Commission allocation is handled exclusively via Order Management (POST /api/admin/payments/{paymentId}/income-allocation).',
        ], 410);
    }

    /**
     * Legacy distribute fallback for order level (DEPRECATED & DISABLED).
     */
    public function distribute(Request $request, $id)
    {
        return response()->json([
            'status' => 'error',
            'code' => 'LEGACY_MODULE_DISABLED',
            'message' => 'Legacy order commission distribution has been permanently disabled. Admin Commission allocation is handled exclusively via Order Management (POST /api/admin/payments/{paymentId}/income-allocation).',
        ], 410);
    }

    /**
     * Get payment history receipts for all orders.
     * Admin route defaults to showing only successfully distributed receipts (income_distribution_status = 'completed').
     */
    public function paymentsHistory(Request $request)
    {
        $query = SalePayment::whereHas('order')->with(['order.payments'])->orderBy('id', 'desc');

        $authEntity = $this->resolveEntityContext($request);
        $isAdminRoute = $request->is('api/admin/*') || $request->is('admin/*');

        // Distribution Status Filter:
        // Admin Payment Receipts & History page shows ONLY successfully distributed payments by default.
        if ($request->filled('status')) {
            $status = strtolower(trim($request->input('status')));
            if ($status === 'completed') {
                $query->where('income_distribution_status', 'completed');
            } elseif ($status === 'pending') {
                $query->where('income_distribution_status', 'pending');
            } elseif ($status !== 'all') {
                $query->where('income_distribution_status', $status);
            }
        } elseif ($isAdminRoute) {
            $query->where('income_distribution_status', 'completed');
        }

        if (!$isAdminRoute && $authEntity && $authEntity['user']) {
            $query->where(function ($q) use ($authEntity) {
                if (!empty($authEntity['name'])) {
                    $q->where('entity_name', $authEntity['name']);
                }
                if (!empty($authEntity['id'])) {
                    $q->orWhereHas('order', function ($sq) use ($authEntity) {
                        $sq->where('entity_id', $authEntity['id']);
                    });
                }
            });
        } else {
            if ($request->filled('entity_id')) {
                $entityId = $request->input('entity_id');
                $query->whereHas('order', function ($sq) use ($entityId) {
                    $sq->where('entity_id', $entityId);
                });
            }

            if ($request->filled('entity')) {
                $entity = trim($request->input('entity'));
                $query->where('entity_name', 'like', "%{$entity}%");
            }
        }

        if ($request->filled('invoice')) {
            $invoice = trim($request->input('invoice'));
            $query->where('invoice_number', 'like', "%{$invoice}%");
        }

        if ($request->filled('payment_type')) {
            $pType = strtolower(trim($request->input('payment_type')));
            if ($pType !== 'all') {
                $query->where('payment_type', $pType);
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($sq) use ($search) {
                $sq->where('invoice_number', 'like', "%{$search}%")
                   ->orWhere('customer_name', 'like', "%{$search}%")
                   ->orWhere('customer_user_code', 'like', "%{$search}%")
                   ->orWhere('sponsor', 'like', "%{$search}%")
                   ->orWhere('entity_name', 'like', "%{$search}%")
                   ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        $payments = $query->get();

        return response()->json([
            'status' => 'success',
            'payments' => $payments,
            'total_collected' => (float) $payments->sum('amount'),
            'total_admin_commission' => (float) $payments->sum('admin_commission_cut'),
            'total_net_entity' => (float) $payments->sum('net_entity_amount'),
            'total_direct_income' => (float) $payments->sum('direct_income_amount'),
            'total_level_income' => (float) $payments->sum('level_income_amount'),
            'total_reward_income' => (float) $payments->sum('reward_income_amount'),
            'total_distributed_admin_cut' => (float) $payments->sum('distributed_admin_cut_amount'),
            'total_count' => $payments->count(),
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
     * Returns: Orders/Sales Performance, Category Breakdown, Received Payment, Balance Payment, and Dump/Completed Payment
     */
    public function userBusinessReports(Request $request)
    {
        $query = Order::with('payments')->orderBy('date', 'desc')->orderBy('id', 'desc');

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
                'margin' => $catGross > 0 ? round(($catReceived / $catGross) * 100) . '%' : '0%',
                'growth' => $catShare > 0 ? "+{$catShare}%" : '0%',
                'status' => $catShare >= 25 ? 'Top Performer' : ($catShare >= 15 ? 'High Growth' : 'Steady'),
                'share' => $catShare,
                'color' => $color,
            ];
        }

        // Map order records for sales/order performance report table
        $salesList = $allRecords->map(function ($s) {
            return [
                'id' => $s->invoice_number ?: ('INV-' . $s->id),
                'dbId' => $s->id,
                'date' => $s->date ? (is_string($s->date) ? $s->date : $s->date->format('Y-m-d')) : ($s->created_at ? $s->created_at->format('Y-m-d') : date('Y-m-d')),
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
            'ordersList' => $salesList, // canonical alias
        ]);
    }
}
