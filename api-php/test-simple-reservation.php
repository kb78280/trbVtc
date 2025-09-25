<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

// Configuration des headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Validation de l'origine
if (!validateOrigin()) {
    jsonResponse(['error' => 'Origine non autorisée'], 403);
}

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Méthode non autorisée'], 405);
}

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Données JSON invalides');
    }
    
    // Connexion à la base de données
    $pdo = getDBConnection();
    
    // Test simple d'insertion
    $pdo->beginTransaction();
    
    // 1. Test insertion réservation
    $reservationSql = "
        INSERT INTO vtc_reservations (
            service_type, vehicle_type, departure_address, arrival_address,
            duration_hours, reservation_date, reservation_time,
            passenger_count, baggage_count, payment_method, comments, estimated_price, distance_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    
    $stmt = $pdo->prepare($reservationSql);
    $stmt->execute([
        'transfert',
        'berline',
        'Test depart',
        'Test arrivee',
        null,
        '2025-09-26',
        '23:03',
        1,
        0,
        'sur-place',
        '',
        50,
        16.8
    ]);
    
    $reservationId = $pdo->lastInsertId();
    
    // 2. Test insertion client
    $customerSql = "
        INSERT INTO vtc_customer_info (reservation_id, first_name, last_name, phone, email)
        VALUES (?, ?, ?, ?, ?)
    ";
    $stmt = $pdo->prepare($customerSql);
    $stmt->execute([
        $reservationId,
        'Test',
        'User',
        '0123456789',
        'test@example.com'
    ]);
    
    $pdo->commit();
    
    jsonResponse([
        'success' => true, 
        'message' => 'Test réussi', 
        'reservation_id' => $reservationId
    ]);
    
} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->rollback();
    }
    jsonResponse([
        'success' => false, 
        'error' => $e->getMessage(),
        'message' => 'Erreur lors du test'
    ], 500);
}
?>
