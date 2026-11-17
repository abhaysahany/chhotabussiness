<?php
$env = file_get_contents('backend/.env');
preg_match('/^DB_PASSWORD=(.*)$/m', $env, $matches);
$hasPassword = isset($matches[1]) && strlen(trim($matches[1])) > 0;
$pwdLen = isset($matches[1]) ? strlen(trim($matches[1])) : 0;

echo "Has DB_PASSWORD: " . ($hasPassword ? "YES (length {$pwdLen})" : "NO") . "\n";

preg_match('/^DB_HOST=(.*)$/m', $env, $mHost);
preg_match('/^DB_DATABASE=(.*)$/m', $env, $mDb);
preg_match('/^DB_USERNAME=(.*)$/m', $env, $mUser);

echo "DB_HOST: " . trim($mHost[1] ?? 'unset') . "\n";
echo "DB_DATABASE: " . trim($mDb[1] ?? 'unset') . "\n";
echo "DB_USERNAME: " . trim($mUser[1] ?? 'unset') . "\n";
