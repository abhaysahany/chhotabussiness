<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = new \App\Http\Controllers\AdminDashboardController();
$req = new \Illuminate\Http\Request();
$response = $controller->stats($req);
$data = json_decode($response->getContent(), true);

echo "merchantPartners count: " . count($data['merchantPartners']) . "\n";
foreach ($data['merchantPartners'] as $idx => $p) {
    echo "Partner $idx:\n";
    echo "  Name: " . $p['name'] . "\n";
    echo "  Category type: " . gettype($p['category']) . "\n";
    echo "  Category value: " . json_encode($p['category']) . "\n";
}
