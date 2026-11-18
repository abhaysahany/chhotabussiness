<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $sponsorId = 'CB10000';
    $sponsor = App\Models\User::whereRaw('LOWER(user_code) = ?', [strtolower($sponsorId)])
        ->orWhere('email', $sponsorId)
        ->orWhere('id', $sponsorId)
        ->first();
    echo "QUERY SUCCESS: " . ($sponsor ? $sponsor->name : "NULL (not found)") . "\n";
} catch (\Throwable $e) {
    echo "QUERY EXCEPTION: " . $e->getMessage() . "\n";
}
