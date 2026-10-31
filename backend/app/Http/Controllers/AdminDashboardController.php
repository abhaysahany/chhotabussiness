<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\SalesRecord;
use App\Models\SalePayment;
use App\Models\UserPayout;
use App\Models\RewardClaim;
use App\Models\SupportTicket;
use App\Models\Product;
use App\Models\Service;
use App\Models\ProductPackage;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    /**
     * Get real-time enterprise metrics and telemetry for Admin Dashboard strictly from MySQL Database.
     */
    public function stats(Request $request)
    {
        // 1. Financial KPIs from MySQL tables
        $totalGmv = (float) SalesRecord::sum('gross_amount');
        $totalPlatformRevenue = (float) SalesRecord::sum('admin_commission_cut');
        $totalUserCommissionsPaid = (float) UserPayout::whereIn('status', ['completed', 'paid'])->sum('net_payable_amount');
        $totalTdsCollected = (float) UserPayout::sum('tds_deduction');

        // 2. Network & Users from MySQL tables
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $newUsersThisMonth = User::where('created_at', '>=', Carbon::now()->startOfMonth())->count();

        $totalProducts = Product::count();
        $totalServices = Service::count();
        $totalPackages = ProductPackage::count();
        $totalCatalogOfferings = $totalProducts + $totalServices + $totalPackages;

        // 3. Operational Queues
        $pendingPayoutsCount = UserPayout::where('status', 'pending')->count();
        $pendingPayoutsAmount = (float) UserPayout::where('status', 'pending')->sum('requested_amount');

        $pendingKycCount = User::whereIn('kyc_status', ['submitted', 'pending', 'under_review'])->count();
        $openSupportTickets = SupportTicket::whereIn('status', ['Open', 'In Progress'])->count();
        $rewardClaimsPending = RewardClaim::where('status', 'pending')->count();

        // 4. Time Range Filter (7d | 30d | 6m | 1y) strictly from Database
        $period = $request->query('period', '7d');

        if ($period === '6m' || $period === '1y') {
            $revenueCategories = [];
            $gmvSeries = [];
            $netRevenueSeries = [];
            $commissionsSeries = [];
            for ($i = 5; $i >= 0; $i--) {
                $m = Carbon::now()->subMonths($i);
                $revenueCategories[] = $m->format('M Y');
                $mStart = $m->copy()->startOfMonth();
                $mEnd = $m->copy()->endOfMonth();
                $gmvSeries[] = (float) SalesRecord::whereBetween('created_at', [$mStart, $mEnd])->sum('gross_amount');
                $netRevenueSeries[] = (float) SalesRecord::whereBetween('created_at', [$mStart, $mEnd])->sum('admin_commission_cut');
                $commissionsSeries[] = (float) UserPayout::whereBetween('created_at', [$mStart, $mEnd])->sum('net_payable_amount');
            }
        } elseif ($period === '30d') {
            $revenueCategories = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            $gmvSeries = [];
            $netRevenueSeries = [];
            $commissionsSeries = [];
            for ($w = 3; $w >= 0; $w--) {
                $wStart = Carbon::now()->subWeeks($w)->startOfWeek();
                $wEnd = Carbon::now()->subWeeks($w)->endOfWeek();
                $gmvSeries[] = (float) SalesRecord::whereBetween('created_at', [$wStart, $wEnd])->sum('gross_amount');
                $netRevenueSeries[] = (float) SalesRecord::whereBetween('created_at', [$wStart, $wEnd])->sum('admin_commission_cut');
                $commissionsSeries[] = (float) UserPayout::whereBetween('created_at', [$wStart, $wEnd])->sum('net_payable_amount');
            }
        } else {
            $revenueCategories = [];
            $gmvSeries = [];
            $netRevenueSeries = [];
            $commissionsSeries = [];
            for ($d = 6; $d >= 0; $d--) {
                $day = Carbon::now()->subDays($d);
                $revenueCategories[] = $day->format('D');
                $dStart = $day->copy()->startOfDay();
                $dEnd = $day->copy()->endOfDay();
                $gmvSeries[] = (float) SalesRecord::whereBetween('created_at', [$dStart, $dEnd])->sum('gross_amount');
                $netRevenueSeries[] = (float) SalesRecord::whereBetween('created_at', [$dStart, $dEnd])->sum('admin_commission_cut');
                $commissionsSeries[] = (float) UserPayout::whereBetween('created_at', [$dStart, $dEnd])->sum('net_payable_amount');
            }
        }

        // 5. Streams Revenue Donut Breakdown
        $directSales = (float) SalesRecord::where('item_type', 'product')->sum('gross_amount');
        $serviceSales = (float) SalesRecord::where('item_type', 'service')->sum('gross_amount');
        $packageSales = (float) SalesRecord::where('item_type', 'package')->sum('gross_amount');
        $generalSales = (float) SalesRecord::whereNotIn('item_type', ['product', 'service', 'package'])->sum('gross_amount');

        $revenueDistribution = [
            'labels' => ['Products', 'Services', 'Packages', 'General'],
            'series' => [
                $totalGmv > 0 ? round(($directSales / $totalGmv) * 100, 1) : 0,
                $totalGmv > 0 ? round(($serviceSales / $totalGmv) * 100, 1) : 0,
                $totalGmv > 0 ? round(($packageSales / $totalGmv) * 100, 1) : 0,
                $totalGmv > 0 ? round(($generalSales / $totalGmv) * 100, 1) : 0,
            ],
            'amounts' => [$directSales, $serviceSales, $packageSales, $generalSales],
        ];

        // 6. Weekly Signup & Affiliate Velocity Bar Chart strictly from MySQL users
        $velocityCategories = [];
        $newUsersData = [];
        $kycVerifiedData = [];
        for ($d = 6; $d >= 0; $d--) {
            $day = Carbon::now()->subDays($d);
            $velocityCategories[] = $day->format('D');
            $dStart = $day->copy()->startOfDay();
            $dEnd = $day->copy()->endOfDay();
            $newUsersData[] = User::whereBetween('created_at', [$dStart, $dEnd])->count();
            $kycVerifiedData[] = User::where('kyc_status', 'approved')->whereBetween('updated_at', [$dStart, $dEnd])->count();
        }
        $velocityBar = [
            'categories' => $velocityCategories,
            'series' => [
                ['name' => 'New Users', 'data' => $newUsersData],
                ['name' => 'KYC Verified', 'data' => $kycVerifiedData],
            ],
        ];

        // 7. Recent Financial Transactions strictly from Database
        $dbSales = SalesRecord::orderBy('id', 'desc')->take(6)->get();
        if ($dbSales->isNotEmpty()) {
            $recentTransactions = $dbSales->map(function ($s) {
                return [
                    'id' => $s->invoice_number ?: ('INV-' . $s->id),
                    'customer' => $s->customer_name ?: 'Customer',
                    'entity' => $s->entity_name ?: 'Merchant Entity',
                    'gross' => (float) $s->gross_amount,
                    'adminFee' => (float) ($s->admin_commission_cut ?: 0),
                    'netEntity' => (float) ($s->net_entity_payout ?: 0),
                    'date' => $s->created_at ? Carbon::parse($s->created_at)->format('d M Y, h:i A') : Carbon::now()->format('d M Y, h:i A'),
                    'status' => $s->status ?: 'completed',
                    'paymentMethod' => $s->payment_method ?: 'Direct Settlement',
                ];
            })->values()->all();
        } else {
            $recentTransactions = [];
        }

        // 8. Live Real-Time Platform Activity Feed strictly from Database Events
        $activityFeed = [];
        foreach ($dbSales->take(4) as $s) {
            $activityFeed[] = [
                'id' => 'sale_' . $s->id,
                'title' => 'Merchant Sale Completed',
                'desc' => ($s->entity_name ?: 'Entity') . ' recorded sale ' . ($s->invoice_number ?: '#' . $s->id) . ' of ₹' . number_format($s->gross_amount, 2) . '.',
                'time' => $s->created_at ? Carbon::parse($s->created_at)->diffForHumans() : 'Recently',
                'type' => 'sale',
            ];
        }

        // 9. Top Performing Affiliates strictly from MySQL Users table
        $dbTopUsers = User::where('commission_balance', '>', 0)
            ->orWhere('bp_balance', '>', 0)
            ->orderBy('commission_balance', 'desc')
            ->take(4)
            ->get();
        if ($dbTopUsers->isNotEmpty()) {
            $colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899'];
            $topAffiliates = $dbTopUsers->map(function ($u, $idx) use ($colors) {
                return [
                    'name' => $u->name ?: 'Affiliate ' . ($idx + 1),
                    'code' => $u->user_code ?: ('CB' . (100010 + $idx)),
                    'rank' => $u->rank ?: 'Member',
                    'earnings' => (float) ($u->commission_balance ?: 0),
                    'volumeBv' => (int) ($u->group_pv ?: ($u->personal_pv ?: 0)),
                    'avatar' => $u->name ? collect(explode(' ', $u->name))->map(fn($n) => $n[0] ?? '')->take(2)->join('') : 'CB',
                    'color' => $colors[$idx % count($colors)],
                ];
            })->values()->all();
        } else {
            $topAffiliates = [];
        }

        return response()->json([
            'status' => 'success',
            'telemetry' => [
                'apiStatus' => 'online',
                'databaseConnected' => true,
                'serverTime' => Carbon::now()->toIso8601String(),
                'version' => '2.4.0-Enterprise',
                'environment' => config('app.env', 'production'),
            ],
            'kpis' => [
                'totalGmv' => $totalGmv,
                'totalPlatformRevenue' => $totalPlatformRevenue,
                'totalCommissionsPaid' => $totalUserCommissionsPaid,
                'totalTdsCollected' => $totalTdsCollected,
                'totalUsers' => $totalUsers,
                'activeUsers' => $activeUsers,
                'newUsersThisMonth' => $newUsersThisMonth,
                'totalCatalogOfferings' => $totalCatalogOfferings,
                'pendingPayoutsCount' => $pendingPayoutsCount,
                'pendingPayoutsAmount' => $pendingPayoutsAmount,
                'pendingKycCount' => $pendingKycCount,
                'openSupportTickets' => $openSupportTickets,
                'rewardClaimsPending' => $rewardClaimsPending,
            ],
            'charts' => [
                'revenueCategories' => $revenueCategories,
                'gmvSeries' => $gmvSeries,
                'netRevenueSeries' => $netRevenueSeries,
                'commissionsSeries' => $commissionsSeries,
                'revenueDistribution' => $revenueDistribution,
                'velocityBar' => $velocityBar,
            ],
            'recentTransactions' => $recentTransactions,
            'activityFeed' => $activityFeed,
            'topAffiliates' => $topAffiliates,
        ]);
    }
}