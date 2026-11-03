<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Order;
use App\Models\SalePayment;
use App\Services\AdminIncomeAllocationService;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class IncomeAllocationController extends Controller
{
    protected AdminIncomeAllocationService $allocationService;

    public function __construct(AdminIncomeAllocationService $allocationService)
    {
        $this->allocationService = $allocationService;
    }

    /**
     * Authenticate and verify that caller is an Admin.
     *
     * @param Request $request
     * @return Admin|null
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
     * Preview income allocation breakdown for a single specific payment receipt.
     * Read-only preview: does not modify or persist any data.
     *
     * GET /api/admin/payments/{paymentId}/income-allocation
     */
    public function showPayment(Request $request, $paymentId)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required to inspect income allocation.',
            ], 401);
        }

        $payment = SalePayment::with('order')->find($paymentId);

        if (!$payment) {
            return response()->json([
                'status' => 'error',
                'message' => "Payment receipt #{$paymentId} not found in database.",
            ], 404);
        }

        try {
            $details = $this->allocationService->getPaymentAllocationDetails($payment);

            return response()->json([
                'status' => 'success',
                'allocation' => $details,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Confirm and persist income allocation for a single specific payment receipt.
     *
     * POST /api/admin/payments/{paymentId}/income-allocation
     */
    public function allocatePayment(Request $request, $paymentId)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required to execute income allocation.',
            ], 401);
        }

        $payment = SalePayment::find($paymentId);

        if (!$payment) {
            return response()->json([
                'status' => 'error',
                'message' => "Payment receipt #{$paymentId} not found in database.",
            ], 404);
        }

        try {
            $result = $this->allocationService->allocatePaymentIncome((int) $paymentId, $admin->id);

            return response()->json([
                'status' => 'success',
                'message' => "Income allocation of ₹{$result['allocated']['eligible_admin_cut']} confirmed successfully for Payment #{$payment->id} (Invoice: {$payment->invoice_number}).",
                'allocated' => $result['allocated'],
                'payment' => $result['payment'],
                'order' => $result['order'],
                'order_cumulative' => $result['order_cumulative'],
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process payment income allocation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update order-level Dump Amount.
     *
     * PUT/POST /api/admin/orders/{orderId}/dump-amount
     */
    public function updateDumpAmount(Request $request, $orderId)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required.',
            ], 401);
        }

        $order = Order::where('id', $orderId)
            ->orWhere('invoice_number', $orderId)
            ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => "Order #{$orderId} not found.",
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'dump_amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $dumpAmount = round((float) $request->input('dump_amount'), 2);

        $order->update([
            'dump_amount' => $dumpAmount,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Dump amount updated to ₹{$dumpAmount} successfully.",
            'dump_amount' => $dumpAmount,
            'order' => $order->fresh(),
        ], 200);
    }

    /**
     * Preview income allocation breakdown for an order and its payments.
     *
     * GET /api/admin/orders/{orderId}/income-allocation
     */
    public function show(Request $request, $orderId)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required to inspect income allocation.',
            ], 401);
        }

        $order = Order::with('payments')
            ->where('id', $orderId)
            ->orWhere('invoice_number', $orderId)
            ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => "Order #{$orderId} not found in database.",
            ], 404);
        }

        if ($order->approval_status !== 'confirmed') {
            return response()->json([
                'status' => 'error',
                'message' => "Order #{$order->invoice_number} cannot be allocated because it is not confirmed (Current Approval Status: '{$order->approval_status}').",
            ], 422);
        }

        try {
            $details = $this->allocationService->getOrderAllocationDetails($order);

            return response()->json([
                'status' => 'success',
                'allocation' => $details,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Confirm and persist income allocation for pending payments of an order (order-level batch).
     *
     * POST /api/admin/orders/{orderId}/income-allocation
     */
    public function allocate(Request $request, $orderId)
    {
        $admin = $this->authenticateAdmin($request);
        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin credentials required to execute income allocation.',
            ], 401);
        }

        $order = Order::with('payments')
            ->where('id', $orderId)
            ->orWhere('invoice_number', $orderId)
            ->first();

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => "Order #{$orderId} not found in database.",
            ], 404);
        }

        if ($order->approval_status !== 'confirmed') {
            return response()->json([
                'status' => 'error',
                'message' => "Order #{$order->invoice_number} cannot be allocated because it is not confirmed (Current Approval Status: '{$order->approval_status}').",
            ], 422);
        }

        // Allocate each pending payment for this order
        $pendingPayments = $order->payments()
            ->where('income_distribution_status', 'pending')
            ->where('admin_commission_cut', '>', 0)
            ->orderBy('id', 'asc')
            ->get();

        if ($pendingPayments->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => "No pending payments eligible for allocation on Order #{$order->id}.",
            ], 422);
        }

        $allocatedPayments = [];
        $totalAllocatedCut = 0.0;

        try {
            foreach ($pendingPayments as $payment) {
                $res = $this->allocationService->allocatePaymentIncome($payment->id, $admin->id);
                $allocatedPayments[] = $res['allocated'];
                $totalAllocatedCut += (float) $res['allocated']['eligible_admin_cut'];
            }

            return response()->json([
                'status' => 'success',
                'message' => "Income allocation of ₹{$totalAllocatedCut} confirmed successfully across {$pendingPayments->count()} payment(s) for Invoice {$order->invoice_number}.",
                'allocated_payments' => $allocatedPayments,
                'total_allocated' => $totalAllocatedCut,
                'order' => $order->fresh(['payments']),
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process income allocation: ' . $e->getMessage(),
            ], 500);
        }
    }
}
