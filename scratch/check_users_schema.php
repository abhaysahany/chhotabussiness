<?php
require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cols = Illuminate\Support\Facades\DB::select("DESCRIBE users");
foreach ($cols as $col) {
    echo "{$col->Field} | {$col->Type} | Null:{$col->Null} | Default:{$col->Default}\n";
}
