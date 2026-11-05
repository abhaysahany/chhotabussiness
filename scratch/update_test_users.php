<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

config(['database.connections.mysql.database' => 'chhotabiz_test']);
Illuminate\Support\Facades\DB::purge('mysql');

$schema = Illuminate\Support\Facades\Schema::connection('mysql');

$schema->table('users', function ($table) use ($schema) {
    if (!$schema->hasColumn('users', 'dob')) {
        $table->date('dob')->nullable()->after('phone');
    }
    if (!$schema->hasColumn('users', 'gender')) {
        $table->string('gender', 20)->nullable()->after('dob');
    }
    if (!$schema->hasColumn('users', 'address')) {
        $table->text('address')->nullable()->after('location');
    }
    if (!$schema->hasColumn('users', 'city')) {
        $table->string('city', 100)->nullable()->after('address');
    }
    if (!$schema->hasColumn('users', 'state')) {
        $table->string('state', 100)->nullable()->after('city');
    }
    if (!$schema->hasColumn('users', 'country')) {
        $table->string('country', 100)->default('India')->after('state');
    }
    if (!$schema->hasColumn('users', 'zip_code')) {
        $table->string('zip_code', 20)->nullable()->after('country');
    }
    if (!$schema->hasColumn('users', 'bio')) {
        $table->text('bio')->nullable()->after('zip_code');
    }
});

echo "chhotabiz_test users columns updated successfully.\n";
