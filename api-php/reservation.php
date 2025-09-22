<?php
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

// Vérification de la méthode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Méthode non autorisée'], 405);
}

try {
    // Lecture des données JSON
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Données JSON invalides');
    }
    
    // Log des données reçues (pour debug)
    logError("Données reçues", $data);
    
    // Validation des champs obligatoires
    $requiredFields = [
        'serviceType', 'vehicleType', 'depart', 'arrivee',
        'dateReservation', 'heureReservation', 'prenom', 'nom',
        'telephone', 'email', 'nombrePassagers', 'nombreBagages',
        'methodePaiement', 'accepteConditions'
    ];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Champ obligatoire manquant: $field");
        }
    }
    
    // Validation de l'acceptation des conditions
    if (!$data['accepteConditions']) {
        throw new Exception('Vous devez accepter les conditions générales');
    }
    
    // Validation des places Google Maps
    if (!isset($data['originPlace']) || !isset($data['destinationPlace'])) {
        throw new Exception('Adresses Google Maps manquantes');
    }
    
    // Connexion à la base de données
    $pdo = getDBConnection();
    
    // Début de la transaction
    $pdo->beginTransaction();
    
    // 1. Insertion de la réservation principale
    $reservationSql = "
        INSERT INTO vtc_reservations (
            service_type, vehicle_type, departure_address, arrival_address,
            departure_place_id, arrival_place_id, departure_lat, departure_lng,
            arrival_lat, arrival_lng, duration_hours, reservation_date, reservation_time,
            passenger_count, baggage_count, payment_method, comments, estimated_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    
    $stmt = $pdo->prepare($reservationSql);
    $stmt->execute([
        $data['serviceType'],
        $data['vehicleType'],
        $data['depart'],
        $data['arrivee'],
        $data['originPlace']['place_id'] ?? null,
        $data['destinationPlace']['place_id'] ?? null,
        $data['originPlace']['geometry']['location']['lat'] ?? null,
        $data['originPlace']['geometry']['location']['lng'] ?? null,
        $data['destinationPlace']['geometry']['location']['lat'] ?? null,
        $data['destinationPlace']['geometry']['location']['lng'] ?? null,
        ($data['serviceType'] === 'mise-a-disposition') ? (int)$data['duree'] : null,
        $data['dateReservation'],
        $data['heureReservation'],
        (int)$data['nombrePassagers'],
        (int)$data['nombreBagages'],
        $data['methodePaiement'],
        $data['commentaires'] ?? null,
        $data['estimatedPrice'] ?? 0
    ]);
    
    $reservationId = $pdo->lastInsertId();
    
    // 2. Insertion des informations client
    $customerSql = "
        INSERT INTO vtc_customer_info (reservation_id, first_name, last_name, phone, email)
        VALUES (?, ?, ?, ?, ?)
    ";
    $stmt = $pdo->prepare($customerSql);
    $stmt->execute([
        $reservationId,
        $data['prenom'],
        $data['nom'],
        $data['telephone'],
        $data['email']
    ]);
    
    // 3. Insertion des options
    $optionsSql = "
        INSERT INTO vtc_reservation_options (reservation_id, child_seat_quantity, flower_bouquet, airport_assistance)
        VALUES (?, ?, ?, ?)
    ";
    $stmt = $pdo->prepare($optionsSql);
    $stmt->execute([
        $reservationId,
        (int)($data['siegeEnfantQuantite'] ?? 0),
        (bool)($data['bouquetFleurs'] ?? false),
        (bool)($data['assistanceAeroport'] ?? false)
    ]);
    
    // 4. Insertion des informations de route (si disponibles)
    if (isset($data['routeInfo']) && $data['routeInfo']) {
        $routeSql = "
            INSERT INTO vtc_route_info (reservation_id, distance, duration)
            VALUES (?, ?, ?)
        ";
        $stmt = $pdo->prepare($routeSql);
        $stmt->execute([
            $reservationId,
            $data['routeInfo']['distance'],
            $data['routeInfo']['duration']
        ]);
    }
    
    // 5. Insertion des informations de prix (si disponibles)
    if (isset($data['priceBreakdown']) && $data['priceBreakdown']) {
        $pricingSql = "
            INSERT INTO vtc_pricing_info (reservation_id, base_price, total_ht, tva_amount, stripe_fees, total_ttc)
            VALUES (?, ?, ?, ?, ?, ?)
        ";
        $stmt = $pdo->prepare($pricingSql);
        $stmt->execute([
            $reservationId,
            $data['priceBreakdown']['basePrice'] ?? 0,
            $data['priceBreakdown']['totalHT'] ?? 0,
            $data['priceBreakdown']['tva'] ?? 0,
            $data['priceBreakdown']['stripeFees'] ?? 0,
            $data['priceBreakdown']['totalTTC'] ?? 0
        ]);
    }
    
    // 6. Insertion des étapes (si disponibles)
    if (isset($data['etapes']) && is_array($data['etapes']) && count($data['etapes']) > 0) {
        $waypointSql = "
            INSERT INTO vtc_waypoints (reservation_id, waypoint_order, address, place_id, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?)
        ";
        $stmt = $pdo->prepare($waypointSql);
        
        foreach ($data['etapes'] as $index => $etape) {
            if (!empty($etape)) {
                $etapePlace = $data['etapesPlaces'][$index] ?? null;
                $stmt->execute([
                    $reservationId,
                    $index + 1,
                    $etape,
                    $etapePlace['place_id'] ?? null,
                    $etapePlace['geometry']['location']['lat'] ?? null,
                    $etapePlace['geometry']['location']['lng'] ?? null
                ]);
            }
        }
    }
    
    // Validation de la transaction
    $pdo->commit();
    
    // Log de succès
    logError("Réservation créée avec succès", ['reservation_id' => $reservationId]);
    
    // Réponse de succès
    jsonResponse([
        'success' => true,
        'message' => 'Réservation enregistrée avec succès',
        'reservation_id' => $reservationId,
        'data' => [
            'service_type' => $data['serviceType'],
            'vehicle_type' => $data['vehicleType'],
            'departure' => $data['depart'],
            'arrival' => $data['arrivee'],
            'date' => $data['dateReservation'],
            'time' => $data['heureReservation'],
            'customer' => $data['prenom'] . ' ' . $data['nom'],
            'email' => $data['email'],
            'phone' => $data['telephone']
        ]
    ], 201);
    
} catch (Exception $e) {
    // Rollback en cas d'erreur
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    // Log de l'erreur
    logError("Erreur lors de la création de réservation", [
        'error' => $e->getMessage(),
        'data' => $data ?? null
    ]);
    
    // Réponse d'erreur
    jsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Erreur lors de l\'enregistrement de la réservation'
    ], 400);
}
?>
