<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

class SolutionA extends Illuminate\Database\Eloquent\Model {
    protected $table = 'orders';
    protected $casts = [
        'admin_confirmed_at' => 'datetime',
        'created_at' => 'datetime',
    ];
    protected $appends = [
        'adminConfirmedAt',
    ];
    public function getAdminConfirmedAtAttribute()
    {
        $val = $this->attributes['admin_confirmed_at'] ?? null;
        return $val ? $this->asDateTime($val)->toISOString() : null;
    }
}

$order = SolutionA::find(702);
$json = json_decode(json_encode($order), true);
echo "SolutionA (toISOString) JSON:" . PHP_EOL;
echo "  created_at: " . ($json['created_at'] ?? 'null') . PHP_EOL;
echo "  admin_confirmed_at: " . ($json['admin_confirmed_at'] ?? 'null') . PHP_EOL;
echo "  adminConfirmedAt: " . ($json['adminConfirmedAt'] ?? 'null') . PHP_EOL;
echo "  typeof admin_confirmed_at on model: " . gettype($order->admin_confirmed_at) . " (" . $order->admin_confirmed_at . ")" . PHP_EOL;

class SolutionB extends Illuminate\Database\Eloquent\Model {
    protected $table = 'orders';
    protected $casts = [
        'admin_confirmed_at' => 'datetime',
        'created_at' => 'datetime',
    ];
    protected $appends = [
        'adminConfirmedAt',
    ];
    public function getAdminConfirmedAtAttribute()
    {
        $val = $this->attributes['admin_confirmed_at'] ?? null;
        return $val ? $this->asDateTime($val) : null;
    }
}

$orderB = SolutionB::find(702);
$jsonB = json_decode(json_encode($orderB), true);
echo PHP_EOL . "SolutionB (asDateTime Carbon) JSON:" . PHP_EOL;
echo "  created_at: " . ($jsonB['created_at'] ?? 'null') . PHP_EOL;
echo "  admin_confirmed_at: " . ($jsonB['admin_confirmed_at'] ?? 'null') . PHP_EOL;
echo "  adminConfirmedAt: " . ($jsonB['adminConfirmedAt'] ?? 'null') . PHP_EOL;
echo "  typeof admin_confirmed_at on model: " . get_class($orderB->admin_confirmed_at) . PHP_EOL;
