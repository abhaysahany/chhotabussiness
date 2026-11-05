<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$buyer = App\Models\User::first();
$sponsor = App\Models\User::where('id', '!=', $buyer->id)->first();

$payload = [
    'item' => 'Solar Power System 5kW',
    'item_type' => 'product',
    'customer_user_code' => $buyer->user_code,
    'customer_name' => $buyer->name,
    'sponsor' => $sponsor->user_code,
    'unit_price' => 100000.00,
    'quantity' => 1,
    'gross_amount' => 100000.00,
    'advance_payment' => 20000.00,
    'admin_commission_percent' => 20.00,
    'payment_method' => 'UPI / QR Code',
    'reference_no' => 'UTR-' . rand(100000, 999999),
];

$req = Illuminate\Http\Request::create('/api/orders', 'POST', $payload);
$controller = new App\Http\Controllers\OrderController();
try {
    $res = $controller->store($req);
    echo "Status: " . $res->getStatusCode() . "\n";
    echo "Body: " . $res->getContent() . "\n";
} catch (\Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
