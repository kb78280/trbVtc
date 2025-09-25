<?php
/**
 * Script de test de connexion à la base de données MySQL OVH
 * À exécuter une fois pour vérifier que tout fonctionne
 */

require_once 'config.php';

echo "<h2>🔧 Test de connexion MySQL OVH</h2>";

try {
    // Test de connexion
    echo "<p>📡 Tentative de connexion à la base de données...</p>";
    $pdo = getDBConnection();
    echo "<p>✅ <strong>Connexion réussie !</strong></p>";
    
    // Test des tables VTC
    echo "<p>🔍 Vérification des tables VTC...</p>";
    $tables = [
        'vtc_reservations',
        'vtc_customer_info', 
        'vtc_reservation_options',
        'vtc_waypoints',
        // 'vtc_route_info', // Table supprimée
        'vtc_pricing_info'
    ];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "<p>✅ Table <code>$table</code> existe</p>";
        } else {
            echo "<p>❌ Table <code>$table</code> manquante</p>";
        }
    }
    
    // Test d'insertion simple
    echo "<p>🧪 Test d'insertion de données VTC...</p>";
    $testSql = "INSERT INTO vtc_reservations (
        service_type, vehicle_type, departure_address, arrival_address,
        reservation_date, reservation_time, passenger_count, baggage_count,
        payment_method, estimated_price
    ) VALUES (
        'transfert', 'berline', 'Test Départ', 'Test Arrivée',
        '2024-12-31', '23:59:00', 1, 0, 'sur-place', 50.00
    )";
    
    $pdo->exec($testSql);
    $testId = $pdo->lastInsertId();
    echo "<p>✅ Insertion test réussie (ID: $testId)</p>";
    
    // Nettoyage du test
    $pdo->exec("DELETE FROM vtc_reservations WHERE id = $testId");
    echo "<p>🧹 Données de test supprimées</p>";
    
    echo "<h3>🎉 Tous les tests sont passés avec succès !</h3>";
    echo "<p><strong>Votre base de données est prête à recevoir des réservations.</strong></p>";
    
} catch (Exception $e) {
    echo "<p>❌ <strong>Erreur :</strong> " . $e->getMessage() . "</p>";
    echo "<h3>🔧 Actions à effectuer :</h3>";
    echo "<ul>";
    echo "<li>Vérifiez vos identifiants dans <code>config.php</code></li>";
    echo "<li>Assurez-vous que la base de données existe sur OVH</li>";
    echo "<li>Exécutez le script <code>create_tables.sql</code></li>";
    echo "<li>Vérifiez que votre IP est autorisée sur OVH</li>";
    echo "</ul>";
}
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
p { margin: 5px 0; }
</style>

