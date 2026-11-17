<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=vyaparadnet", "root", "");
$stmt = $pdo->query("SELECT id, user_code, name, email FROM users WHERE user_code LIKE '%CB%' LIMIT 25");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$r['id']}, Code: {$r['user_code']}, Name: {$r['name']}\n";
}
