<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$order = DB::table('orders')->where('id', 702)->first();
echo "ORDER 702:" . PHP_EOL . json_encode($order, JSON_PRETTY_PRINT) . PHP_EOL;

$payments = DB::table('sale_payments')->where('order_id', 702)->get();
echo "PAYMENTS FOR ORDER 702:" . PHP_EOL . json_encode($payments, JSON_PRETTY_PRINT) . PHP_EOL;

$dumps = DB::table('order_payment_dumps')->where('order_id', 702)->get();
echo "DUMPS FOR ORDER 702:" . PHP_EOL . json_encode($dumps, JSON_PRETTY_PRINT) . PHP_EOL;
