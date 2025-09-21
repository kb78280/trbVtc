<?php
// Configuration de la base de données MySQL OVH
define('DB_HOST', 'your-mysql-host.ovh.net');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_username');
define('DB_PASSWORD', 'your_password');
define('DB_CHARSET', 'utf8mb4');

// Configuration CORS pour votre domaine
define('ALLOWED_ORIGINS', [
    'https://your-domain.com',
    'http://localhost:3000', // Pour le développement
    'http://127.0.0.1:3000'
]);

// Configuration de sécurité
define('API_SECRET_KEY', 'your-secret-api-key-here');
define('MAX_REQUESTS_PER_HOUR', 100);

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
