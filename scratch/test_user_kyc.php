<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = App\Models\User::whereNotNull('kyc_submitted_at')->first();
if (!$u) {
    // find any user and test casting
    $u = App\Models\User::first();
    if ($u) {
        $u->kyc_submitted_at = '2026-11-03 10:00:00';
        $u->kyc_verified_at = '2026-11-03 12:00:00';
    }
}

if ($u) {
    echo json_encode([
        'user_id' => $u->id,
        'kyc_submitted_at_raw' => $u->getAttributes()['kyc_submitted_at'] ?? null,
        'kyc_submitted_at_cast' => $u->kyc_submitted_at ? $u->kyc_submitted_at->toIso8601String() : null,
        'toArray_kyc_submitted_at' => $u->toArray()['kyc_submitted_at'] ?? null,
        'toArray_kyc_verified_at' => $u->toArray()['kyc_verified_at'] ?? null,
    ], JSON_PRETTY_PRINT);
} else {
    echo "No users found in database\n";
}
