<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Carbon\Carbon;
use Carbon\CarbonImmutable;

$refl = new ReflectionMethod(Carbon::class, 'toJSON');
echo "Carbon::toJSON code: " . PHP_EOL;
$lines = file($refl->getFileName());
for ($i = $refl->getStartLine() - 1; $i < $refl->getEndLine(); $i++) {
    echo $lines[$i];
}
