<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SalePayment;

class FixSalePayment extends SalePayment {
    protected $table = 'sale_payments';

    public function getPaymentDateAttribute()
    {
        $val = $this->attributes['payment_date'] ?? $this->attributes['created_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }

    public function getIncomeDistributedAtAttribute()
    {
        $val = $this->attributes['income_distributed_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }
}

$sp = FixSalePayment::find(809);
$json = json_decode(json_encode($sp), true);

echo "FixSalePayment JSON:" . PHP_EOL;
echo "  created_at: " . $json['created_at'] . PHP_EOL;
echo "  payment_date: " . $json['payment_date'] . PHP_EOL;
echo "  paymentDate: " . $json['paymentDate'] . PHP_EOL;
echo "  income_distributed_at: " . $json['income_distributed_at'] . PHP_EOL;
echo "  incomeDistributedAt: " . $json['incomeDistributedAt'] . PHP_EOL;
