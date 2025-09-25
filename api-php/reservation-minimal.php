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

// Test simple
jsonResponse(['success' => true, 'message' => 'Test CORS OK']);
?>
