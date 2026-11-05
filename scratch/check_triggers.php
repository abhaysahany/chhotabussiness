<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$triggers = DB::select("SHOW TRIGGERS");
$procedures = DB::select("SHOW PROCEDURE STATUS WHERE Db = DATABASE()");

echo json_encode([
    'triggers' => $triggers,
    'procedures' => $procedures,
], JSON_PRETTY_PRINT);
