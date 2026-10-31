<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\UserPayout;
use App\Models\SalesRecord;
use App\Models\SalePayment;
use Carbon\Carbon;

class EntityPayoutController extends Controller
{
    /**
     * Get entity payout transactions and financial summary.
     */
    public function index(Request $request)
    {
        $entityName = $request->query('entity', 'Skyline Technologies Pvt Ltd');
        $status = $request->query('status', 'all');
        $method = $request->query('payment_method', 'all');
        $search = $request->query('search', '');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Query database payouts
        $payoutsQuery = UserPayout::query();

        if ($status !== 'all' && !empty($status)) {
            $payoutsQuery->where('status', $status);
        }

        if ($method !== 'all' && !empty($method)) {
            $payoutsQuery->where('payment_method', 'like', '%' . $method . '%');
        }

        if (!empty($startDate)) {
            $payoutsQuery->whereDate('request_date', '>=', Carbon::parse($startDate));
        }

        if (!empty($endDate)) {
            $payoutsQuery->whereDate('request_date', '<=', Carbon::parse($endDate));
        }

        if (!empty($search)) {
            $search = '%' . trim($search) . '%';
            $payoutsQuery->where(function ($q) use ($search) {
                $q->where('payout_code', 'like', $search)
                  ->orWhere('member_name', 'like', $search)
                  ->orWhere('utr_number', 'like', $search)
                  ->orWhere('bank_name', 'like', $search)
                  ->orWhere('account_number', 'like', $search)
                  ->orWhere('upi_id', 'like', $search)
                  ->orWhere('admin_notes', 'like', $search);
            });
        }

        $dbPayouts = $payoutsQuery->orderBy('request_date', 'desc')->orderBy('id', 'desc')->get();

        $allPayouts = $dbPayouts->map(function ($p, $idx) use ($entityName) {
            $dumpAmount = ($p->status === 'pending' || $p->status === 'dumped') ? (float)$p->requested_amount * 0.15 : 0;
            return [
                'id' => $p->id,
                'payoutCode' => $p->payout_code,
                'payout_code' => $p->payout_code,
                'entityName' => $entityName,
                'entity_name' => $entityName,
                'beneficiaryName' => $p->account_holder_name ?: $p->member_name ?: $entityName,
                'beneficiary_name' => $p->account_holder_name ?: $p->member_name ?: $entityName,
                'requestedAmount' => (float)$p->requested_amount,
                'requested_amount' => (float)$p->requested_amount,
                'grossAmount' => (float)$p->requested_amount,
                'gross_amount' => (float)$p->requested_amount,
                'tdsRate' => (float)($p->tds_rate ?: 5.0),
                'tds_rate' => (float)($p->tds_rate ?: 5.0),
                'tdsDeduction' => (float)$p->tds_deduction,
                'tds_deduction' => (float)$p->tds_deduction,
                'adminProcessingFee' => (float)($p->admin_processing_fee ?: 0),
                'admin_processing_fee' => (float)($p->admin_processing_fee ?: 0),
                'netPayableAmount' => (float)$p->net_payable_amount,
                'net_payable_amount' => (float)$p->net_payable_amount,
                'dumpAmount' => $dumpAmount,
                'dump_amount' => $dumpAmount,
                'balanceAfter' => (float)($p->wallet_balance_before - $p->requested_amount),
                'balance_after' => (float)($p->wallet_balance_before - $p->requested_amount),
                'paymentMethod' => $p->payment_method ?: 'Bank Transfer (NEFT)',
                'payment_method' => $p->payment_method ?: 'Bank Transfer (NEFT)',
                'bankName' => $p->bank_name ?: '',
                'bank_name' => $p->bank_name ?: '',
                'accountNumber' => $p->account_number ?: '',
                'account_number' => $p->account_number ?: '',
                'ifscCode' => $p->ifsc_code ?: '',
                'ifsc_code' => $p->ifsc_code ?: '',
                'upiId' => $p->upi_id ?: '',
                'upi_id' => $p->upi_id ?: '',
                'status' => $p->status === 'completed' ? 'paid' : $p->status,
                'requestDate' => $p->request_date ? Carbon::parse($p->request_date)->format('Y-m-d H:i:s') : ($p->created_at ? $p->created_at->format('Y-m-d H:i:s') : Carbon::now()->format('Y-m-d H:i:s')),
                'request_date' => $p->request_date ? Carbon::parse($p->request_date)->format('Y-m-d H:i:s') : ($p->created_at ? $p->created_at->format('Y-m-d H:i:s') : Carbon::now()->format('Y-m-d H:i:s')),
                'processedDate' => $p->processed_date ? Carbon::parse($p->processed_date)->format('Y-m-d H:i:s') : null,
                'processed_date' => $p->processed_date ? Carbon::parse($p->processed_date)->format('Y-m-d H:i:s') : null,
                'utrNumber' => $p->utr_number,
                'utr_number' => $p->utr_number,
                'notes' => $p->admin_notes ?: 'Entity Settlement Cycle Disbursal',
            ];
        });

        $allPayoutsList = $allPayouts->values();

        // Calculate Totals strictly from real records
        $totalPaid = $allPayoutsList->whereIn('status', ['paid', 'completed'])->sum(fn($i) => (float)$i['net_payable_amount']);
        $totalBalance = (float) SalesRecord::where(function ($q) use ($entityName) {
            $q->where('entity_name', $entityName)->orWhere('entity_type', 'business');
        })->sum('balance_due');
        $totalDump = $allPayoutsList->sum(fn($i) => (float)$i['dump_amount']);
        $totalTds = $allPayoutsList->whereIn('status', ['paid', 'completed'])->sum(fn($i) => (float)$i['tds_deduction']);
        $totalGross = $allPayoutsList->sum(fn($i) => (float)$i['gross_amount']);

        return response()->json([
            'status' => 'success',
            'summary' => [
                'total_paid' => round($totalPaid, 2),
                'balance' => round($totalBalance, 2),
                'dump_amount' => round($totalDump, 2),
                'total_tds' => round($totalTds, 2),
                'total_gross' => round($totalGross, 2),
                'total_transactions' => $allPayoutsList->count(),
            ],
            'payouts' => $allPayoutsList,
        ]);
    }

    /**
     * Get entity payout reports and periodic analytics.
     */
    public function reports(Request $request)
    {
        $entityName = $request->query('entity', 'Skyline Technologies Pvt Ltd');
        $period = $request->query('period', 'monthly'); // monthly, quarterly, yearly

        $payoutsResponse = $this->index($request);
        $data = json_decode($payoutsResponse->getContent(), true);

        $summary = $data['summary'] ?? [];
        $payouts = collect($data['payouts'] ?? []);

        if ($payouts->isEmpty()) {
            return response()->json([
                'status' => 'success',
                'summary' => array_merge($summary, [
                    'settlement_success_rate' => 100.0,
                    'active_settlement_accounts' => 0,
                ]),
                'monthly_trend' => [],
                'method_distribution' => [],
                'status_distribution' => [],
                'statement_rows' => [],
            ]);
        }

        // Real Monthly Breakdown Chart Data
        $monthlyGroups = $payouts->groupBy(function ($p) {
            return Carbon::parse($p['request_date'])->format('M Y');
        });

        $monthlyTrend = [];
        foreach ($monthlyGroups as $month => $items) {
            $monthlyTrend[] = [
                'month' => $month,
                'paid' => (float)$items->whereIn('status', ['paid', 'completed'])->sum('net_payable_amount'),
                'dump' => (float)$items->sum('dump_amount'),
                'balance' => (float)$items->sum('balance_after'),
                'count' => $items->count(),
            ];
        }

        // Real Payment Method Distribution
        $methodGroups = $payouts->groupBy('payment_method');
        $palette = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
        $mIdx = 0;
        $totalAmt = (float)$payouts->sum('gross_amount');
        $methodDistribution = [];
        foreach ($methodGroups as $method => $items) {
            $mAmt = (float)$items->sum('gross_amount');
            $methodDistribution[] = [
                'method' => $method,
                'amount' => $mAmt,
                'percentage' => $totalAmt > 0 ? round(($mAmt / $totalAmt) * 100, 1) : 0,
                'count' => $items->count(),
                'color' => $palette[$mIdx++ % count($palette)],
            ];
        }

        // Real Status Distribution
        $statusGroups = $payouts->groupBy('status');
        $statusColors = ['paid' => '#10b981', 'completed' => '#10b981', 'pending' => '#f59e0b', 'dumped' => '#6366f1'];
        $statusDistribution = [];
        foreach ($statusGroups as $status => $items) {
            $sAmt = (float)$items->sum('gross_amount');
            $statusDistribution[] = [
                'status' => ucfirst($status),
                'amount' => $sAmt,
                'percentage' => $totalAmt > 0 ? round(($sAmt / $totalAmt) * 100, 1) : 0,
                'color' => $statusColors[strtolower($status)] ?? '#64748b',
            ];
        }

        return response()->json([
            'status' => 'success',
            'summary' => array_merge($summary, [
                'settlement_success_rate' => 100.0,
                'active_settlement_accounts' => $methodGroups->count(),
            ]),
            'monthly_trend' => $monthlyTrend,
            'method_distribution' => $methodDistribution,
            'status_distribution' => $statusDistribution,
            'statement_rows' => [],
        ]);
    }

}
