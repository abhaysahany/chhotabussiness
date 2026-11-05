<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\SalePayment;

$o = new Order();
echo "ORDER CASTS:" . PHP_EOL;
print_r($o->getCasts());

$p = new SalePayment();
echo "SALE_PAYMENT CASTS:" . PHP_EOL;
print_r($p->getCasts());
