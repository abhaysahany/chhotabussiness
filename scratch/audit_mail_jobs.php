<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

echo "=== MAIL CONFIGURATION (RESOLVED RUNTIME) ===" . PHP_EOL;
echo "Default Mailer: " . Config::get('mail.default') . PHP_EOL;
echo "SMTP Host: " . Config::get('mail.mailers.smtp.host') . PHP_EOL;
echo "SMTP Port: " . Config::get('mail.mailers.smtp.port') . PHP_EOL;
echo "SMTP Scheme: " . (Config::get('mail.mailers.smtp.scheme') ?: 'null') . PHP_EOL;
echo "SMTP Username: " . (Config::get('mail.mailers.smtp.username') ?: 'null') . PHP_EOL;
echo "SMTP Password Set: " . (!empty(Config::get('mail.mailers.smtp.password')) ? 'YES' : 'NO') . PHP_EOL;
echo "From Address: " . Config::get('mail.from.address') . PHP_EOL;
echo "From Name: " . Config::get('mail.from.name') . PHP_EOL;

echo PHP_EOL . "=== CACHE CONFIGURATION & DATABASE TABLE ===" . PHP_EOL;
echo "Cache Default: " . Config::get('cache.default') . PHP_EOL;
echo "cache table exists: " . (Schema::hasTable('cache') ? 'YES' : 'NO') . PHP_EOL;
if (Schema::hasTable('cache')) {
    echo "cache row count: " . DB::table('cache')->count() . PHP_EOL;
}
echo "cache_locks table exists: " . (Schema::hasTable('cache_locks') ? 'YES' : 'NO') . PHP_EOL;
echo "Queue Default: " . Config::get('queue.default') . PHP_EOL;

echo PHP_EOL . "=== DATABASE TABLES (JOBS & MAILS) ===" . PHP_EOL;
echo "jobs table exists: " . (Schema::hasTable('jobs') ? 'YES' : 'NO') . PHP_EOL;
if (Schema::hasTable('jobs')) {
    echo "jobs count: " . DB::table('jobs')->count() . PHP_EOL;
}

echo "failed_jobs table exists: " . (Schema::hasTable('failed_jobs') ? 'YES' : 'NO') . PHP_EOL;
if (Schema::hasTable('failed_jobs')) {
    echo "failed_jobs count: " . DB::table('failed_jobs')->count() . PHP_EOL;
}

echo "password_reset_tokens table exists: " . (Schema::hasTable('password_reset_tokens') ? 'YES' : 'NO') . PHP_EOL;
if (Schema::hasTable('password_reset_tokens')) {
    echo "password_reset_tokens count: " . DB::table('password_reset_tokens')->count() . PHP_EOL;
}

echo PHP_EOL . "=== PASSWORD RESET TOKENS SCHEMA ===" . PHP_EOL;
if (Schema::hasTable('password_reset_tokens')) {
    $schema = DB::select('SHOW CREATE TABLE password_reset_tokens');
    echo json_encode($schema, JSON_PRETTY_PRINT) . PHP_EOL;
}
if (Schema::hasTable('password_resets')) {
    echo "password_resets count: " . DB::table('password_resets')->count() . PHP_EOL;
}

echo "email_otps table exists: " . (Schema::hasTable('email_otps') ? 'YES' : 'NO') . PHP_EOL;
if (Schema::hasTable('email_otps')) {
    echo "email_otps count: " . DB::table('email_otps')->count() . PHP_EOL;
    $otps = DB::table('email_otps')->latest()->limit(5)->get(['id', 'email', 'action', 'expires_at', 'is_used', 'created_at']);
    foreach ($otps as $o) {
        echo " - OTP ID {$o->id}: email={$o->email}, action={$o->action}, used={$o->is_used}, created_at={$o->created_at}" . PHP_EOL;
    }
}
