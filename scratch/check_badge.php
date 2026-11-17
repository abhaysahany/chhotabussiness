<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$m = new App\Mail\PasswordResetOtpMail('Sanjay', '123456', 'Administrator', 15);
$html = $m->render();
preg_match('/ACCOUNT SECURITY[^<]*/', $html, $match);
echo "Match: " . json_encode($match) . "\n";
