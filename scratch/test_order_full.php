<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

class FixOrderFull extends Order {
    protected $casts = [
        'unit_price' => 'float',
        'quantity' => 'integer',
        'gross_amount' => 'float',
        'dump_amount' => 'float',
        'taxable_amount' => 'float',
        'gst_tax' => 'float',
        'admin_commission_percent' => 'float',
        'admin_commission_cut' => 'float',
        'net_entity_payout' => 'float',
        'advance_payment' => 'float',
        'balance_due' => 'float',
        'direct_commission' => 'float',
        'level_commissions_total' => 'float',
        'team_volume_bv' => 'float',
        'commission_distributed' => 'boolean',
        'distribution_details' => 'array',
        'direct_income_amount' => 'float',
        'level_income_amount' => 'float',
        'reward_income_amount' => 'float',
        'distributed_admin_cut_amount' => 'float',
        'date' => 'date:Y-m-d',
        'income_distributed_at' => 'datetime',
        'admin_confirmed_by' => 'integer',
        'admin_confirmed_at' => 'datetime',
        'admin_cancelled_by' => 'integer',
        'admin_cancelled_at' => 'datetime',
    ];

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

$order = FixOrderFull::find(702);
$json = json_decode(json_encode($order), true);

echo "FixOrderFull JSON:" . PHP_EOL;
echo "  date: " . $json['date'] . PHP_EOL;
echo "  created_at: " . $json['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . ($json['admin_confirmed_at'] ?? 'null') . PHP_EOL;
echo "  adminConfirmedAt: " . ($json['adminConfirmedAt'] ?? 'null') . PHP_EOL;
echo "  admin_cancelled_at: " . ($json['admin_cancelled_at'] ?? 'null') . PHP_EOL;
echo "  adminCancelledAt: " . ($json['adminCancelledAt'] ?? 'null') . PHP_EOL;
echo "  income_distributed_at: " . ($json['income_distributed_at'] ?? 'null') . PHP_EOL;
echo "  incomeDistributedAt: " . ($json['incomeDistributedAt'] ?? 'null') . PHP_EOL;
