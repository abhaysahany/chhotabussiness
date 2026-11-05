<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "APP_TIMEZONE config: " . config('app.timezone') . PHP_EOL;
echo "DB_TIMEZONE config: " . config('database.connections.mysql.timezone') . PHP_EOL;
echo "date_default_timezone_get(): " . date_default_timezone_get() . PHP_EOL;
echo "now(): " . now()->toIso8601String() . PHP_EOL;

$res = DB::select("SELECT @@global.time_zone AS global_tz, @@session.time_zone AS session_tz, NOW() AS db_now, UTC_TIMESTAMP() AS db_utc_now");
echo json_encode($res[0], JSON_PRETTY_PRINT) . PHP_EOL;
