<?php
$envPath = 'backend/.env';
$content = file_get_contents($envPath);

// Update APP_NAME
$content = preg_replace('/^APP_NAME=.*$/m', 'APP_NAME="Vyapar AdNET"', $content);

// Update APP_ENV
$content = preg_replace('/^APP_ENV=.*$/m', 'APP_ENV=production', $content);

// Update APP_DEBUG
$content = preg_replace('/^APP_DEBUG=.*$/m', 'APP_DEBUG=false', $content);

// Update APP_URL
$content = preg_replace('/^APP_URL=.*$/m', 'APP_URL=https://vyaparadnet.com', $content);

// Update DB_HOST from 127.0.0.1 to localhost
$content = preg_replace('/^DB_HOST=.*$/m', 'DB_HOST=localhost', $content);

// Ensure MAIL_LOGO_URL exists
if (!str_contains($content, 'MAIL_LOGO_URL=')) {
    $content .= "\nMAIL_LOGO_URL=https://vyaparadnet.com/images/logo-email.png\n";
}

// Ensure MAIL_EMBED_LOGO exists
if (!str_contains($content, 'MAIL_EMBED_LOGO=')) {
    $content .= "MAIL_EMBED_LOGO=true\n";
}

file_put_contents($envPath, $content);
echo "backend/.env updated safely while preserving DB_DATABASE, DB_USERNAME, DB_PASSWORD and all secrets.\n";
