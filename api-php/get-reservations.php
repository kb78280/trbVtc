<?php
require_once 'config.php';

// Configuration des headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

// Vérification de la méthode GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée'], 405);
}

try {
    // Connexion à la base de données
    $pdo = getDBConnection();
    
    // Paramètres de pagination (optionnels)
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = ($page - 1) * $limit;
    
    // Paramètre de tri
    $orderBy = isset($_GET['order']) && in_array($_GET['order'], ['asc', 'desc']) ? $_GET['order'] : 'desc';
    
    // Requête pour récupérer les réservations avec toutes les informations
    $sql = "
        SELECT 
            r.id,
            r.service_type,
            r.vehicle_type,
            r.departure_address,
            r.arrival_address,
            r.duration_hours,
            r.reservation_date,
            r.reservation_time,
            r.passenger_count,
            r.baggage_count,
            r.payment_method,
            r.comments,
            r.estimated_price,
            r.distance_km,
            r.created_at,
            r.updated_at,
            c.first_name,
            c.last_name,
            c.phone,
            c.email,
            c.nombre_reservations,
            o.child_seat_quantity,
            o.flower_bouquet,
            o.airport_assistance,
            pi.base_price,
            pi.total_ht,
            pi.tva_amount,
            pi.stripe_fees,
            pi.total_ttc
        FROM vtc_reservations r
        LEFT JOIN vtc_customer_info c ON r.id = c.reservation_id
        LEFT JOIN vtc_reservation_options o ON r.id = o.reservation_id
        LEFT JOIN vtc_pricing_info pi ON r.id = pi.reservation_id
        ORDER BY r.created_at {$orderBy}
        LIMIT {$limit} OFFSET {$offset}
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $reservations = $stmt->fetchAll();
    
    // Requête pour compter le total des réservations
    $countSql = "SELECT COUNT(*) as total FROM vtc_reservations";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute();
    $totalCount = $countStmt->fetch()['total'];
    
    // Pour chaque réservation, récupérer les étapes (waypoints) si elles existent
    foreach ($reservations as &$reservation) {
        $waypointsSql = "
            SELECT waypoint_order, address
            FROM vtc_waypoints 
            WHERE reservation_id = ? 
            ORDER BY waypoint_order
        ";
        $waypointsStmt = $pdo->prepare($waypointsSql);
        $waypointsStmt->execute([$reservation['id']]);
        $reservation['waypoints'] = $waypointsStmt->fetchAll();
    }
    
    // Log de l'accès
    logError("Récupération des réservations", [
        'page' => $page,
        'limit' => $limit,
        'total_found' => count($reservations),
        'total_count' => $totalCount
    ]);
    
    // Réponse de succès
    jsonResponse([
        'success' => true,
        'data' => $reservations,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit,
            'total' => (int)$totalCount,
            'total_pages' => ceil($totalCount / $limit)
        ],
        'message' => 'Réservations récupérées avec succès'
    ], 200);
    
} catch (Exception $e) {
    // Log de l'erreur
    logError("Erreur lors de la récupération des réservations", [
        'error' => $e->getMessage()
    ]);
    
    // Réponse d'erreur
    jsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Erreur lors de la récupération des réservations'
    ], 500);
}
?>
