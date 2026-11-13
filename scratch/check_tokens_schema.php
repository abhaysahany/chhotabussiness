<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$res = DB::select("SHOW CREATE TABLE personal_access_tokens");
echo json_encode($res[0]->{'Create Table'}, JSON_PRETTY_PRINT);
