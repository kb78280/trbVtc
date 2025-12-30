<?php
require_once 'config.php';
require_once 'email-service.php';

// =================================================================
// ⚙️ CONFIGURATION DES PRIX ET TVA (EN DUR)
// =================================================================

// 1. Taux de TVA
const TVA_TRANSFERT = 0.10; // 10% (Transport)
const TVA_MAD       = 0.20; // 20% (Mise à disposition)

// 2. Prix des Options (ATTENTION : Ce sont maintenant des PRIX H.T.)
const PRIX_SIEGE_ENFANT = 50.0;     
const PRIX_REHAUSSEUR   = 30.0;     
const PRIX_FLEURS       = 150.0;    
const PRIX_ACCUEIL      = 100.0;    

// 3. Tolérance technique (Ecart autorisé entre JS et PHP)
const TOLERANCE_PRIX    = 2.0; 

// =================================================================
// 🛡️ HEADERS & SÉCURITÉ
// =================================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (!validateOrigin()) { jsonResponse(['error' => 'Origine non autorisée'], 403); }
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { jsonResponse(['error' => 'Méthode non autorisée'], 405); }

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) { throw new Exception('Données JSON invalides'); }

    // Validation des champs requis
    $required = ['serviceType', 'vehicleType', 'dateReservation', 'nom', 'email'];
    foreach ($required as $field) {
        if (empty($data[$field])) throw new Exception("Champ manquant : $field");
    }

    $pdo = getDBConnection();
    
    // =================================================================
    // 💰 CALCUL SÉCURISÉ DU PRIX (BASE HT + TVA = TTC)
    // =================================================================
    
    // 1. Détermination de la TVA applicable
    $tauxTva = ($data['serviceType'] === 'transfert') ? TVA_TRANSFERT : TVA_MAD;

    // 2. Récupération Distance
    $distanceKm = 0.0;
    if (isset($data['distanceKm']) && is_numeric($data['distanceKm'])) {
        $distanceKm = (float)$data['distanceKm'];
    } elseif (isset($data['distance']) && is_string($data['distance'])) {
        preg_match('/([0-9,\.]+)\s*km/i', $data['distance'], $matches);
        if (!empty($matches[1])) $distanceKm = (float)str_replace(',', '.', $matches[1]);
    }

    // 3. Calcul Prix VÉHICULE (Base HT)
    // Mapping: berline -> confort
    $dbVehicleType = ($data['vehicleType'] === 'berline') ? 'confort' : $data['vehicleType'];

    $stmtRate = $pdo->prepare("SELECT prix_base_mad, taux_km, prise_en_charge FROM vtc_voitures WHERE type = ? LIMIT 1");
    $stmtRate->execute([$dbVehicleType]);
    $vRates = $stmtRate->fetch();

    if (!$vRates) throw new Exception("Tarif introuvable pour le véhicule : " . $dbVehicleType);

    $priceTrajetHT = 0.0;
    // Gestion de la prise en charge
    $priseEnCharge = isset($vRates['prise_en_charge']) ? (float)$vRates['prise_en_charge'] : 0.0;

    if ($data['serviceType'] === 'transfert') {
        // Formule Transfert (HT) : (Km * Taux) + Prise en charge
        $priceTrajetHT = ($distanceKm * (float)$vRates['taux_km']) + $priseEnCharge;
        
        // Minimum de perception (HT)
        if ($priceTrajetHT < (float)$vRates['prix_base_mad']) {
            $priceTrajetHT = (float)$vRates['prix_base_mad'];
        }
    } else {
        // Formule Mise à disposition (HT) : Heures * Tarif horaire
        $duree = (int)($data['duree'] ?? 0);
        $priceTrajetHT = $duree * (float)$vRates['prix_base_mad'];
    }

    // 4. Calcul Prix OPTIONS (Base HT - via constantes)
    $priceOptionsHT = 0.0;
    
    $qtySiege = (int)($data['siegeEnfantQuantite'] ?? 0);
    $priceOptionsHT += $qtySiege * PRIX_SIEGE_ENFANT;

    $qtyRehausseur = (int)($data['rehausseurQuantite'] ?? 0);
    $priceOptionsHT += $qtyRehausseur * PRIX_REHAUSSEUR;

    if (!empty($data['bouquetFleurs'])) {
        $priceOptionsHT += PRIX_FLEURS;
    }

    if (!empty($data['assistanceAeroport'])) {
        $priceOptionsHT += PRIX_ACCUEIL;
    }

    // 5. CALCUL FINAL (HT + TVA = TTC)
    $totalHT = $priceTrajetHT + $priceOptionsHT;
    
    // Calcul du montant de la TVA
    $montantTVA = $totalHT * $tauxTva;
    
    // Calcul du TTC final
    $serverTotalTTC = $totalHT + $montantTVA;

    // 6. Validation (Comparaison avec le prix Front)
    $frontendPrice = (float)($data['estimatedPrice'] ?? 0);

    // Vérification de sécurité
    if (abs($serverTotalTTC - $frontendPrice) > TOLERANCE_PRIX) {
        logError("⚠️ ALERTE PRIX", [
            'client_ttc' => $frontendPrice,
            'server_ttc' => $serverTotalTTC,
            'detail_ht' => $totalHT,
            'tva_amount' => $montantTVA
        ]);
    }

    // On force le prix calculé par le serveur
    $finalPriceTTC = $serverTotalTTC;

    // Mise à jour de data pour l'email
    $data['estimatedPrice'] = $finalPriceTTC;

    // =================================================================
    // 💾 INSERTION EN BASE DE DONNÉES
    // =================================================================

    $pdo->beginTransaction();
    
    // 1. Table: vtc_reservations
    $sqlResa = "INSERT INTO vtc_reservations (
        service_type, vehicle_type, departure_address, arrival_address,
        duration_hours, reservation_date, reservation_time,
        passenger_count, baggage_count, payment_method, comments, 
        estimated_price, distance_km, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')";
    
    $stmt = $pdo->prepare($sqlResa);
    $stmt->execute([
        $data['serviceType'],
        $dbVehicleType,
        $data['depart'],
        $data['arrivee'],
        ($data['serviceType'] === 'mise-a-disposition') ? (int)$data['duree'] : null,
        $data['dateReservation'],
        $data['heureReservation'],
        (int)$data['nombrePassagers'],
        (int)$data['nombreBagages'],
        $data['methodePaiement'],
        $data['commentaires'] ?? null,
        $finalPriceTTC, // Prix TTC final
        $distanceKm
    ]);
    
    $reservationId = $pdo->lastInsertId();

    // 2. Table: vtc_customer_info
    $sqlCust = "INSERT INTO vtc_customer_info (reservation_id, first_name, last_name, phone, email) VALUES (?, ?, ?, ?, ?)";
    $pdo->prepare($sqlCust)->execute([$reservationId, $data['prenom'], $data['nom'], $data['telephone'], $data['email']]);

    // Mise à jour compteur réservations
    $nb = $pdo->prepare("SELECT COUNT(*) FROM vtc_customer_info WHERE email = ?");
    $nb->execute([$data['email']]);
    $count = $nb->fetchColumn();
    $pdo->prepare("UPDATE vtc_customer_info SET nombre_reservations = ? WHERE email = ?")->execute([$count, $data['email']]);

    // 3. Table: vtc_reservation_options
    $sqlOpt = "INSERT INTO vtc_reservation_options (
        reservation_id, 
        child_seat_quantity, 
        rehausseur_quantite, 
        flower_bouquet, 
        airport_assistance
    ) VALUES (?, ?, ?, ?, ?)";
    
    $pdo->prepare($sqlOpt)->execute([
        $reservationId, 
        $qtySiege, 
        $qtyRehausseur, 
        !empty($data['bouquetFleurs']) ? 1 : 0, 
        !empty($data['assistanceAeroport']) ? 1 : 0
    ]);

    // 4. Table: vtc_waypoints (Etapes)
    if (isset($data['etapes']) && is_array($data['etapes'])) {
        $stmtWp = $pdo->prepare("INSERT INTO vtc_waypoints (reservation_id, waypoint_order, address) VALUES (?, ?, ?)");
        foreach ($data['etapes'] as $i => $addr) {
            if (trim($addr)) $stmtWp->execute([$reservationId, $i + 1, trim($addr)]);
        }
    }

    // 5. Table: vtc_pricing_info
    // On stocke le HT dans base_price et le TTC dans total_ttc
    $sqlPrice = "INSERT INTO vtc_pricing_info (reservation_id, base_price, total_ttc, currency) VALUES (?, ?, ?, 'MAD')";
    $pdo->prepare($sqlPrice)->execute([
        $reservationId, 
        $totalHT, // Ici on stocke le vrai HT calculé
        $finalPriceTTC
    ]);

    $pdo->commit();

    // =================================================================
    // 📧 ENVOI EMAILS
    // =================================================================
    try {
        sendConfirmationEmails($reservationId, $data, $finalPriceTTC);
    } catch (Exception $e) {
        logError("Erreur envoi email: " . $e->getMessage());
    }

    jsonResponse([
        'success' => true,
        'message' => 'Réservation enregistrée',
        'reservation_id' => $reservationId,
        'final_price' => $finalPriceTTC,
        'tva_applied' => $tauxTva
    ], 201);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollback();
    logError("Erreur critique: " . $e->getMessage());
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
}
?>