<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$tokens = DB::table('personal_access_tokens')
    ->whereIn('tokenable_type', ['App\\Models\\BusinessEntity', 'App\\Models\\FreelancerEntity'])
    ->select('id', 'tokenable_type', 'tokenable_id', 'name', 'created_at')
    ->get();

echo json_encode($tokens, JSON_PRETTY_PRINT);
