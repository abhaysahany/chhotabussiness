<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=vyaparadnet', 'root', '');
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    echo "Local 'vyaparadnet' database has " . count($tables) . " tables.\n";
    if (in_array('users', $tables)) {
        $count = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        echo "  - users table has {$count} rows\n";
    }
} catch (Exception $e) {
    echo "vyaparadnet db error: " . $e->getMessage() . "\n";
}

try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=chhotabiz', 'root', '');
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    echo "Local 'chhotabiz' database has " . count($tables) . " tables.\n";
    if (in_array('users', $tables)) {
        $count = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        echo "  - users table has {$count} rows\n";
    }
} catch (Exception $e) {
    echo "chhotabiz db error: " . $e->getMessage() . "\n";
}
