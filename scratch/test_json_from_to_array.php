<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

$order = Order::find(702);
$jsonFromToArray = json_decode(json_encode($order->toArray()), true);
echo "json_encode(order->toArray()):" . PHP_EOL;
echo "  created_at: " . $jsonFromToArray['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . $jsonFromToArray['admin_confirmed_at'] . PHP_EOL;
echo "  adminConfirmedAt: " . $jsonFromToArray['adminConfirmedAt'] . PHP_EOL;
echo "  income_distributed_at: " . $jsonFromToArray['income_distributed_at'] . PHP_EOL;
