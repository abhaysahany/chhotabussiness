<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=vyaparadnet', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Test sponsor query
    $stmt = $pdo->prepare("SELECT id, user_code, name, email FROM users WHERE LOWER(user_code) = ? OR email = ? OR id = ? LIMIT 1");
    $stmt->execute(['va100001', 'va100001', 'va100001']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "Sponsor lookup result for 'va100001':\n";
    if ($user) {
        echo "Found: ID={$user['id']}, Code={$user['user_code']}, Name={$user['name']}, Email={$user['email']}\n";
    } else {
        echo "Not found with code 'va100001'. Fetching first user in table...\n";
        $first = $pdo->query("SELECT id, user_code, name, email FROM users LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
        print_r($first);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
