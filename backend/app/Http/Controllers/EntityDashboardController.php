<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SalesRecord;
use App\Models\SalePayment;
use App\Models\BusinessEntity;
use App\Models\Product;
use App\Models\Service;
use App\Models\ProductPackage;
use Carbon\Carbon;

class EntityDashboardController extends Controller
{
    /**
     * Get real-time enterprise aggregated SaaS metrics and analytics for Entity Panel strictly from MySQL Database.
     */
    public function getDashboardStats(Request $request)
    {
        // Filter by entity if provided
        $entityCode = $request->input('entity_code') ?? $request->query('entity_code');
        $salesQuery = SalesRecord::query();
        if ($entityCode && $entityCode !== 'all' && $entityCode !== 'undefined') {
            $salesQuery->where(function ($q) use ($entityCode) {
                if (is_numeric($entityCode)) {
                    $q->where('entity_id', $entityCode);
                }
                $q->orWhere('entity_name', $entityCode);
            });
        }

        // 1. Financial & Volume Aggregations strictly from database
        $totalGrossSales = (float) (clone $salesQuery)->sum('gross_amount');
        $totalNetEarnings = (float) (clone $salesQuery)->sum('net_entity_payout');
        $totalBalanceDue = (float) (clone $salesQuery)->sum('balance_due');
        $totalPlatformFeePaid = (float) (clone $salesQuery)->sum('admin_commission_cut');
        $totalInvoicesCount = (clone $salesQuery)->count();

        $totalProducts = Product::count();
        $totalServices = Service::count();
        $totalPackages = ProductPackage::count();
        $totalCatalogOfferings = $totalProducts + $totalServices + $totalPackages;

        // 2. Timeline period filter (7d | 30d | 6m) strictly aggregated from database
        $period = $request->query('period', '7d');

        if ($period === '6m') {
            $categories = [];
            $grossSeries = [];
            $netSeries = [];
            $balanceSeries = [];
            for ($i = 5; $i >= 0; $i--) {
                $m = Carbon::now()->subMonths($i);
                $categories[] = $m->format('M Y');
                $mStart = $m->copy()->startOfMonth();
                $mEnd = $m->copy()->endOfMonth();
                $grossSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$mStart, $mEnd])->sum('gross_amount');
                $netSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$mStart, $mEnd])->sum('net_entity_payout');
                $balanceSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$mStart, $mEnd])->sum('balance_due');
            }
        } elseif ($period === '30d') {
            $categories = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            $grossSeries = [];
            $netSeries = [];
            $balanceSeries = [];
            for ($w = 3; $w >= 0; $w--) {
                $wStart = Carbon::now()->subWeeks($w)->startOfWeek();
                $wEnd = Carbon::now()->subWeeks($w)->endOfWeek();
                $grossSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$wStart, $wEnd])->sum('gross_amount');
                $netSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$wStart, $wEnd])->sum('net_entity_payout');
                $balanceSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$wStart, $wEnd])->sum('balance_due');
            }
        } else {
            $categories = [];
            $grossSeries = [];
            $netSeries = [];
            $balanceSeries = [];
            for ($d = 6; $d >= 0; $d--) {
                $day = Carbon::now()->subDays($d);
                $categories[] = $day->format('D');
                $dStart = $day->copy()->startOfDay();
                $dEnd = $day->copy()->endOfDay();
                $grossSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$dStart, $dEnd])->sum('gross_amount');
                $netSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$dStart, $dEnd])->sum('net_entity_payout');
                $balanceSeries[] = (float) (clone $salesQuery)->whereBetween('created_at', [$dStart, $dEnd])->sum('balance_due');
            }
        }

        // 3. Offering Revenue Mix Donut Chart strictly from database
        $prodSales = (float) (clone $salesQuery)->where('item_type', 'product')->sum('gross_amount');
        $srvSales = (float) (clone $salesQuery)->where('item_type', 'service')->sum('gross_amount');
        $pkgSales = (float) (clone $salesQuery)->where('item_type', 'package')->sum('gross_amount');
        $othSales = (float) (clone $salesQuery)->whereNotIn('item_type', ['product', 'service', 'package'])->sum('gross_amount');

        $revenueMix = [
            'labels' => ['Products', 'Services', 'Packages', 'General'],
            'series' => [
                $totalGrossSales > 0 ? round(($prodSales / $totalGrossSales) * 100, 1) : 0,
                $totalGrossSales > 0 ? round(($srvSales / $totalGrossSales) * 100, 1) : 0,
                $totalGrossSales > 0 ? round(($pkgSales / $totalGrossSales) * 100, 1) : 0,
                $totalGrossSales > 0 ? round(($othSales / $totalGrossSales) * 100, 1) : 0,
            ],
            'amounts' => [$prodSales, $srvSales, $pkgSales, $othSales],
        ];

        // 4. Sales Conversion Velocity Bar Chart strictly from database
        $velocityDays = [];
        $paidInvoicesSeries = [];
        $partialInvoicesSeries = [];
        for ($d = 6; $d >= 0; $d--) {
            $day = Carbon::now()->subDays($d);
            $velocityDays[] = $day->format('D');
            $dStart = $day->copy()->startOfDay();
            $dEnd = $day->copy()->endOfDay();
            $paidInvoicesSeries[] = (clone $salesQuery)->whereBetween('created_at', [$dStart, $dEnd])->where('balance_due', '<=', 0)->count();
            $partialInvoicesSeries[] = (clone $salesQuery)->whereBetween('created_at', [$dStart, $dEnd])->where('balance_due', '>', 0)->count();
        }

        $velocityBar = [
            'categories' => $velocityDays,
            'series' => [
                ['name' => 'Paid Invoices', 'data' => $paidInvoicesSeries],
                ['name' => 'Partial / Advance', 'data' => $partialInvoicesSeries],
            ],
        ];

        // 5. Recent Merchant Invoices from Database
        $dbSales = (clone $salesQuery)->orderBy('id', 'desc')->take(6)->get();
        if ($dbSales->isNotEmpty()) {
            $recentInvoices = $dbSales->map(function ($s) {
                return [
                    'id' => $s->invoice_number ?: ('INV-' . $s->id),
                    'customer' => $s->customer_name ?: 'Client Corporation',
                    'item' => $s->item ?: ($s->entity_name ?: 'Enterprise Project Services'),
                    'gross' => (float) $s->gross_amount,
                    'adminCut' => (float) ($s->admin_commission_cut ?: 0),
                    'netPayout' => (float) ($s->net_entity_payout ?: 0),
                    'advance' => (float) ($s->advance_payment ?: $s->gross_amount),
                    'balanceDue' => (float) ($s->balance_due ?: 0),
                    'date' => $s->created_at ? Carbon::parse($s->created_at)->format('d M Y, h:i A') : Carbon::now()->format('d M Y, h:i A'),
                    'status' => $s->status ?: 'completed',
                    'paymentMethod' => $s->payment_method ?: 'Direct Settlement',
                ];
            })->values()->all();
        } else {
            $recentInvoices = [];
        }

        // 6. Real-time Live Merchant Activity Feed strictly from Database
        if ($dbSales->isNotEmpty()) {
            $activityFeed = $dbSales->map(function ($s) {
                $statusText = $s->balance_due > 0 ? 'Partial Payment Recorded' : 'Invoice Payment Settled';
                return [
                    'id' => $s->id,
                    'title' => $statusText,
                    'desc' => ($s->invoice_number ?: 'Invoice #' . $s->id) . ' for ' . ($s->customer_name ?: 'Client') . ' (₹' . number_format($s->gross_amount, 2) . ' GMV).',
                    'time' => $s->created_at ? Carbon::parse($s->created_at)->diffForHumans() : 'Recently',
                    'type' => $s->balance_due > 0 ? 'reminder' : 'settlement',
                ];
            })->values()->all();
        } else {
            $activityFeed = [];
        }

        return response()->json([
            'status' => 'success',
            'telemetry' => [
                'apiStatus' => 'online',
                'databaseConnected' => true,
                'serverTime' => Carbon::now()->toIso8601String(),
                'version' => '2.4.0-Merchant',
            ],
            'kpis' => [
                'totalGrossSales' => $totalGrossSales,
                'totalNetEarnings' => $totalNetEarnings,
                'totalBalanceDue' => $totalBalanceDue,
                'totalPlatformFeePaid' => $totalPlatformFeePaid,
                'totalInvoicesCount' => $totalInvoicesCount,
                'totalCatalogOfferings' => $totalCatalogOfferings,
            ],
            'charts' => [
                'categories' => $categories,
                'grossSeries' => $grossSeries,
                'netSeries' => $netSeries,
                'balanceSeries' => $balanceSeries,
                'revenueMix' => $revenueMix,
                'velocityBar' => $velocityBar,
            ],
            'recentInvoices' => $recentInvoices,
            'activityFeed' => $activityFeed,
        ]);
    }
}