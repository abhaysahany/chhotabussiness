<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;
use App\Models\UserPayout;
use App\Models\DirectIncome;
use App\Models\LevelIncome;

$results = [
    'timestamp' => Carbon::now()->toIso8601String(),
    'tests' => [],
    'financial_integrity' => [],
];

// 1. Application Timezone
$appTz = config('app.timezone');
$phpTz = date_default_timezone_get();
$results['tests']['app_timezone'] = [
    'config_app_timezone' => $appTz,
    'php_default_timezone' => $phpTz,
    'status' => ($appTz === 'UTC' && $phpTz === 'UTC') ? 'PASS' : 'FAIL',
];

// 2. Database Session Timezone
$dbTzConfig = config('database.connections.mysql.timezone');
$dbSessionTz = DB::select("SELECT @@session.time_zone as tz")[0]->tz;
$dbGlobalTz = DB::select("SELECT @@global.time_zone as tz")[0]->tz;
$nowVsUtc = DB::select("SELECT NOW() as db_now, UTC_TIMESTAMP() as db_utc")[0];
$results['tests']['db_session_timezone'] = [
    'config_mysql_timezone' => $dbTzConfig,
    'session_time_zone' => $dbSessionTz,
    'global_time_zone' => $dbGlobalTz,
    'db_now' => $nowVsUtc->db_now,
    'db_utc' => $nowVsUtc->db_utc,
    'in_sync' => ($nowVsUtc->db_now === $nowVsUtc->db_utc),
    'status' => ($dbSessionTz === '+00:00' && $nowVsUtc->db_now === $nowVsUtc->db_utc) ? 'PASS' : 'FAIL',
];

// 3. Order Date Simulation (00:00 - 05:30 IST window)
$simulations = [
    '12:30 AM IST (Prev day 19:00 UTC)' => '2026-11-04 19:00:00',
    '01:30 AM IST (Prev day 20:00 UTC)' => '2026-11-04 20:00:00',
    '05:29 AM IST (Prev day 23:59 UTC)' => '2026-11-04 23:59:00',
    '05:30 AM IST (Same day 00:00 UTC)' => '2026-11-05 00:00:00',
];
$simResults = [];
$allSimPass = true;
foreach ($simulations as $label => $utcTime) {
    Carbon::setTestNow(Carbon::parse($utcTime, 'UTC'));
    $computedDate = Carbon::now('Asia/Kolkata')->toDateString();
    $expectedDate = '2026-11-05';
    $passed = ($computedDate === $expectedDate);
    if (!$passed) $allSimPass = false;
    $simResults[$label] = [
        'utc_test_now' => Carbon::now('UTC')->toIso8601String(),
        'ist_time' => Carbon::now('Asia/Kolkata')->toIso8601String(),
        'computed_order_date' => $computedDate,
        'expected' => $expectedDate,
        'pass' => $passed,
    ];
}
Carbon::setTestNow(); // reset
$results['tests']['order_date_simulations'] = [
    'results' => $simResults,
    'status' => $allSimPass ? 'PASS' : 'FAIL',
];

// 4. Order Model Serialization (Order 702)
$order702 = Order::find(702);
if ($order702) {
    $orderArray = $order702->toArray();
    $orderJson = json_decode(json_encode($order702), true);
    
    $createdHasZ = str_ends_with($orderJson['created_at'] ?? '', 'Z');
    $confirmedHasZ = str_ends_with($orderJson['admin_confirmed_at'] ?? '', 'Z');
    $incomeHasZ = str_ends_with($orderJson['income_distributed_at'] ?? '', 'Z');
    $dateIsDateOnly = (preg_match('/^\d{4}-\d{2}-\d{2}$/', $orderJson['date'] ?? '') === 1);
    
    // Check timeline order
    $createdTs = strtotime($orderJson['created_at']);
    $confirmedTs = strtotime($orderJson['admin_confirmed_at']);
    $timelineValid = ($createdTs <= $confirmedTs);
    
    $results['tests']['order_serialization'] = [
        'order_id' => 702,
        'created_at' => $orderJson['created_at'] ?? null,
        'created_at_has_Z' => $createdHasZ,
        'admin_confirmed_at' => $orderJson['admin_confirmed_at'] ?? null,
        'admin_confirmed_at_has_Z' => $confirmedHasZ,
        'income_distributed_at' => $orderJson['income_distributed_at'] ?? null,
        'income_distributed_at_has_Z' => $incomeHasZ,
        'date' => $orderJson['date'] ?? null,
        'date_is_YYYY_MM_DD' => $dateIsDateOnly,
        'timeline_chronological' => $timelineValid,
        'status' => ($createdHasZ && $confirmedHasZ && $incomeHasZ && $dateIsDateOnly && $timelineValid) ? 'PASS' : 'FAIL',
    ];
} else {
    $results['tests']['order_serialization'] = ['status' => 'SKIPPED_NOT_FOUND'];
}

// 5. Sale Payment Model Serialization (Payment 809)
$pay809 = SalePayment::find(809);
if ($pay809) {
    $payJson = json_decode(json_encode($pay809), true);
    $payDateHasZ = str_ends_with($payJson['payment_date'] ?? '', 'Z');
    $incomeHasZ = str_ends_with($payJson['income_distributed_at'] ?? '', 'Z');
    
    $results['tests']['salepayment_serialization'] = [
        'payment_id' => 809,
        'payment_date' => $payJson['payment_date'] ?? null,
        'payment_date_has_Z' => $payDateHasZ,
        'income_distributed_at' => $payJson['income_distributed_at'] ?? null,
        'income_distributed_at_has_Z' => $incomeHasZ,
        'status' => ($payDateHasZ && $incomeHasZ) ? 'PASS' : 'FAIL',
    ];
} else {
    $results['tests']['salepayment_serialization'] = ['status' => 'SKIPPED_NOT_FOUND'];
}

// 6. User Model KYC Serialization
$sampleUser = User::first();
if ($sampleUser) {
    // temporarily mock timestamps on user if empty
    $sampleUser->kyc_submitted_at = $sampleUser->kyc_submitted_at ?: '2026-11-03 10:00:00';
    $sampleUser->kyc_verified_at = $sampleUser->kyc_verified_at ?: '2026-11-03 12:00:00';
    $userJson = json_decode(json_encode($sampleUser), true);
    
    $subHasZ = str_ends_with($userJson['kyc_submitted_at'] ?? '', 'Z');
    $verHasZ = str_ends_with($userJson['kyc_verified_at'] ?? '', 'Z');
    
    $results['tests']['user_kyc_serialization'] = [
        'user_id' => $sampleUser->id,
        'kyc_submitted_at' => $userJson['kyc_submitted_at'] ?? null,
        'kyc_submitted_at_has_Z' => $subHasZ,
        'kyc_verified_at' => $userJson['kyc_verified_at'] ?? null,
        'kyc_verified_at_has_Z' => $verHasZ,
        'status' => ($subHasZ && $verHasZ) ? 'PASS' : 'FAIL',
    ];
}

// 7. User Income "Today" Logic
// Simulate time: 2026-11-05 02:00:00 IST (2026-11-04 20:30:00 UTC)
Carbon::setTestNow(Carbon::parse('2026-11-04 20:30:00', 'UTC'));
$testRecords = collect([
    (object)['id' => 1, 'created_at' => '2026-11-04 20:00:00', 'total_amount' => 100.0], // 01:30 AM IST today -> MUST be counted
    (object)['id' => 2, 'created_at' => '2026-11-04 17:30:00', 'total_amount' => 200.0], // 11:00 PM IST yesterday -> MUST NOT be counted
    (object)['id' => 3, 'created_at' => '2026-11-04 21:00:00', 'total_amount' => 50.0],  // 02:30 AM IST today -> MUST be counted
]);

$computedTodayAmount = (float) $testRecords->filter(function ($rec) {
    return $rec->created_at && Carbon::parse($rec->created_at)->setTimezone('Asia/Kolkata')->isToday();
})->sum('total_amount');

$expectedTodayAmount = 150.0;
Carbon::setTestNow(); // reset
$results['tests']['user_income_today_calculation'] = [
    'test_now_ist' => '2026-11-05 02:00:00 IST',
    'computed_today_amount' => $computedTodayAmount,
    'expected_today_amount' => $expectedTodayAmount,
    'status' => ($computedTodayAmount === $expectedTodayAmount) ? 'PASS' : 'FAIL',
];

// 8. User Payout Formatting & Preset Filtering
$samplePayout = UserPayout::first();
if ($samplePayout) {
    $payoutJson = json_decode(json_encode($samplePayout), true);
    $reqDateHasZ = str_ends_with($payoutJson['request_date'] ?? '', 'Z');
    
    $results['tests']['user_payout_serialization'] = [
        'payout_id' => $samplePayout->id,
        'request_date' => $payoutJson['request_date'] ?? null,
        'request_date_has_Z' => $reqDateHasZ,
        'status' => $reqDateHasZ ? 'PASS' : 'FAIL',
    ];
} else {
    $results['tests']['user_payout_serialization'] = ['status' => 'SKIPPED_NO_PAYOUTS'];
}

// 9. Financial Regression Audit
$results['financial_integrity'] = [
    'total_orders' => Order::count(),
    'gross_amount_sum' => round((float) Order::sum('gross_amount'), 2),
    'advance_payment_sum' => round((float) Order::sum('advance_payment'), 2),
    'balance_due_sum' => round((float) Order::sum('balance_due'), 2),
    'admin_commission_cut_sum' => round((float) Order::sum('admin_commission_cut'), 2),
    'dump_amount_sum' => round((float) Order::sum('dump_amount'), 2),
    'total_sale_payments' => SalePayment::count(),
    'sale_payments_amount_sum' => round((float) SalePayment::sum('amount'), 2),
    'sale_payments_admin_cut_sum' => round((float) SalePayment::sum('admin_commission_cut'), 2),
    'direct_incomes_total_sum' => round((float) DirectIncome::sum('total_amount'), 2),
    'level_incomes_total_sum' => round((float) LevelIncome::sum('total_amount'), 2),
];

echo json_encode($results, JSON_PRETTY_PRINT);
