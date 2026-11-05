<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

class TestCastOrder extends Illuminate\Database\Eloquent\Model {
    protected $table = 'orders';
    protected $casts = [
        'created_at' => 'datetime',
        'admin_confirmed_at' => 'datetime',
    ];
}

$o = TestCastOrder::find(702);
$arr = $o->toArray();
echo "toArray():" . PHP_EOL;
echo "  created_at: " . $arr['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . $arr['admin_confirmed_at'] . PHP_EOL;

$json = json_decode(json_encode($o), true);
echo "json_encode():" . PHP_EOL;
echo "  created_at: " . $json['created_at'] . PHP_EOL;
echo "  admin_confirmed_at: " . $json['admin_confirmed_at'] . PHP_EOL;
