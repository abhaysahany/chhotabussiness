<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;

$order = Order::find(702);
$orderArr = $order->toArray();
echo "ORDER 702:" . PHP_EOL;
echo "  date: " . $orderArr['date'] . PHP_EOL;
echo "  created_at: " . $orderArr['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . ($orderArr['admin_confirmed_at'] ?? 'null') . PHP_EOL;
echo "  adminConfirmedAt: " . ($orderArr['adminConfirmedAt'] ?? 'null') . PHP_EOL;
echo "  income_distributed_at: " . ($orderArr['income_distributed_at'] ?? 'null') . PHP_EOL;
echo "  incomeDistributedAt: " . ($orderArr['incomeDistributedAt'] ?? 'null') . PHP_EOL;

$json = json_decode(json_encode($order), true);
echo PHP_EOL . "ORDER 702 json_encode():" . PHP_EOL;
echo "  created_at: " . $json['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . ($json['admin_confirmed_at'] ?? 'null') . PHP_EOL;
echo "  adminConfirmedAt: " . ($json['adminConfirmedAt'] ?? 'null') . PHP_EOL;
