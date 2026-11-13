<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

class FixOrder extends Order {
    public function getAdminConfirmedAtAttribute()
    {
        $val = $this->attributes['admin_confirmed_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }
    public function getAdminCancelledAtAttribute()
    {
        $val = $this->attributes['admin_cancelled_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }
    public function getIncomeDistributedAtAttribute()
    {
        $val = $this->attributes['income_distributed_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }
}

$order = FixOrder::find(702);
$arr = $order->toArray();
echo "FixOrder toArray():" . PHP_EOL;
echo "  created_at: " . ($arr['created_at'] ?? 'null') . PHP_EOL;
echo "  admin_confirmed_at: " . ($arr['admin_confirmed_at'] ?? 'null') . PHP_EOL;
echo "  adminConfirmedAt: " . ($arr['adminConfirmedAt'] ?? 'null') . PHP_EOL;
echo "  income_distributed_at: " . ($arr['income_distributed_at'] ?? 'null') . PHP_EOL;
echo "  incomeDistributedAt: " . ($arr['incomeDistributedAt'] ?? 'null') . PHP_EOL;
echo "  date: " . ($arr['date'] ?? 'null') . PHP_EOL;
