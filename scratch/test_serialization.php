<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\SalePayment;
use App\Models\User;

$order = Order::latest('id')->first();
echo "ORDER MODEL TO ARRAY (created_at & date):" . PHP_EOL;
echo json_encode([
    'id' => $order?->id,
    'date' => $order?->date,
    'created_at' => $order?->created_at,
    'admin_confirmed_at' => $order?->admin_confirmed_at,
    'income_distributed_at' => $order?->income_distributed_at,
], JSON_PRETTY_PRINT) . PHP_EOL;

$payment = SalePayment::latest('id')->first();
echo "SALE_PAYMENT MODEL TO ARRAY:" . PHP_EOL;
echo json_encode([
    'id' => $payment?->id,
    'payment_date' => $payment?->payment_date,
    'income_distributed_at' => $payment?->income_distributed_at,
    'created_at' => $payment?->created_at,
], JSON_PRETTY_PRINT) . PHP_EOL;

$user = User::latest('id')->first();
echo "USER MODEL TO ARRAY:" . PHP_EOL;
echo json_encode([
    'id' => $user?->id,
    'created_at' => $user?->created_at,
    'email_verified_at' => $user?->email_verified_at,
], JSON_PRETTY_PRINT) . PHP_EOL;
