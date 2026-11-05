<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

$order = Order::find(702);
$json = json_decode(json_encode($order), true);

echo "ORIGINAL Order model:" . PHP_EOL;
echo "  created_at: " . $json['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . $json['admin_confirmed_at'] . PHP_EOL;
echo "  adminConfirmedAt: " . $json['adminConfirmedAt'] . PHP_EOL;

class FixOrderLive extends Order {
    public function getAdminConfirmedAtAttribute()
    {
        $val = $this->attributes['admin_confirmed_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }
}

$fixed = FixOrderLive::find(702);
$jsonFixed = json_decode(json_encode($fixed), true);

echo "FixOrderLive model:" . PHP_EOL;
echo "  created_at: " . $jsonFixed['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . $jsonFixed['admin_confirmed_at'] . PHP_EOL;
echo "  adminConfirmedAt: " . $jsonFixed['adminConfirmedAt'] . PHP_EOL;
