<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

class NoAccessorOrderWithAppends extends Illuminate\Database\Eloquent\Model {
    protected $table = 'orders';
    protected $casts = [
        'admin_confirmed_at' => 'datetime',
        'created_at' => 'datetime',
    ];
    protected $appends = [
        'adminConfirmedAt',
    ];
}

try {
    $order = NoAccessorOrderWithAppends::find(702);
    $json = json_decode(json_encode($order), true);
    echo "NoAccessorOrderWithAppends JSON:" . PHP_EOL;
    echo "  created_at: " . ($json['created_at'] ?? 'null') . PHP_EOL;
    echo "  admin_confirmed_at: " . ($json['admin_confirmed_at'] ?? 'null') . PHP_EOL;
    echo "  adminConfirmedAt: " . ($json['adminConfirmedAt'] ?? 'null') . PHP_EOL;
} catch (\Throwable $e) {
    echo "Caught: " . $e->getMessage() . PHP_EOL;
}
