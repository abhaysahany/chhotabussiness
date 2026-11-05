<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cols = Illuminate\Support\Facades\Schema::getColumnListing("packages");
echo "packages: " . json_encode($cols) . "\n";

$colsProd = Illuminate\Support\Facades\Schema::getColumnListing("products");
echo "products: " . json_encode($colsProd) . "\n";

$colsServ = Illuminate\Support\Facades\Schema::getColumnListing("services");
echo "services: " . json_encode($colsServ) . "\n";
