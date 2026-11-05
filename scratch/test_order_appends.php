<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

$order = Order::find(702);

echo "Currently:" . PHP_EOL;
echo "  admin_confirmed_at: " . json_encode($order->admin_confirmed_at) . PHP_EOL;
echo "  adminConfirmedAt: " . json_encode($order->adminConfirmedAt) . PHP_EOL;
echo "  toArray admin_confirmed_at: " . json_encode($order->toArray()['admin_confirmed_at'] ?? null) . PHP_EOL;
echo "  toArray adminConfirmedAt: " . json_encode($order->toArray()['adminConfirmedAt'] ?? null) . PHP_EOL;
