<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "SALE_PAYMENTS COLUMNS:" . PHP_EOL;
print_r(Schema::getColumnListing('sale_payments'));

$sampleSalePayment = DB::table('sale_payments')->latest('id')->first();
echo "LATEST SALE PAYMENT:" . PHP_EOL;
echo json_encode($sampleSalePayment, JSON_PRETTY_PRINT) . PHP_EOL;
