<?php
require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::all();
echo "Total users: " . $users->count() . "\n";
foreach ($users as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Sponsor: {$u->sponsor_id} | Provider: {$u->provider} | Status: {$u->status}\n";
}
