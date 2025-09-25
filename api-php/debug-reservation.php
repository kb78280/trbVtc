<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

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
    
    echo "=== DEBUG DONNÉES REÇUES ===\n";
    echo "serviceType: " . ($data['serviceType'] ?? 'MANQUANT') . "\n";
    echo "duree: " . ($data['duree'] ?? 'MANQUANT') . "\n";
    echo "distance: " . ($data['distance'] ?? 'MANQUANT') . "\n";
    echo "estimatedPrice: " . ($data['estimatedPrice'] ?? 'MANQUANT') . "\n";
    echo "nombrePassagers: " . ($data['nombrePassagers'] ?? 'MANQUANT') . "\n";
    echo "nombreBagages: " . ($data['nombreBagages'] ?? 'MANQUANT') . "\n";
    
    // Test du calcul de distance
    $distanceKm = null;
    if (isset($data['distance']) && is_string($data['distance'])) {
        preg_match('/([0-9,\.]+)\s*km/i', $data['distance'], $matches);
        if (!empty($matches[1])) {
            $distanceKm = (float)str_replace(',', '.', $matches[1]);
        }
    }
    echo "distanceKm calculé: " . ($distanceKm ?? 'NULL') . "\n";
    
    // Test de la durée pour mise à disposition
    $dureeValue = ($data['serviceType'] === 'mise-a-disposition') ? (int)($data['duree'] ?? 0) : null;
    echo "dureeValue: " . ($dureeValue ?? 'NULL') . "\n";
    
    echo "=== FIN DEBUG ===\n";
    
} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>
