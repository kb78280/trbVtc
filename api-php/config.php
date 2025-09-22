<?php
// Configuration de la base de données MySQL OVH
define('DB_HOST', 'vtctrau84.mysql.db:3306');
define('DB_NAME', 'vtctrau84');
define('DB_USER', 'vtctrau84');
define('DB_PASSWORD', 'xZs7R7P8yjmy');
define('DB_CHARSET', 'utf8mb4');

// Configuration CORS pour votre domaine
define('ALLOWED_ORIGINS', [
    'https://vtc-transport-conciergerie.fr',    // Votre site WordPress (futur)
    'https://www.vtc-transport-conciergerie.fr', // Version www
    'https://trb-vtc.vercel.app',               // Application Vercel de test
    'https://trb-vtc-git-main.vercel.app',      // Branches Vercel
    'https://trb-vtc-git-uat.vercel.app',       // Branch UAT Vercel
    'http://localhost:3000',                    // Développement local
    'http://127.0.0.1:3000'                    // Développement local
]);

// Configuration de sécurité (optionnelle pour usage futur)
define('API_SECRET_KEY', 'vtc_trb_2024_' . hash('sha256', 'vtctrau84' . date('Y-m')));
define('MAX_REQUESTS_PER_HOUR', 100); // Limite de requêtes par IP

// Fonction pour établir la connexion PDO
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Erreur de connexion DB: " . $e->getMessage());
        throw new Exception("Erreur de connexion à la base de données");
    }
}

// Fonction pour valider l'origine CORS
function validateOrigin() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
        return true;
    }
    
    return false;
}

// Fonction pour loguer les erreurs
function logError($message, $data = null) {
    $log = date('Y-m-d H:i:s') . " - " . $message;
    if ($data) {
        $log .= " - Data: " . json_encode($data);
    }
    error_log($log);
}

// Fonction pour répondre en JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>
