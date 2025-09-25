<?php
// Test simple pour diagnostiquer le problème
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Test reservation.php\n";

// Test 1: Inclusion de config.php
try {
    require_once 'config.php';
    echo "✅ config.php chargé\n";
} catch (Exception $e) {
    echo "❌ Erreur config.php: " . $e->getMessage() . "\n";
    exit;
}

// Test 2: Headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Test 3: Validation origine
try {
    if (!validateOrigin()) {
        echo "❌ Origine non autorisée\n";
    } else {
        echo "✅ Origine validée\n";
    }
} catch (Exception $e) {
    echo "❌ Erreur validateOrigin: " . $e->getMessage() . "\n";
}

// Test 4: Connexion BDD
try {
    $pdo = getDBConnection();
    echo "✅ Connexion BDD OK\n";
} catch (Exception $e) {
    echo "❌ Erreur BDD: " . $e->getMessage() . "\n";
}

echo "Test terminé\n";
?>
