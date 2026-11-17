<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Mail\RegistrationOtpMail;
use App\Mail\PasswordResetOtpMail;

echo "--- Testing RegistrationOtpMail Rendering ---\n";
$regMail = new RegistrationOtpMail('Pooja Patel', '729104', 10);
$renderedRegHtml = $regMail->render();
echo "Rendered length: " . strlen($renderedRegHtml) . " bytes\n";
assert(str_contains($renderedRegHtml, 'Pooja Patel'), 'Recipient name missing');
assert(str_contains($renderedRegHtml, '729104'), 'OTP missing');
assert(str_contains($renderedRegHtml, 'PARTNER EMAIL VERIFICATION'), 'Badge missing');
echo "RegistrationOtpMail verified successfully!\n\n";

echo "--- Testing PasswordResetOtpMail Rendering ---\n";
$resetMail = new PasswordResetOtpMail('Sanjay Verma', '481920', 'Administrator', 15);
$renderedResetHtml = $resetMail->render();
echo "Rendered length: " . strlen($renderedResetHtml) . " bytes\n";
assert(str_contains($renderedResetHtml, 'Sanjay Verma'), 'Recipient name missing');
assert(str_contains($renderedResetHtml, '481920'), 'OTP missing');
assert(str_contains($renderedResetHtml, 'ACCOUNT SECURITY • ADMINISTRATOR'), 'Badge missing');
echo "PasswordResetOtpMail verified successfully!\n\n";

echo "ALL MAILrender() TESTS PASSED WITHOUT TOUCHING BLADE VIEWS!\n";
