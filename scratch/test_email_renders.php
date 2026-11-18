<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\View;

$previewsDir = __DIR__ . '/email-previews';
if (!is_dir($previewsDir)) {
    mkdir($previewsDir, 0755, true);
}

// 1. Render Registration OTP Email Preview
$regHtml = View::make('emails.registration-otp', [
    'recipientName' => 'Vikram Sharma',
    'otp' => '849201',
    'expiresInMinutes' => 10,
    // Use relative or data URI for local browser inspection if needed
    'customLogoUrl' => '../../backend/public/images/logo-email.png',
])->render();

file_put_contents($previewsDir . '/registration-otp-preview.html', $regHtml);
echo "Rendered: {$previewsDir}/registration-otp-preview.html (" . strlen($regHtml) . " bytes)\n";

// 2. Render Password Reset OTP Email Preview (Member)
$resetMemberHtml = View::make('emails.password-reset-otp', [
    'recipientName' => 'Vikram Sharma',
    'otp' => '391482',
    'accountType' => 'Member',
    'expiresInMinutes' => 15,
    'customLogoUrl' => '../../backend/public/images/logo-email.png',
])->render();

file_put_contents($previewsDir . '/password-reset-otp-member-preview.html', $resetMemberHtml);
echo "Rendered: {$previewsDir}/password-reset-otp-member-preview.html (" . strlen($resetMemberHtml) . " bytes)\n";

// 3. Render Password Reset OTP Email Preview (Business Entity)
$resetEntityHtml = View::make('emails.password-reset-otp', [
    'recipientName' => 'Rajesh Gupta (Gupta Logistics Pvt Ltd)',
    'otp' => '520847',
    'accountType' => 'Business Entity',
    'expiresInMinutes' => 15,
    'customLogoUrl' => '../../backend/public/images/logo-email.png',
])->render();

file_put_contents($previewsDir . '/password-reset-otp-entity-preview.html', $resetEntityHtml);
echo "Rendered: {$previewsDir}/password-reset-otp-entity-preview.html (" . strlen($resetEntityHtml) . " bytes)\n";

// 4. Also render production URL version
$regProdHtml = View::make('emails.registration-otp', [
    'recipientName' => 'Vikram Sharma',
    'otp' => '849201',
    'expiresInMinutes' => 10,
])->render();
file_put_contents($previewsDir . '/registration-otp-production-preview.html', $regProdHtml);
echo "Rendered: {$previewsDir}/registration-otp-production-preview.html (" . strlen($regProdHtml) . " bytes)\n";

echo "ALL EMAIL PREVIEWS COMPILED CLEANLY WITHOUT BLADE ERRORS!\n";
