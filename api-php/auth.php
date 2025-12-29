<?php
require_once 'config.php';

// --- CONFIGURATION SÉCURISÉE ---

// Récupération de la clé secrète depuis l'environnement
$jwtSecret = getenv('JWT_SECRET');
if (!$jwtSecret) {
    // Arrêt immédiat si la clé n'est pas configurée
    http_response_code(500);
    die(json_encode(['error' => 'Erreur de configuration serveur (JWT_SECRET)']));
}
define('JWT_SECRET', $jwtSecret);


// --- DÉBUT DU TRAITEMENT ---

// Configuration des headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Validation de l'origine (sauf pour l'initialisation)
$pathInfo = $_SERVER['PATH_INFO'] ?? '';
if ($pathInfo !== '/init' && !validateOrigin()) {
    jsonResponse(['error' => 'Origine non autorisée'], 403);
}

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            if ($pathInfo === '/login') {
                handleLogin();
            } elseif ($pathInfo === '/init') {
                handleInitUser();
            } else {
                jsonResponse(['error' => 'Endpoint non trouvé'], 404);
            }
            break;
            
        case 'PUT':
            if ($pathInfo === '/change-password') {
                handleChangePassword();
            } else {
                jsonResponse(['error' => 'Endpoint non trouvé'], 404);
            }
            break;
            
        default:
            jsonResponse(['error' => 'Méthode non supportée'], 405);
    }
    
} catch (Exception $e) {
    logError("Erreur API auth", [
        'method' => $_SERVER['REQUEST_METHOD'],
        'error' => $e->getMessage()
    ]);
    
    jsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Erreur d\'authentification'
    ], 400);
}

// Fonction pour initialiser l'utilisateur (à exécuter une seule fois)
function handleInitUser() {
    // Récupération des infos depuis l'environnement
    $initPassword = getenv('ADMIN_INIT_PASSWORD');
    $initIdentifiant = getenv('ADMIN_INIT_IDENTIFIANT');

    if (!$initPassword || !$initIdentifiant) {
        throw new Exception('Configuration ADMIN_INIT_PASSWORD ou ADMIN_INIT_IDENTIFIANT manquante');
    }

    $pdo = getDBConnection();
    
    // Vérifier si l'utilisateur existe déjà
    $checkSql = "SELECT id FROM vtc_user WHERE username = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$initIdentifiant]);
    
    $passwordHash = password_hash($initPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    
    if ($checkStmt->fetch()) {
        // Utilisateur existe, mettre à jour le mot de passe
        $updateSql = "UPDATE vtc_user SET password_hash = ? WHERE username = ?";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([$passwordHash, $initIdentifiant]);
        
        logError("Mot de passe admin réinitialisé via script", ['username' => $initIdentifiant]);
        
        jsonResponse([
            'success' => true,
            'message' => 'Mot de passe administrateur mis à jour'
        ]);
    } else {
        // Créer l'utilisateur
        $insertSql = "INSERT INTO vtc_user (username, password_hash) VALUES (?, ?)";
        $insertStmt = $pdo->prepare($insertSql);
        $insertStmt->execute([$initIdentifiant, $passwordHash]);
        
        logError("Utilisateur admin créé", ['username' => $initIdentifiant]);
        
        jsonResponse([
            'success' => true,
            'message' => 'Utilisateur administrateur créé avec succès'
        ], 201);
    }
}

// Fonction de connexion
function handleLogin() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['username']) || !isset($data['password'])) {
        throw new Exception('Username et password requis');
    }
    
    $pdo = getDBConnection();
    
    // Récupérer l'utilisateur
    $sql = "SELECT id, username, password_hash FROM vtc_user WHERE username = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($data['password'], $user['password_hash'])) {
        // Log de tentative de connexion échouée
        logError("Tentative de connexion échouée", [
            'username' => $data['username'],
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        // Attendre un peu pour éviter les attaques par force brute
        sleep(2);
        
        throw new Exception('Identifiants incorrects');
    }
    
    // Générer un JWT token
    $payload = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60) // 24 heures
    ];
    
    $token = generateJWT($payload);
    
    // Log de connexion réussie
    logError("Connexion réussie", [
        'username' => $user['username'],
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);
    
    jsonResponse([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username']
        ],
        'message' => 'Connexion réussie'
    ]);
}

// Fonction pour changer le mot de passe
function handleChangePassword() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['current_password']) || !isset($data['new_password'])) {
        throw new Exception('Mot de passe actuel et nouveau mot de passe requis');
    }
    
    // Vérifier le token JWT
    $token = getBearerToken();
    if (!$token) {
        throw new Exception('Token d\'authentification requis');
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        throw new Exception('Token invalide');
    }
    
    $pdo = getDBConnection();
    
    // Récupérer l'utilisateur actuel
    $sql = "SELECT id, username, password_hash FROM vtc_user WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('Utilisateur non trouvé');
    }
    
    // Vérifier le mot de passe actuel
    if (!password_verify($data['current_password'], $user['password_hash'])) {
        logError("Tentative de changement de mot de passe avec mauvais mot de passe actuel", [
            'username' => $user['username']
        ]);
        throw new Exception('Mot de passe actuel incorrect');
    }
    
    // Valider le nouveau mot de passe
    if (strlen($data['new_password']) < 8) {
        throw new Exception('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }
    
    // Mettre à jour le mot de passe
    $newPasswordHash = password_hash($data['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $updateSql = "UPDATE vtc_user SET password_hash = ? WHERE id = ?";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([$newPasswordHash, $user['id']]);
    
    logError("Mot de passe changé", ['username' => $user['username']]);
    
    jsonResponse([
        'success' => true,
        'message' => 'Mot de passe mis à jour avec succès'
    ]);
}

// Fonction pour générer un JWT simple
function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

// Fonction pour vérifier un JWT
function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($base64Header, $base64Payload, $base64Signature) = $parts;
    
    $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Signature));
    $expectedSignature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
    
    if (!hash_equals($signature, $expectedSignature)) {
        return false;
    }
    
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);
    
    if (!$payload || $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

// Fonction pour extraire le token Bearer
function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}
?>