import subprocess

code = """
<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=vyaparadnet', 'root', '');
    echo "Connected to local vyaparadnet database!\\n";
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    echo "Total tables: " . count($tables) . "\\n";
    echo "Tables: " . implode(', ', array_slice($tables, 0, 15)) . "...\\n";
    
    // Check for sponsor CB100201 or users
    $stmt = $pdo->query("SELECT id, name, email, user_code, role, status FROM users LIMIT 10");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Sample users:\\n";
    foreach ($users as $u) {
        echo "  [{$u['id']}] Code: {$u['user_code']}, Name: {$u['name']}, Role: {$u['role']}\\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
"""
with open("scratch/check_local_vyaparadnet.php", "w") as f:
    f.write(code)
