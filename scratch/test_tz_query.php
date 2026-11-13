<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$p = \App\Models\UserPayout::first();
if ($p) {
    echo "request_date: " . $p->request_date . PHP_EOL;
    echo "created_at: " . $p->created_at . PHP_EOL;
} else {
    echo "No user payouts found" . PHP_EOL;
}
