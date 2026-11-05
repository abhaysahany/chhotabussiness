<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

// Let's create a dynamic class that does NOT define getAdminConfirmedAtAttribute
class NoAccessorOrder extends Illuminate\Database\Eloquent\Model {
    protected $table = 'orders';
    protected $casts = [
        'admin_confirmed_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}

$order = NoAccessorOrder::find(702);
$json = json_decode(json_encode($order), true);
echo "NoAccessorOrder JSON:" . PHP_EOL;
echo "  created_at: " . $json['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . $json['admin_confirmed_at'] . PHP_EOL;
