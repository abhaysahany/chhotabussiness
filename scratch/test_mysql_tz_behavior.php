<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Query order 702 created_at and sale_payment 809 payment_date with different session timezones
echo "=== CURRENT SESSION TIMEZONE ===" . PHP_EOL;
$res1 = DB::select("SELECT @@session.time_zone as tz, created_at FROM orders WHERE id = 702");
echo "Under session tz " . $res1[0]->tz . ": orders.created_at = " . $res1[0]->created_at . PHP_EOL;

$res1p = DB::select("SELECT @@session.time_zone as tz, payment_date FROM sale_payments WHERE id = 809");
echo "Under session tz " . $res1p[0]->tz . ": sale_payments.payment_date = " . $res1p[0]->payment_date . PHP_EOL;

echo PHP_EOL . "=== SWITCH SESSION TIMEZONE TO '+00:00' (UTC) ===" . PHP_EOL;
DB::statement("SET time_zone = '+00:00'");
$res2 = DB::select("SELECT @@session.time_zone as tz, created_at FROM orders WHERE id = 702");
echo "Under session tz " . $res2[0]->tz . ": orders.created_at = " . $res2[0]->created_at . PHP_EOL;

$res2p = DB::select("SELECT @@session.time_zone as tz, payment_date FROM sale_payments WHERE id = 809");
echo "Under session tz " . $res2p[0]->tz . ": sale_payments.payment_date = " . $res2p[0]->payment_date . PHP_EOL;

echo PHP_EOL . "=== SWITCH SESSION TIMEZONE TO '+05:30' (IST) ===" . PHP_EOL;
DB::statement("SET time_zone = '+05:30'");
$res3 = DB::select("SELECT @@session.time_zone as tz, created_at FROM orders WHERE id = 702");
echo "Under session tz " . $res3[0]->tz . ": orders.created_at = " . $res3[0]->created_at . PHP_EOL;

$res3p = DB::select("SELECT @@session.time_zone as tz, payment_date FROM sale_payments WHERE id = 809");
echo "Under session tz " . $res3p[0]->tz . ": sale_payments.payment_date = " . $res3p[0]->payment_date . PHP_EOL;
