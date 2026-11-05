<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$admins = \App\Models\Admin::all();
foreach ($admins as $a) {
    echo "Admin: ID={$a->id}, Email={$a->email}, Username={$a->username}\n";
}
