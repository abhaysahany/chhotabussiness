<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

class FixOrder2 extends Order {
    public function getAdminConfirmedAtAttribute()
    {
        $val = $this->attributes['admin_confirmed_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }
}

$order = FixOrder2::find(702);
echo "Type of admin_confirmed_at: " . get_class($order->admin_confirmed_at) . PHP_EOL;
echo "serializeDate: " . $order->serializeDate($order->admin_confirmed_at) . PHP_EOL;
echo "json_encode(\$order): " . PHP_EOL;
$json = json_decode(json_encode($order), true);
echo "  created_at: " . $json['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . $json['admin_confirmed_at'] . PHP_EOL;
echo "  adminConfirmedAt: " . $json['adminConfirmedAt'] . PHP_EOL;
