<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$type = Illuminate\Support\Facades\Schema::getColumnType('users', 'avatar');
echo "avatar column type: " . $type . "\n";
