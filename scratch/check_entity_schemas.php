<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$schemas = [];

foreach (['business_entities', 'freelancer_entities', 'users'] as $table) {
    try {
        $res = DB::select("SHOW CREATE TABLE {$table}");
        $schemas[$table] = $res[0]->{'Create Table'};
    } catch (\Exception $e) {
        $schemas[$table] = 'Error: ' . $e->getMessage();
    }
}

echo json_encode($schemas, JSON_PRETTY_PRINT);
