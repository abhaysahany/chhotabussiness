<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$p = new \App\Models\UserPayout();
$p->payout_code = 'PAY-TEST-001';
$p->request_date = '2026-11-05 04:30:00';
$p->processed_date = '2026-11-05 05:00:00';

$arr = $p->toArray();
$json = json_decode(json_encode($p), true);

echo json_encode([
    'request_date_cast' => $p->request_date->toIso8601String(),
    'json_request_date' => $json['request_date'] ?? null,
    'json_processed_date' => $json['processed_date'] ?? null,
    'has_Z' => str_ends_with($json['request_date'], 'Z'),
], JSON_PRETTY_PRINT);
