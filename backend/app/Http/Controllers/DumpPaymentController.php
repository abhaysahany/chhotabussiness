<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\BusinessEntity;
use App\Models\FreelancerEntity;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderPaymentDump;
use App\Services\AdminIncomeAllocationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class DumpPaymentController extends Controller
{
    protected AdminIncomeAllocationService $allocationService;

    public function __construct(AdminIncomeAllocationService $allocationService)
    {
        $this->allocationService = $allocationService;
    }

    /**
     * Authenticate Admin from Sanctum token or request user.
     */
    protected function authenticateAdmin(Request $request): ?Admin
    {
        $user = $request->user();
        if (!$user && $request->bearerToken()) {
            if (class_exists(PersonalAccessToken::class)) {
                $token = PersonalAccessToken::findToken($request->bearerToken());
                if ($token && $token->tokenable) {
                    $user = $token->tokenable;
                }
            }
        }

        if ($user instanceof Admin || (is_object($user) && get_class($user) === 'App\Models\Admin')) {
            return $user;
        }

        return null;
    }

    /**
     * Resolve authenticated entity context for multi-tenant isolation.
     */
    protected function resolveEntityContext(Request $request): ?array
    {
        $user = $request->user();
        if (!$user && $request->bearerToken()) {
            if (class_exists(PersonalAccessToken::class)) {
                $token = PersonalAccessToken::findToken($request->bearerToken());
                if ($token && $token->tokenable) {
                    $user = $token->tokenable;
                }
            }
        }

        if ($user instanceof Admin || (is_object($user) && get_class($user) === 'App\Models\Admin')) {
            return null; // Admin is not scoped as an entity
        }

        // 1A. Direct BusinessEntity Token
        if ($user instanceof BusinessEntity) {
            return [
                'id' => (int) $user->id,
                'name' => $user->name,
                'type' => 'business',
                'user' => $user,
            ];
        }

        // 1B. Direct FreelancerEntity Token
        if ($user instanceof FreelancerEntity) {
            return [
                'id' => (int) $user->id,
                'name' => $user->name,
                'type' => 'freelance',
                'user' => $user,
            ];
        }

        // 1C. Legacy User Token (backward compatibility for historical sessions like User #19)
        if ($user instanceof User) {
            $tokenName = $user->currentAccessToken()?->name;
            if (!$tokenName && $request->bearerToken() && class_exists(PersonalAccessToken::class)) {
                $tokenObj = PersonalAccessToken::findToken($request->bearerToken());
                $tokenName = $tokenObj?->name;
            }

            // Normal MLM member tokens must never access or scope entity context
            if (!$tokenName || !in_array($tokenName, ['user_auth_token', 'social_auth_token'])) {
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
        }

        $entityId = $request->input('entity_id') ?? $request->input('entityId');
        $entityName = $request->input('entity_name') ?? $request->input('entityName') ?? $request->input('entity');

        if ($entityId) {
            $business = BusinessEntity::find($entityId);
            if ($business) {
                return ['id' => (int) $business->id, 'name' => $business->name, 'type' => 'business', 'user' => null];
            }
            $freelancer = FreelancerEntity::find($entityId);
            if ($freelancer) {
                return ['id' => (int) $freelancer->id, 'name' => $freelancer->name, 'type' => 'freelance', 'user' => null];
            }
        }

        if ($entityName) {
            return ['id' => null, 'name' => $entityName, 'type' => 'business', 'user' => null];
        }

        return null;
    }

    /**
     * Entity reports an unpaid amount as Dump Payment.
     * POST /api/orders/{orderId}/report-dump
     */
    public function reportDump(Request $request, $orderId)
    {
        $order = Order::where('id', $orderId)
            ->orWhere('invoice_number', $orderId)
            ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => "Order #{$orderId} not found.",
            ], 404);
        }

        // Ownership enforcement for Entity callers
        $authEntity = $this->resolveEntityContext($request);
        $isAdmin = (bool) $this->authenticateAdmin($request);

        if (!$isAdmin && $authEntity) {
            $matchesId = !empty($authEntity['id']) && (int) $order->entity_id === (int) $authEntity['id'];
            $matchesName = !empty($authEntity['name']) && strcasecmp(trim($order->entity_name), trim($authEntity['name'])) === 0;

            if (!$matchesId && !$matchesName) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. You can only report dump payments for your own orders.',
                ], 403);
            }
        }

        // Order must be confirmed
        if ($order->approval_status !== 'confirmed') {
            return response()->json([
                'status' => 'error',
                'message' => "Cannot report dump payment for an unconfirmed order (Current Status: '{$order->approval_status}'). Order must be confirmed by Admin first.",
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'dump_amount' => 'required|numeric|min:0.01',
            'dump_reason' => 'required|string|min:3|max:2000',
            'notes' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $dumpAmount = round((float) $request->input('dump_amount'), 2);
        if ($dumpAmount <= 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Dump amount must be greater than zero.',
            ], 422);
        }

        // Reconcile remaining collectible balance
        $currentApprovedDumps = (float) OrderPaymentDump::where('order_id', $order->id)
            ->where('status', 'approved')
            ->sum('dump_amount');

        $currentPendingDumps = (float) OrderPaymentDump::where('order_id', $order->id)
            ->where('status', 'pending')
            ->sum('dump_amount');

        $remainingCollectible = max(0.0, round($order->gross_amount - $order->advance_payment - $currentApprovedDumps, 2));

        if ($dumpAmount > $remainingCollectible) {
            return response()->json([
                'status' => 'error',
                'message' => "Requested dump amount (₹" . number_format($dumpAmount, 2) . ") exceeds the remaining collectible balance of ₹" . number_format($remainingCollectible, 2) . ".",
                'remaining_collectible_balance' => $remainingCollectible,
            ], 422);
        }

        if ($dumpAmount > round($remainingCollectible - $currentPendingDumps, 2)) {
            return response()->json([
                'status' => 'error',
                'message' => "Requested dump amount (₹" . number_format($dumpAmount, 2) . ") combined with existing pending dump requests (₹" . number_format($currentPendingDumps, 2) . ") exceeds the remaining collectible balance of ₹" . number_format($remainingCollectible, 2) . ".",
                'remaining_collectible_balance' => $remainingCollectible,
                'pending_dumps' => $currentPendingDumps,
            ], 422);
        }

        $commissionPercent = (float) ($order->admin_commission_percent ?? 15.0);
        $expectedAdminCut = round(($dumpAmount * $commissionPercent) / 100, 2);

        $dumpRequest = OrderPaymentDump::create([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'entity_id' => $order->entity_id,
            'entity_name' => $order->entity_name,
            'customer_name' => $order->customer_name,
            'customer_user_code' => $order->customer_user_code,
            'dump_amount' => $dumpAmount,
            'admin_commission_percent' => $commissionPercent,
            'admin_commission_cut' => $expectedAdminCut,
            'direct_income_amount' => 0.0,
            'level_income_amount' => 0.0,
            'reward_income_amount' => 0.0,
            'dump_reason' => trim($request->input('dump_reason')),
            'notes' => $request->input('notes'),
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Dump Payment request submitted successfully. It is awaiting Admin approval.',
            'dump_request' => $dumpRequest,
            'order' => [
                'id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'gross_amount' => (float) $order->gross_amount,
                'advance_payment' => (float) $order->advance_payment,
                'balance_due' => (float) $order->balance_due,
                'approval_status' => $order->approval_status,
            ],
        ], 201);
    }

    /**
     * List Dump Payment requests for Entity.
     * GET /api/entity/dump-requests
     */
    public function getEntityDumpRequests(Request $request)
    {
        $query = OrderPaymentDump::with('order')->orderBy('id', 'desc');

        $authEntity = $this->resolveEntityContext($request);
        if ($authEntity) {
            $query->where(function ($q) use ($authEntity) {
                if (!empty($authEntity['id'])) {
                    $q->where('entity_id', $authEntity['id']);
                }
                if (!empty($authEntity['name'])) {
                    $q->orWhere('entity_name', $authEntity['name']);
                }
            });
        } elseif ($request->filled('entity_id')) {
            $query->where('entity_id', $request->input('entity_id'));
        } elseif ($request->filled('entity')) {
            $entity = trim($request->input('entity'));
            $query->where(function ($q) use ($entity) {
                $q->where('entity_name', 'like', "%{$entity}%")
                  ->orWhere('entity_id', $entity);
            });
        }

        if ($request->filled('order_id')) {
            $query->where('order_id', $request->input('order_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', strtolower(trim($request->input('status'))));
        }

        $dumps = $query->get();

        return response()->json([
            'status' => 'success',
            'count' => $dumps->count(),
            'data' => $dumps,
            'dumps' => $dumps,
        ], 200);
    }

    /**
     * Admin list all Dump Payment requests.
     * GET /api/admin/dump-requests
     */
    public function getAdminDumpRequests(Request $request)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required.',
            ], 401);
        }

        $query = OrderPaymentDump::with('order')->orderBy('id', 'desc');

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', strtolower(trim($request->input('status'))));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_user_code', 'like', "%{$search}%")
                  ->orWhere('entity_name', 'like', "%{$search}%")
                  ->orWhere('dump_reason', 'like', "%{$search}%");
            });
        }

        $allDumps = $query->get();

        // Compute summary KPIs
        $allRecords = OrderPaymentDump::all();
        $pendingCount = $allRecords->where('status', 'pending')->count();
        $approvedCount = $allRecords->where('status', 'approved')->count();
        $rejectedCount = $allRecords->where('status', 'rejected')->count();
        $totalApprovedDump = (float) $allRecords->where('status', 'approved')->sum('dump_amount');
        $totalApprovedAdminCut = (float) $allRecords->where('status', 'approved')->sum('admin_commission_cut');
        $totalPendingDump = (float) $allRecords->where('status', 'pending')->sum('dump_amount');

        return response()->json([
            'status' => 'success',
            'count' => $allDumps->count(),
            'summary' => [
                'pending_count' => $pendingCount,
                'approved_count' => $approvedCount,
                'rejected_count' => $rejectedCount,
                'total_approved_dump' => $totalApprovedDump,
                'total_approved_admin_cut' => $totalApprovedAdminCut,
                'total_pending_dump' => $totalPendingDump,
            ],
            'data' => $allDumps,
            'dumps' => $allDumps,
        ], 200);
    }

    /**
     * Admin view details of a Dump Payment request.
     * GET /api/admin/dump-requests/{id}
     */
    public function getAdminDumpRequestDetails(Request $request, $id)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required.',
            ], 401);
        }

        $dump = OrderPaymentDump::with(['order.payments'])->find($id);
        if (!$dump) {
            return response()->json([
                'status' => 'error',
                'message' => "Dump Request #{$id} not found.",
            ], 404);
        }

        $order = $dump->order;
        $orderCommissionRate = (float) ($order?->admin_commission_percent ?? $dump->admin_commission_percent ?? 15.0);
        $dumpAdminCut = round(($dump->dump_amount * $orderCommissionRate) / 100, 2);
        $previewSplit = $this->allocationService->calculateSplit($dumpAdminCut);

        $currentApprovedDumps = (float) OrderPaymentDump::where('order_id', $order?->id ?? 0)
            ->where('status', 'approved')
            ->where('id', '!=', $dump->id)
            ->sum('dump_amount');

        $remainingCollectible = max(0.0, round(($order?->gross_amount ?? 0) - ($order?->advance_payment ?? 0) - $currentApprovedDumps, 2));
        $remainingAfterDump = max(0.0, round($remainingCollectible - $dump->dump_amount, 2));

        return response()->json([
            'status' => 'success',
            'dump_request' => $dump,
            'preview_calculations' => [
                'project_gross' => (float) ($order?->gross_amount ?? 0),
                'actual_advance_received' => (float) ($order?->advance_payment ?? 0),
                'current_outstanding_balance' => $remainingCollectible,
                'approved_commission_percent' => $orderCommissionRate,
                'requested_dump_amount' => (float) $dump->dump_amount,
                'dump_admin_cut' => $dumpAdminCut,
                'direct_dump_amount' => $previewSplit['direct_amount'],
                'level_dump_amount' => $previewSplit['level_amount'],
                'reward_dump_amount' => $previewSplit['reward_amount'],
                'remaining_balance_after_dump' => $remainingAfterDump,
            ],
        ], 200);
    }

    /**
     * Admin approves a Dump Payment request.
     * POST /api/admin/dump-requests/{id}/approve
     */
    public function approveDump(Request $request, $id)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required to approve dump payments.',
            ], 401);
        }

        return DB::transaction(function () use ($id, $admin) {
            $dump = OrderPaymentDump::lockForUpdate()->find($id);
            if (!$dump) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Dump Request #{$id} not found.",
                ], 404);
            }

            if ($dump->status === 'approved') {
                return response()->json([
                    'status' => 'error',
                    'message' => "Dump Request #{$dump->id} has already been approved.",
                ], 422);
            }

            if ($dump->status !== 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => "Only pending dump requests can be approved (Current Status: '{$dump->status}').",
                ], 422);
            }

            $order = Order::lockForUpdate()->find($dump->order_id);
            if (!$order) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Parent Order #{$dump->order_id} not found.",
                ], 404);
            }

            if ($order->approval_status !== 'confirmed') {
                return response()->json([
                    'status' => 'error',
                    'message' => "Parent Order #{$order->invoice_number} is not confirmed (Current Status: '{$order->approval_status}'). Dump can only be approved on confirmed orders.",
                ], 422);
            }

            // Reconcile outstanding balance
            $currentApprovedDumps = (float) OrderPaymentDump::where('order_id', $order->id)
                ->where('status', 'approved')
                ->where('id', '!=', $dump->id)
                ->sum('dump_amount');

            $remainingCollectible = max(0.0, round($order->gross_amount - $order->advance_payment - $currentApprovedDumps, 2));

            if ($dump->dump_amount > $remainingCollectible) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Dump amount (₹" . number_format($dump->dump_amount, 2) . ") exceeds the remaining collectible balance of ₹" . number_format($remainingCollectible, 2) . ".",
                ], 422);
            }

            // 1. Calculate Dump Admin Cut using approved Order commission percentage
            $commissionPercent = (float) ($order->admin_commission_percent ?? 15.0);
            $dumpAdminCut = round(($dump->dump_amount * $commissionPercent) / 100, 2);

            // 2. Calculate 40/40/20 decimal-safe split
            $split = $this->allocationService->calculateSplit($dumpAdminCut);

            // 3. Update Dump Record
            $dump->update([
                'admin_commission_percent' => $commissionPercent,
                'admin_commission_cut' => $dumpAdminCut,
                'direct_income_amount' => $split['direct_amount'],
                'level_income_amount' => $split['level_amount'],
                'reward_income_amount' => $split['reward_amount'],
                'status' => 'approved',
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ]);

            // 4. Update Parent Order aggregates
            $newTotalApprovedDump = round($currentApprovedDumps + $dump->dump_amount, 2);
            $newRemainingBalance = max(0.0, round($order->gross_amount - $order->advance_payment - $newTotalApprovedDump, 2));

            $order->update([
                'dump_amount' => $newTotalApprovedDump,
                'balance_due' => $newRemainingBalance,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Dump Payment of ₹" . number_format($dump->dump_amount, 2) . " has been approved successfully.",
                'dump_request' => $dump->fresh(),
                'order' => $order->fresh(),
            ], 200);
        });
    }

    /**
     * Admin rejects a Dump Payment request.
     * POST /api/admin/dump-requests/{id}/reject
     */
    public function rejectDump(Request $request, $id)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required to reject dump payments.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|min:3|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed: A valid rejection reason (minimum 3 characters) is mandatory.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $reason = trim((string) $request->input('rejection_reason'));

        return DB::transaction(function () use ($id, $reason, $admin) {
            $dump = OrderPaymentDump::lockForUpdate()->find($id);
            if (!$dump) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Dump Request #{$id} not found.",
                ], 404);
            }

            if ($dump->status === 'rejected') {
                return response()->json([
                    'status' => 'error',
                    'message' => "Dump Request #{$dump->id} has already been rejected.",
                ], 422);
            }

            if ($dump->status !== 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => "Only pending dump requests can be rejected (Current Status: '{$dump->status}').",
                ], 422);
            }

            $dump->update([
                'status' => 'rejected',
                'admin_rejection_reason' => $reason,
                'rejected_by' => $admin->id,
                'rejected_at' => now(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Dump Request #{$dump->id} has been rejected.",
                'dump_request' => $dump->fresh(),
            ], 200);
        });
    }
}
