<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

class TestOrder extends Order {
    public function getAdminConfirmedAtAttribute($value)
    {
        $val = $value ?? ($this->attributes['admin_confirmed_at'] ?? null);
        return $val ? $this->asDateTime($val) : null;
    }
    public function getAdminCancelledAtAttribute($value)
    {
        $val = $value ?? ($this->attributes['admin_cancelled_at'] ?? null);
        return $val ? $this->asDateTime($val) : null;
    }
    public function getIncomeDistributedAtAttribute($value)
    {
        $val = $value ?? ($this->attributes['income_distributed_at'] ?? null);
        return $val ? $this->asDateTime($val) : null;
    }
}

$order = TestOrder::find(702);
$arr = $order->toArray();
echo "TestOrder toArray():" . PHP_EOL;
echo "  created_at: " . ($arr['created_at'] ?? 'null') . PHP_EOL;
echo "  admin_confirmed_at: " . ($arr['admin_confirmed_at'] ?? 'null') . PHP_EOL;
echo "  adminConfirmedAt: " . ($arr['adminConfirmedAt'] ?? 'null') . PHP_EOL;
echo "  income_distributed_at: " . ($arr['income_distributed_at'] ?? 'null') . PHP_EOL;
echo "  incomeDistributedAt: " . ($arr['incomeDistributedAt'] ?? 'null') . PHP_EOL;
echo "  date: " . ($arr['date'] ?? 'null') . PHP_EOL;
