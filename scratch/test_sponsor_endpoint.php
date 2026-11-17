<?php
require_once __DIR__ . '/../backend/vendor/autoload.php';

$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Configure to local working DB
config(['database.connections.mysql.host' => '127.0.0.1']);
config(['database.connections.mysql.database' => 'vyaparadnet']);
config(['database.connections.mysql.username' => 'root']);
config(['database.connections.mysql.password' => '']);
DB::purge('mysql');
DB::reconnect('mysql');

echo "--- TEST 1: Empty Sponsor ID ---\n";
$req1 = Request::create('/api/verify-sponsor', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([]));
$res1 = $app->handle($req1);
echo "Status: " . $res1->getStatusCode() . "\n";
echo "Body: " . $res1->getContent() . "\n\n";

echo "--- TEST 2: Invalid Sponsor ID (CB999999999) ---\n";
$req2 = Request::create('/api/verify-sponsor', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['sponsor_id' => 'CB999999999']));
$res2 = $app->handle($req2);
echo "Status: " . $res2->getStatusCode() . "\n";
echo "Body: " . $res2->getContent() . "\n\n";

echo "--- TEST 3: Valid Sponsor ID (CB4961231) ---\n";
$req3 = Request::create('/api/verify-sponsor', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['sponsor_id' => 'CB4961231']));
$res3 = $app->handle($req3);
echo "Status: " . $res3->getStatusCode() . "\n";
echo "Body: " . $res3->getContent() . "\n\n";

echo "--- TEST 4: Case-insensitive Valid Sponsor ID (cb4961231) ---\n";
$req4 = Request::create('/api/verify-sponsor', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['sponsor_id' => 'cb4961231']));
$res4 = $app->handle($req4);
echo "Status: " . $res4->getStatusCode() . "\n";
echo "Body: " . $res4->getContent() . "\n\n";

echo "--- TEST 5: Database Unavailable (simulate with closed connection) ---\n";
config(['database.connections.mysql.password' => 'wrong_invalid_password_test']);
DB::purge('mysql');
$req5 = Request::create('/api/verify-sponsor', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['sponsor_id' => 'CB4961231']));
$res5 = $app->handle($req5);
echo "Status: " . $res5->getStatusCode() . "\n";
echo "Body: " . $res5->getContent() . "\n";
