<?php
$host = 'vyaparadnet.com';
$port = 3306;

echo "Testing connection to {$host}:{$port}...\n";
$fp = @fsockopen($host, $port, $errno, $errstr, 5);
if (!$fp) {
    echo "Port 3306 is not open or firewall blocked on {$host}: {$errstr} ({$errno})\n";
} else {
    echo "Port 3306 is OPEN on {$host}!\n";
    fclose($fp);
}
