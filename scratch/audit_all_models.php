<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$modelsDir = __DIR__ . '/../backend/app/Models';
$files = glob($modelsDir . '/*.php');

$results = [];

foreach ($files as $f) {
    $className = 'App\\Models\\' . basename($f, '.php');
    if (!class_exists($className)) {
        continue;
    }
    
    $ref = new ReflectionClass($className);
    if ($ref->isAbstract() || !$ref->isSubclassOf('Illuminate\Database\Eloquent\Model')) {
        continue;
    }
    
    $instance = new $className();
    $table = $instance->getTable();
    $casts = $instance->getCasts();
    $dates = method_exists($instance, 'getDates') ? $instance->getDates() : [];
    
    // Check methods for accessors
    $accessors = [];
    foreach ($ref->getMethods() as $method) {
        if (preg_match('/^get(.+)Attribute$/', $method->getName(), $matches)) {
            $attr = Illuminate\Support\Str::snake($matches[1]);
            $accessors[$attr] = $method->getName();
        }
    }
    
    $results[$className] = [
        'table' => $table,
        'casts' => $casts,
        'accessors' => $accessors,
    ];
}

file_put_contents(__DIR__ . '/models_audit.json', json_encode($results, JSON_PRETTY_PRINT));
echo "Audited " . count($results) . " Eloquent models. Saved to scratch/models_audit.json" . PHP_EOL;
