<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$admin = \App\Models\Admin::first();
$token = $admin->createToken('test_token')->plainTextToken;
echo "Token: $token\n";
file_put_contents(__DIR__ . '/admin_token.txt', $token);
