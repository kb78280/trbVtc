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

try {
    // Test de connexion à la base de données
    $pdo = getDBConnection();
    
    // Test d'une requête simple
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    // Test des tables (optionnel)
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch()) {
        $tables[] = array_values($row)[0];
    }
    
    // Réponse de succès
    jsonResponse([
        'success' => true,
        'message' => 'API PHP fonctionnelle',
        'database' => [
            'connected' => true,
            'test_query' => $result,
            'tables' => $tables
        ],
        'server_info' => [
            'php_version' => phpversion(),
            'mysql_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    // Log de l'erreur
    logError("Erreur lors du test de l'API", ['error' => $e->getMessage()]);
    
    // Réponse d'erreur
    jsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Erreur de connexion à l\'API ou à la base de données'
    ], 500);
}
?>
