<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== TIMEZONE VERIFICATION SUITE ===" . PHP_EOL;

// 1. App config
$appTz = config('app.timezone');
echo "1. config('app.timezone'): " . $appTz . ($appTz === 'Asia/Kolkata' ? " [PASS]" : " [FAIL]") . PHP_EOL;

// 2. DB config
$dbTz = config('database.connections.mysql.timezone');
echo "2. config('database.connections.mysql.timezone'): " . $dbTz . ($dbTz === '+05:30' ? " [PASS]" : " [FAIL]") . PHP_EOL;

// 3. Carbon now
$now = Carbon::now();
$tzName = $now->timezoneName;
$offset = $now->format('P');
echo "3. Carbon::now(): " . $now->toDateTimeString() . " | TZ: " . $tzName . " | Offset: " . $offset . (($tzName === 'Asia/Kolkata' && $offset === '+05:30') ? " [PASS]" : " [FAIL]") . PHP_EOL;

// 4. DB Session Timezone
$dbSessionTz = DB::selectOne("SELECT @@session.time_zone as tz")->tz;
echo "4. DB session.time_zone: " . $dbSessionTz . ($dbSessionTz === '+05:30' ? " [PASS]" : " [FAIL]") . PHP_EOL;

// 5. DB NOW() vs UTC_TIMESTAMP()
$times = DB::selectOne("SELECT NOW() as db_now, UTC_TIMESTAMP() as db_utc");
echo "5. DB NOW(): " . $times->db_now . " | DB UTC_TIMESTAMP(): " . $times->db_utc . PHP_EOL;

$dbNowTime = strtotime($times->db_now);
$dbUtcTime = strtotime($times->db_utc);
$diffHours = ($dbNowTime - $dbUtcTime) / 3600;
echo "   Offset between DB NOW() and UTC: " . $diffHours . " hours" . ($diffHours == 5.5 ? " [PASS]" : " [FAIL]") . PHP_EOL;

// 6. DB vs PHP clock delta
$phpTime = time();
$delta = abs($dbNowTime - $phpTime);
echo "6. Clock delta between DB NOW() and PHP time(): " . $delta . "s" . ($delta <= 2 ? " [PASS]" : " [WARN]") . PHP_EOL;

// 7. Verify Date Cast on Models
$order = \App\Models\Order::latest('id')->first();
if ($order) {
    echo "7. Sample Order #{$order->id}:" . PHP_EOL;
    echo "   order->date: " . (is_object($order->date) ? $order->date->toIso8601String() : $order->date) . PHP_EOL;
    echo "   order->created_at: " . ($order->created_at ? $order->created_at->toIso8601String() : 'N/A') . PHP_EOL;
}

echo "=== ALL CHECKS COMPLETED ===" . PHP_EOL;
