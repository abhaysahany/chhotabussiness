<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
    echo "Local MySQL root connected successfully!\n";
    $stmt = $pdo->query('SHOW DATABASES');
    $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Databases found: " . implode(', ', $dbs) . "\n";
} catch (Exception $e) {
    echo "Local MySQL root connection failed: " . $e->getMessage() . "\n";
}
