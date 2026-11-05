<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = DB::connection('mysql')->select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'chhotabiz_test'");
$names = array_map(fn($t) => $t->table_name ?? $t->TABLE_NAME, $tables);
echo json_encode($names, JSON_PRETTY_PRINT);
