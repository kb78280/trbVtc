<?php
require_once 'config.php';
require_once 'email-service.php';

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
        // Cas spéciaux pour les champs qui peuvent être "0"
        if (in_array($field, ['nombrePassagers', 'nombreBagages'])) {
            if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                throw new Exception("Champ obligatoire manquant: $field");
            }
        } else {
            if (!isset($data[$field]) || empty($data[$field])) {
                throw new Exception("Champ obligatoire manquant: $field");
            }
        }
    }
    
    // Validation de l'acceptation des conditions
    if (!$data['accepteConditions']) {
        throw new Exception('Vous devez accepter les conditions générales');
    }
    
    // Validation des places Google Maps (optionnelles si adresses texte présentes)
    // Note: originPlace et destinationPlace peuvent être null si l'utilisateur tape manuellement
    
    // Connexion à la base de données
    $pdo = getDBConnection();
    
    // Début de la transaction
    $pdo->beginTransaction();
    
    // 1. Insertion de la réservation principale
    $reservationSql = "
        INSERT INTO vtc_reservations (
            service_type, vehicle_type, departure_address, arrival_address,
            duration_hours, reservation_date, reservation_time,
            passenger_count, baggage_count, payment_method, comments, estimated_price, distance_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    
    // Calculer la distance en km si disponible
    $distanceKm = null;
    if (isset($data['distance']) && is_string($data['distance'])) {
        // Extraire les km de la chaîne "X,Y km" 
        preg_match('/([0-9,\.]+)\s*km/i', $data['distance'], $matches);
        if (!empty($matches[1])) {
            $distanceKm = (float)str_replace(',', '.', $matches[1]);
        }
    } elseif (isset($data['distanceKm']) && is_numeric($data['distanceKm'])) {
        $distanceKm = (float)$data['distanceKm'];
    }
    
    $stmt = $pdo->prepare($reservationSql);
    $stmt->execute([
        $data['serviceType'],
        $data['vehicleType'],
        $data['depart'],
        $data['arrivee'],
        ($data['serviceType'] === 'mise-a-disposition') ? (int)$data['duree'] : null,
        $data['dateReservation'],
        $data['heureReservation'],
        (int)$data['nombrePassagers'],
        (int)$data['nombreBagages'],
        $data['methodePaiement'],
        $data['commentaires'] ?? null,
        $data['estimatedPrice'] ?? 0,
        $distanceKm
    ]);
    
    $reservationId = $pdo->lastInsertId();
    
    // 2. Insertion des informations client (sans nombre_reservations d'abord)
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
    
    // Maintenant calculer et mettre à jour nombre_reservations pour cet email
    $countSql = "SELECT COUNT(*) as count FROM vtc_customer_info WHERE email = ?";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute([$data['email']]);
    $nombreReservations = $countStmt->fetch()['count'];
    
    // Mettre à jour toutes les entrées avec le même email
    $updateCountSql = "UPDATE vtc_customer_info SET nombre_reservations = ? WHERE email = ?";
    $updateStmt = $pdo->prepare($updateCountSql);
    $updateStmt->execute([$nombreReservations, $data['email']]);
    
    // 3. Insertion des options
    $optionsSql = "
        INSERT INTO vtc_reservation_options (reservation_id, child_seat_quantity, rehausseur_quantite, flower_bouquet, airport_assistance)
        VALUES (?, ?, ?, ?, ?)
    ";
    $stmt = $pdo->prepare($optionsSql);
    $stmt->execute([
        $reservationId,
        (int)($data['siegeEnfantQuantite'] ?? 0),
        (int)($data['rehausseurQuantite'] ?? 0),
        (bool)($data['bouquetFleurs'] ?? false),
        (bool)($data['assistanceAeroport'] ?? false)
    ]);
    
    // 4. Note: Les informations de route sont maintenant stockées dans vtc_reservations.distance_km
    // Plus besoin d'insérer dans vtc_route_info (table supprimée)
    
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
    
    // 6. Insertion des étapes (structure simplifiée - seulement l'adresse)
    if (isset($data['etapes']) && is_array($data['etapes']) && count($data['etapes']) > 0) {
        $waypointSql = "
            INSERT INTO vtc_waypoints (reservation_id, waypoint_order, address)
            VALUES (?, ?, ?)
        ";
        $stmt = $pdo->prepare($waypointSql);
        
        foreach ($data['etapes'] as $index => $etape) {
            if (!empty($etape)) {
                $stmt->execute([
                    $reservationId,
                    $index + 1,
                    $etape
                ]);
            }
        }
    }
    
    // Validation de la transaction
    $pdo->commit();
    
    // Log de succès (désactivé temporairement pour debug)
    // logError("Réservation créée avec succès", ['reservation_id' => $reservationId]);
    
    // 7. Envoi des emails de confirmation (désactivé temporairement pour debug)
    /*
    $emailService = new EmailService();
    
    // Préparer les données pour l'email
    $emailData = array_merge($data, ['reservation_id' => $reservationId]);
    
    // Envoyer l'email de confirmation au client
    $clientEmailSent = $emailService->sendReservationConfirmation($emailData);
    
    // Envoyer la notification à l'admin
    $adminEmailSent = $emailService->sendAdminNotification($emailData);
    
    // Log des envois d'emails
    logError("Emails envoyés", [
        'reservation_id' => $reservationId,
        'client_email_sent' => $clientEmailSent,
        'admin_email_sent' => $adminEmailSent
    ]);
    */
    
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
