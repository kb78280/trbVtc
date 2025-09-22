<?php
/**
 * Test rapide de la configuration VTC
 * À utiliser une fois pour vérifier que tout est OK
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Temporaire pour le test

try {
    echo json_encode([
        'status' => 'success',
        'message' => 'API VTC opérationnelle',
        'database' => [
            'host' => DB_HOST,
            'name' => DB_NAME,
            'user' => DB_USER,
            'connected' => false
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
    // Test de connexion
    $pdo = getDBConnection();
    
    // Si on arrive ici, la connexion est OK
    $response = [
        'status' => 'success',
        'message' => '✅ Connexion base de données réussie',
        'database' => [
            'host' => DB_HOST,
            'name' => DB_NAME,
            'user' => DB_USER,
            'connected' => true
        ],
        'tables_check' => [],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Vérification des tables VTC
    $tables = [
        'vtc_reservations',
        'vtc_customer_info',
        'vtc_reservation_options',
        'vtc_waypoints',
        'vtc_route_info',
        'vtc_pricing_info'
    ];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        $response['tables_check'][$table] = $stmt->rowCount() > 0;
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de connexion: ' . $e->getMessage(),
        'database' => [
            'host' => DB_HOST,
            'name' => DB_NAME,
            'user' => DB_USER,
            'connected' => false
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>
