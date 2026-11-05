<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\SalePayment;

$order = Order::latest('id')->first();
$arr = $order->toArray();
echo "ORDER toArray():" . PHP_EOL;
echo "  created_at: " . ($arr['created_at'] ?? 'null') . PHP_EOL;
echo "  admin_confirmed_at: " . ($arr['admin_confirmed_at'] ?? 'null') . PHP_EOL;
echo "  income_distributed_at: " . ($arr['income_distributed_at'] ?? 'null') . PHP_EOL;

$payment = SalePayment::latest('id')->first();
$parr = $payment->toArray();
echo "SALE_PAYMENT toArray():" . PHP_EOL;
echo "  created_at: " . ($parr['created_at'] ?? 'null') . PHP_EOL;
echo "  payment_date: " . ($parr['payment_date'] ?? 'null') . PHP_EOL;
echo "  income_distributed_at: " . ($parr['income_distributed_at'] ?? 'null') . PHP_EOL;

$dump = \App\Models\OrderPaymentDump::latest('id')->first();
if ($dump) {
    $darr = $dump->toArray();
    echo "DUMP toArray():" . PHP_EOL;
    echo "  created_at: " . ($darr['created_at'] ?? 'null') . PHP_EOL;
    echo "  requested_at: " . ($darr['requested_at'] ?? 'null') . PHP_EOL;
    echo "  approved_at: " . ($darr['approved_at'] ?? 'null') . PHP_EOL;
}
