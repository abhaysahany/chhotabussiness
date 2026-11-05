<?php

// Load Laravel Bootstrap
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== GLOBAL & SESSION TIMEZONE AUDIT ===" . PHP_EOL;
$tz = DB::select("SELECT @@global.time_zone AS global_tz, @@session.time_zone AS session_tz, NOW() AS db_now, UTC_TIMESTAMP() AS db_utc_now, CURDATE() AS db_curdate");
echo json_encode($tz[0], JSON_PRETTY_PRINT) . PHP_EOL . PHP_EOL;

echo "=== ALL DATETIME / TIMESTAMP / DATE / TIME COLUMNS IN DATABASE ===" . PHP_EOL;
$cols = DB::select("
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND DATA_TYPE IN ('timestamp', 'datetime', 'date', 'time')
    ORDER BY TABLE_NAME, ORDINAL_POSITION
");
echo "Total datetime columns found: " . count($cols) . PHP_EOL;
file_put_contents(__DIR__ . '/db_datetime_columns.json', json_encode($cols, JSON_PRETTY_PRINT));
echo "Saved detailed column list to scratch/db_datetime_columns.json" . PHP_EOL . PHP_EOL;

// Summary by data type
$byType = [];
foreach ($cols as $c) {
    $byType[$c->DATA_TYPE] = ($byType[$c->DATA_TYPE] ?? 0) + 1;
}
echo "Column counts by type:" . PHP_EOL;
foreach ($byType as $type => $count) {
    echo "  $type: $count" . PHP_EOL;
}
echo PHP_EOL;

// Sample actual records from core business tables
$tables = [
    'orders' => ['id', 'order_number', 'order_status', 'created_at', 'updated_at', 'approved_at', 'rejected_at'],
    'sale_payments' => ['id', 'order_id', 'payment_status', 'payment_date', 'received_at', 'created_at', 'updated_at'],
    'order_payment_dumps' => ['id', 'order_id', 'status', 'dump_amount', 'created_at', 'updated_at', 'approved_at', 'rejected_at'],
    'order_approval_histories' => ['id', 'order_id', 'action', 'created_at'],
    'users' => ['id', 'name', 'email', 'created_at', 'updated_at', 'email_verified_at'],
    'business_entities' => ['id', 'entity_name', 'status', 'created_at', 'updated_at'],
    'direct_incomes' => ['id', 'user_id', 'amount', 'created_at', 'updated_at'],
    'level_incomes' => ['id', 'user_id', 'amount', 'created_at', 'updated_at'],
    'payout_requests' => ['id', 'user_id', 'status', 'created_at', 'updated_at', 'processed_at'],
    'kyc_verifications' => ['id', 'user_id', 'status', 'created_at', 'updated_at', 'verified_at'],
    'support_tickets' => ['id', 'ticket_number', 'status', 'created_at', 'updated_at'],
    'notifications' => ['id', 'notifiable_type', 'read_at', 'created_at', 'updated_at'],
];

echo "=== SAMPLING REPRESENTATIVE DATABASE RECORDS ===" . PHP_EOL;
$samples = [];
foreach ($tables as $table => $fields) {
    try {
        // Check if table exists
        $hasTable = DB::select("SHOW TABLES LIKE '$table'");
        if (empty($hasTable)) {
            echo "Table '$table' does not exist." . PHP_EOL;
            continue;
        }
        
        // Find which fields actually exist in the table
        $existingCols = DB::getSchemaBuilder()->getColumnListing($table);
        $selectFields = array_intersect($fields, $existingCols);
        
        if (empty($selectFields)) {
            $selectFields = ['*'];
        }
        
        $records = DB::table($table)->select($selectFields)->latest('id')->limit(3)->get();
        $samples[$table] = $records;
        echo "Table '$table': sampled " . count($records) . " records." . PHP_EOL;
    } catch (\Exception $e) {
        echo "Error querying '$table': " . $e->getMessage() . PHP_EOL;
    }
}

file_put_contents(__DIR__ . '/db_samples.json', json_encode($samples, JSON_PRETTY_PRINT));
echo "Saved record samples to scratch/db_samples.json" . PHP_EOL;
