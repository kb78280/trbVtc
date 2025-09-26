<?php
require_once 'config.php';

// Configuration des headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

try {
    // Connexion à la base de données
    $pdo = getDBConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $pathInfo = $_SERVER['PATH_INFO'] ?? '';
    $vehicleId = null;
    
    // Extraire l'ID du véhicule depuis l'URL si présent
    if ($pathInfo && preg_match('/^\/(\d+)$/', $pathInfo, $matches)) {
        $vehicleId = (int)$matches[1];
    }
    
    switch ($method) {
        case 'GET':
            handleGetVehicles($pdo, $vehicleId);
            break;
            
        case 'POST':
            handleCreateVehicle($pdo);
            break;
            
        case 'PUT':
            if (!$vehicleId) {
                throw new Exception('ID du véhicule requis pour la mise à jour');
            }
            handleUpdateVehicle($pdo, $vehicleId);
            break;
            
        case 'DELETE':
            if (!$vehicleId) {
                throw new Exception('ID du véhicule requis pour la suppression');
            }
            handleDeleteVehicle($pdo, $vehicleId);
            break;
            
        default:
            jsonResponse(['error' => 'Méthode non supportée'], 405);
    }
    
} catch (Exception $e) {
    logError("Erreur API véhicules", [
        'method' => $_SERVER['REQUEST_METHOD'],
        'error' => $e->getMessage()
    ]);
    
    jsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Erreur lors de l\'opération sur les véhicules'
    ], 400);
}

// Fonction pour récupérer les véhicules
function handleGetVehicles($pdo, $vehicleId = null) {
    if ($vehicleId) {
        // Récupérer un véhicule spécifique
        $sql = "SELECT * FROM vtc_voitures WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$vehicleId]);
        $vehicle = $stmt->fetch();
        
        if (!$vehicle) {
            throw new Exception('Véhicule non trouvé');
        }
        
        jsonResponse([
            'success' => true,
            'data' => $vehicle,
            'message' => 'Véhicule récupéré avec succès'
        ]);
    } else {
        // Vérifier si c'est une requête pour le formulaire de réservation (frontend)
        $isReservationRequest = isset($_GET['for_reservation']) && $_GET['for_reservation'] === 'true';
        
        if ($isReservationRequest) {
            // Format spécial pour le formulaire de réservation
            $sql = "SELECT * FROM vtc_voitures ORDER BY type, nom";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $vehicles = $stmt->fetchAll();
            
            // Organiser les véhicules par type pour faciliter l'utilisation côté frontend
            $organizedVehicles = [
                'confort' => [],
                'van' => []
            ];
            
            $allVehicles = [];
            
            foreach ($vehicles as $vehicle) {
                // Ajouter des informations calculées utiles pour la réservation
                $vehicle['display_name'] = $vehicle['nom'];
                $vehicle['capacity_info'] = $vehicle['nombre_places'] . ' places, ' . $vehicle['nombre_bagages'] . ' bagages';
                $vehicle['price_info'] = [
                    'base_hourly' => floatval($vehicle['prix_base_mad']),
                    'rate_per_km' => floatval($vehicle['taux_km'])
                ];
                
                // Ajouter au tableau organisé par type
                $organizedVehicles[$vehicle['type']][] = $vehicle;
                
                // Ajouter au tableau global
                $allVehicles[] = $vehicle;
            }
            
            jsonResponse([
                'success' => true,
                'data' => [
                    'vehicles' => $allVehicles,
                    'by_type' => $organizedVehicles,
                    'count' => count($allVehicles)
                ],
                'message' => 'Véhicules récupérés avec succès'
            ]);
        } else {
            // Format standard pour l'administration (avec pagination)
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $offset = ($page - 1) * $limit;
            
            $sql = "SELECT * FROM vtc_voitures ORDER BY created_at DESC LIMIT ? OFFSET ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$limit, $offset]);
            $vehicles = $stmt->fetchAll();
            
            // Compter le total
            $countSql = "SELECT COUNT(*) as total FROM vtc_voitures";
            $countStmt = $pdo->prepare($countSql);
            $countStmt->execute();
            $totalCount = $countStmt->fetch()['total'];
            
            jsonResponse([
                'success' => true,
                'data' => $vehicles,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => (int)$totalCount,
                    'total_pages' => ceil($totalCount / $limit)
                ],
                'message' => 'Véhicules récupérés avec succès'
            ]);
        }
    }
}

// Fonction pour créer un véhicule
function handleCreateVehicle($pdo) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Données JSON invalides');
    }
    
    // Validation des champs obligatoires
    $requiredFields = ['nom', 'plaque', 'nombre_places', 'type', 'prix_base_mad', 'taux_km'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || ($data[$field] === '' || $data[$field] === null)) {
            throw new Exception("Champ obligatoire manquant: $field");
        }
    }
    
    // Validation du type
    if (!in_array($data['type'], ['confort', 'van'])) {
        throw new Exception('Type de véhicule invalide. Doit être "confort" ou "van"');
    }
    
    // Validation des nombres
    if (!is_numeric($data['nombre_places']) || $data['nombre_places'] < 1) {
        throw new Exception('Le nombre de places doit être un nombre positif');
    }
    
    if (!is_numeric($data['prix_base_mad']) || $data['prix_base_mad'] < 0) {
        throw new Exception('Le prix de base MAD doit être un nombre positif');
    }
    
    if (!is_numeric($data['taux_km']) || $data['taux_km'] < 0) {
        throw new Exception('Le taux par kilomètre doit être un nombre positif');
    }
    
    $nombreBagages = isset($data['nombre_bagages']) && is_numeric($data['nombre_bagages']) 
        ? (int)$data['nombre_bagages'] 
        : 0;
    
    // Vérifier que la plaque n'existe pas déjà
    $checkSql = "SELECT id FROM vtc_voitures WHERE plaque = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$data['plaque']]);
    if ($checkStmt->fetch()) {
        throw new Exception('Un véhicule avec cette plaque existe déjà');
    }
    
    // Insertion
    $sql = "INSERT INTO vtc_voitures (nom, plaque, nombre_places, nombre_bagages, type, prix_base_mad, taux_km) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['nom'],
        $data['plaque'],
        (int)$data['nombre_places'],
        $nombreBagages,
        $data['type'],
        (float)$data['prix_base_mad'],
        (float)$data['taux_km']
    ]);
    
    $vehicleId = $pdo->lastInsertId();
    
    // Récupérer le véhicule créé
    $newVehicle = $pdo->prepare("SELECT * FROM vtc_voitures WHERE id = ?");
    $newVehicle->execute([$vehicleId]);
    $vehicle = $newVehicle->fetch();
    
    logError("Véhicule créé", ['vehicle_id' => $vehicleId, 'plaque' => $data['plaque']]);
    
    jsonResponse([
        'success' => true,
        'data' => $vehicle,
        'message' => 'Véhicule créé avec succès'
    ], 201);
}

// Fonction pour mettre à jour un véhicule
function handleUpdateVehicle($pdo, $vehicleId) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Données JSON invalides');
    }
    
    // Vérifier que le véhicule existe
    $checkSql = "SELECT * FROM vtc_voitures WHERE id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$vehicleId]);
    $existingVehicle = $checkStmt->fetch();
    
    if (!$existingVehicle) {
        throw new Exception('Véhicule non trouvé');
    }
    
    // Préparer les champs à mettre à jour
    $updateFields = [];
    $updateValues = [];
    
    if (isset($data['nom']) && !empty($data['nom'])) {
        $updateFields[] = "nom = ?";
        $updateValues[] = $data['nom'];
    }
    
    if (isset($data['plaque']) && !empty($data['plaque'])) {
        // Vérifier que la nouvelle plaque n'existe pas déjà (sauf pour ce véhicule)
        $checkPlaqueSql = "SELECT id FROM vtc_voitures WHERE plaque = ? AND id != ?";
        $checkPlaqueStmt = $pdo->prepare($checkPlaqueSql);
        $checkPlaqueStmt->execute([$data['plaque'], $vehicleId]);
        if ($checkPlaqueStmt->fetch()) {
            throw new Exception('Un autre véhicule avec cette plaque existe déjà');
        }
        
        $updateFields[] = "plaque = ?";
        $updateValues[] = $data['plaque'];
    }
    
    if (isset($data['nombre_places']) && is_numeric($data['nombre_places']) && $data['nombre_places'] > 0) {
        $updateFields[] = "nombre_places = ?";
        $updateValues[] = (int)$data['nombre_places'];
    }
    
    if (isset($data['nombre_bagages']) && is_numeric($data['nombre_bagages'])) {
        $updateFields[] = "nombre_bagages = ?";
        $updateValues[] = (int)$data['nombre_bagages'];
    }
    
    if (isset($data['type']) && in_array($data['type'], ['confort', 'van'])) {
        $updateFields[] = "type = ?";
        $updateValues[] = $data['type'];
    }
    
    if (isset($data['prix_base_mad']) && is_numeric($data['prix_base_mad']) && $data['prix_base_mad'] >= 0) {
        $updateFields[] = "prix_base_mad = ?";
        $updateValues[] = (float)$data['prix_base_mad'];
    }
    
    if (isset($data['taux_km']) && is_numeric($data['taux_km']) && $data['taux_km'] >= 0) {
        $updateFields[] = "taux_km = ?";
        $updateValues[] = (float)$data['taux_km'];
    }
    
    if (empty($updateFields)) {
        throw new Exception('Aucune donnée valide à mettre à jour');
    }
    
    // Mise à jour
    $updateValues[] = $vehicleId;
    $sql = "UPDATE vtc_voitures SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($updateValues);
    
    // Récupérer le véhicule mis à jour
    $updatedVehicle = $pdo->prepare("SELECT * FROM vtc_voitures WHERE id = ?");
    $updatedVehicle->execute([$vehicleId]);
    $vehicle = $updatedVehicle->fetch();
    
    logError("Véhicule mis à jour", ['vehicle_id' => $vehicleId]);
    
    jsonResponse([
        'success' => true,
        'data' => $vehicle,
        'message' => 'Véhicule mis à jour avec succès'
    ]);
}

// Fonction pour supprimer un véhicule
function handleDeleteVehicle($pdo, $vehicleId) {
    // Vérifier que le véhicule existe
    $checkSql = "SELECT * FROM vtc_voitures WHERE id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$vehicleId]);
    $vehicle = $checkStmt->fetch();
    
    if (!$vehicle) {
        throw new Exception('Véhicule non trouvé');
    }
    
    // TODO: Vérifier s'il y a des réservations liées à ce véhicule
    // Pour l'instant, on supprime directement
    
    $sql = "DELETE FROM vtc_voitures WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$vehicleId]);
    
    logError("Véhicule supprimé", ['vehicle_id' => $vehicleId, 'plaque' => $vehicle['plaque']]);
    
    jsonResponse([
        'success' => true,
        'message' => 'Véhicule supprimé avec succès'
    ]);
}
?>