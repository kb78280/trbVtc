<?php
require_once 'config.php';

// --- 1. GESTION CORS PRIORITAIRE ---
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// On valide l'origine immédiatement
$originIsValid = validateOrigin();

// Si c'est une requête OPTIONS (Preflight), on s'arrête là avec un succès 200
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Si l'origine n'est pas valide (et que ce n'est pas l'initialisation), on bloque
$pathInfo = $_SERVER['PATH_INFO'] ?? '';
if ($pathInfo !== '/init' && !$originIsValid) {
    // Note : validateOrigin() renvoie false si l'origine n'est pas dans la liste
    jsonResponse(['error' => 'Origine non autorisée'], 403);
}

// --- 2. VÉRIFICATION CONFIGURATION ---
$jwtSecret = getenv('JWT_SECRET');

if (!$jwtSecret) {
    // Si ça plante ici, le navigateur recevra bien le JSON d'erreur grâce aux headers ci-dessus
    http_response_code(500);
    die(json_encode(['error' => 'Erreur de configuration serveur (JWT_SECRET manquant dans les variables d\'environnement)']));
}
define('JWT_SECRET', $jwtSecret);


// --- 3. ROUTAGE ET LOGIQUE ---
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
    
    // On renvoie une 401 si c'est une erreur d'identifiants, sinon 400
    $status = ($e->getMessage() === 'Identifiants incorrects') ? 401 : 400;

    jsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
        'message' => 'Erreur d\'authentification'
    ], $status);
}

// --- 4. FONCTIONS ---

function handleInitUser() {
    $initPassword = getenv('ADMIN_INIT_PASSWORD');
    $initIdentifiant = getenv('ADMIN_INIT_IDENTIFIANT');

    if (!$initPassword || !$initIdentifiant) {
        throw new Exception('Configuration ADMIN_INIT_PASSWORD ou ADMIN_INIT_IDENTIFIANT manquante');
    }

    $pdo = getDBConnection();
    
    $checkSql = "SELECT id FROM vtc_user WHERE username = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$initIdentifiant]);
    
    $passwordHash = password_hash($initPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    
    if ($checkStmt->fetch()) {
        $updateSql = "UPDATE vtc_user SET password_hash = ? WHERE username = ?";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([$passwordHash, $initIdentifiant]);
        
        logError("Mot de passe admin réinitialisé via script", ['username' => $initIdentifiant]);
        
        jsonResponse(['success' => true, 'message' => 'Mot de passe administrateur mis à jour']);
    } else {
        $insertSql = "INSERT INTO vtc_user (username, password_hash) VALUES (?, ?)";
        $insertStmt = $pdo->prepare($insertSql);
        $insertStmt->execute([$initIdentifiant, $passwordHash]);
        
        logError("Utilisateur admin créé", ['username' => $initIdentifiant]);
        
        jsonResponse(['success' => true, 'message' => 'Utilisateur administrateur créé avec succès'], 201);
    }
}

function handleLogin() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['username']) || !isset($data['password'])) {
        throw new Exception('Username et password requis');
    }
    
    $pdo = getDBConnection();
    
    $sql = "SELECT id, username, password_hash FROM vtc_user WHERE username = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($data['password'], $user['password_hash'])) {
        logError("Tentative de connexion échouée", ['username' => $data['username'], 'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
        sleep(2); // Anti brute-force
        throw new Exception('Identifiants incorrects');
    }
    
    // Payload du Token
    $payload = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60) // 24 heures
    ];
    
    $token = generateJWT($payload);
    
    logError("Connexion réussie", ['username' => $user['username'], 'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
    
    jsonResponse([
        'success' => true,
        'token' => $token,
        'user' => ['id' => $user['id'], 'username' => $user['username']],
        'message' => 'Connexion réussie'
    ]);
}

function handleChangePassword() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['current_password']) || !isset($data['new_password'])) {
        throw new Exception('Données incomplètes');
    }
    
    $token = getBearerToken();
    if (!$token) throw new Exception('Token requis');
    
    $payload = verifyJWT($token);
    if (!$payload) throw new Exception('Token invalide');
    
    $pdo = getDBConnection();
    
    $sql = "SELECT id, username, password_hash FROM vtc_user WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) throw new Exception('Utilisateur non trouvé');
    
    if (!password_verify($data['current_password'], $user['password_hash'])) {
        throw new Exception('Mot de passe actuel incorrect');
    }
    
    if (strlen($data['new_password']) < 8) {
        throw new Exception('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }
    
    $newPasswordHash = password_hash($data['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $updateStmt = $pdo->prepare("UPDATE vtc_user SET password_hash = ? WHERE id = ?");
    $updateStmt->execute([$newPasswordHash, $user['id']]);
    
    logError("Mot de passe changé", ['username' => $user['username']]);
    
    jsonResponse(['success' => true, 'message' => 'Mot de passe mis à jour']);
}

// --- UTILITAIRES JWT ---

function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    list($h, $p, $s) = $parts;
    $sig = base64_decode(str_replace(['-', '_'], ['+', '/'], $s));
    if (!hash_equals($sig, hash_hmac('sha256', $h . "." . $p, JWT_SECRET, true))) return false;
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $p)), true);
    return ($payload && $payload['exp'] > time()) ? $payload : false;
}

function getBearerToken() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? null; // Gestion minuscule/majuscule
    if ($auth && preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
        return $matches[1];
    }
    return null;
}
?>