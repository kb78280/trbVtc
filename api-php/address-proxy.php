<?php
// api-php/address-proxy.php
require_once 'config.php';

// --- 1. Configuration CORS ---
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Validation origine
if (function_exists('validateOrigin') && !validateOrigin()) {
    http_response_code(403);
    echo json_encode(['error' => 'Origine non autorisée']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- 2. Validation Entrée ---
$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (strlen($query) < 3) {
    echo json_encode([]);
    exit;
}

// --- 3. Appel vers API Adresse (Data.gouv.fr) ---
// Documentation : https://geo.api.gouv.fr/adresse
// Coordonnées de Paris (Centre approximatif) pour prioriser l'Île-de-France
$lat = '48.8566';
$lon = '2.3522';

$url = "https://api-adresse.data.gouv.fr/search/?q=" . urlencode($query) . "&limit=5&autocomplete=1&lat=" . $lat . "&lon=" . $lon;;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
// L'API Gouv est très permissive, pas besoin de User-Agent spécifique complexe
curl_setopt($ch, CURLOPT_USERAGENT, "VTC-Paris-App"); 

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// --- 4. Gestion Erreurs ---
if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur technique (cURL)', 'debug' => $curlError]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code(503);
    echo json_encode(['error' => 'API Adresse indisponible', 'code' => $httpCode]);
    exit;
}

// --- 5. Transformation des données (Adaptateur) ---
// On transforme le format GeoJSON de l'API Gouv en format "plat"
// pour que votre Frontend React n'ait pas besoin d'être modifié.

$data = json_decode($response, true);
$formattedResults = [];

if (isset($data['features']) && is_array($data['features'])) {
    foreach ($data['features'] as $feature) {
        $props = $feature['properties'];
        $geometry = $feature['geometry'];
        
        // Construction de l'objet compatible avec votre code React existant
        $formattedResults[] = [
            'place_id'     => $props['id'] ?? uniqid(),
            'osm_id'       => $props['id'] ?? uniqid(), // Pour la clé "key" dans React
            'display_name' => $props['label'], // Ex: "8 Boulevard du Port 80000 Amiens"
            'lat'          => (string)$geometry['coordinates'][1], // Latitude
            'lon'          => (string)$geometry['coordinates'][0], // Longitude
            // Champs supplémentaires utiles si besoin plus tard
            'city'         => $props['city'] ?? '',
            'postcode'     => $props['postcode'] ?? '',
            'context'      => $props['context'] ?? '' // Ex: "80, Somme, Hauts-de-France"
        ];
    }
}

// Renvoi du JSON propre
echo json_encode($formattedResults);
?>