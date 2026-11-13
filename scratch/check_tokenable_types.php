<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$res = DB::select("SELECT tokenable_type, count(*) as count FROM personal_access_tokens GROUP BY tokenable_type");
echo json_encode($res, JSON_PRETTY_PRINT);
