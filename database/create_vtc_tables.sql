-- =============================================
-- SCRIPT DE CRÉATION DES TABLES VTC - Compatible WordPress
-- Base de données MySQL avec préfixe 'vtc_' pour éviter les conflits
-- =============================================

-- Supprimer les tables VTC si elles existent (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS vtc_pricing_info;
DROP TABLE IF EXISTS vtc_route_info;
DROP TABLE IF EXISTS vtc_waypoints;
DROP TABLE IF EXISTS vtc_reservation_options;
DROP TABLE IF EXISTS vtc_customer_info;
DROP TABLE IF EXISTS vtc_reservations;

-- =============================================
-- TABLE PRINCIPALE : RESERVATIONS VTC
-- =============================================
CREATE TABLE vtc_reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_type ENUM('transfert', 'mise-a-disposition') NOT NULL,
    vehicle_type ENUM('berline', 'van') NOT NULL,
    departure_address TEXT NOT NULL,
    arrival_address TEXT NOT NULL,
    departure_place_id VARCHAR(255),
    arrival_place_id VARCHAR(255),
    departure_lat DECIMAL(10, 8),
    departure_lng DECIMAL(11, 8),
    arrival_lat DECIMAL(10, 8),
    arrival_lng DECIMAL(11, 8),
    duration_hours INT DEFAULT NULL COMMENT 'Pour mise à disposition uniquement',
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    passenger_count INT NOT NULL DEFAULT 1,
    baggage_count INT NOT NULL DEFAULT 0,
    payment_method ENUM('immediate', 'sur-place') NOT NULL,
    comments TEXT,
    estimated_price DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_service_type (service_type),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_reservation_date (reservation_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- =============================================
-- TABLE : INFORMATIONS CLIENT VTC
-- =============================================
CREATE TABLE vtc_customer_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reservation_id) REFERENCES vtc_reservations(id) ON DELETE CASCADE,
    INDEX idx_reservation_id (reservation_id),
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- =============================================
-- TABLE : OPTIONS DE RÉSERVATION VTC
-- =============================================
CREATE TABLE vtc_reservation_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    child_seat_quantity INT DEFAULT 0,
    rehausseur_quantite INT DEFAULT 0,
    flower_bouquet BOOLEAN DEFAULT FALSE,
    airport_assistance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reservation_id) REFERENCES vtc_reservations(id) ON DELETE CASCADE,
    INDEX idx_reservation_id (reservation_id)
);

-- =============================================
-- TABLE : ÉTAPES INTERMÉDIAIRES VTC (WAYPOINTS)
-- =============================================
CREATE TABLE vtc_waypoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    waypoint_order INT NOT NULL,
    address TEXT NOT NULL,
    place_id VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reservation_id) REFERENCES vtc_reservations(id) ON DELETE CASCADE,
    INDEX idx_reservation_id (reservation_id),
    INDEX idx_waypoint_order (waypoint_order)
);

-- =============================================
-- TABLE : INFORMATIONS DE ROUTE VTC
-- =============================================
CREATE TABLE vtc_route_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    distance VARCHAR(50) COMMENT 'Ex: "15,2 km"',
    duration VARCHAR(50) COMMENT 'Ex: "33 minutes"',
    distance_value INT COMMENT 'Distance en mètres',
    duration_value INT COMMENT 'Durée en secondes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reservation_id) REFERENCES vtc_reservations(id) ON DELETE CASCADE,
    INDEX idx_reservation_id (reservation_id)
);

-- =============================================
-- TABLE : INFORMATIONS DE PRIX VTC
-- =============================================
CREATE TABLE vtc_pricing_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    base_price DECIMAL(10, 2) DEFAULT 0.00,
    total_ht DECIMAL(10, 2) DEFAULT 0.00,
    tva_amount DECIMAL(10, 2) DEFAULT 0.00,
    stripe_fees DECIMAL(10, 2) DEFAULT 0.00,
    total_ttc DECIMAL(10, 2) DEFAULT 0.00,
    distance_km DECIMAL(8, 2) COMMENT 'Distance pour calcul prix',
    duration_minutes INT COMMENT 'Durée pour calcul prix',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reservation_id) REFERENCES vtc_reservations(id) ON DELETE CASCADE,
    INDEX idx_reservation_id (reservation_id)
);

-- =============================================
-- VUE COMPLÈTE VTC
-- =============================================
CREATE VIEW vtc_reservation_complete AS
SELECT 
    r.id,
    r.service_type,
    r.vehicle_type,
    r.departure_address,
    r.arrival_address,
    r.reservation_date,
    r.reservation_time,
    r.passenger_count,
    r.baggage_count,
    r.payment_method,
    r.status,
    r.estimated_price,
    
    -- Informations client
    c.first_name,
    c.last_name,
    c.phone,
    c.email,
    
    -- Options
    o.child_seat_quantity,
    o.rehausseur_quantite,
    o.flower_bouquet,
    o.airport_assistance,
    
    -- Route
    rt.distance,
    rt.duration,
    
    -- Prix
    p.base_price,
    p.total_ht,
    p.tva_amount,
    p.total_ttc,
    
    r.created_at,
    r.updated_at
    
FROM vtc_reservations r
LEFT JOIN vtc_customer_info c ON r.id = c.reservation_id
LEFT JOIN vtc_reservation_options o ON r.id = o.reservation_id
LEFT JOIN vtc_route_info rt ON r.id = rt.reservation_id
LEFT JOIN vtc_pricing_info p ON r.id = p.reservation_id;

-- =============================================
-- DONNÉES DE TEST VTC (OPTIONNEL)
-- =============================================

-- Insérer une réservation de test
INSERT INTO vtc_reservations (
    service_type, vehicle_type, departure_address, arrival_address,
    reservation_date, reservation_time, passenger_count, baggage_count,
    payment_method, estimated_price
) VALUES (
    'transfert', 'berline', 'Rue de la Pompe, 75016 Paris', 'Aéroport Charles de Gaulle, 95700 Roissy-en-France',
    '2024-01-15', '14:30:00', 2, 1, 'immediate', 65.50
);

-- Récupérer l'ID de la réservation de test
SET @reservation_id = LAST_INSERT_ID();

-- Insérer les informations client de test
INSERT INTO vtc_customer_info (reservation_id, first_name, last_name, phone, email)
VALUES (@reservation_id, 'Jean', 'Dupont', '0123456789', 'jean.dupont@email.com');

-- Insérer les options de test
INSERT INTO vtc_reservation_options (reservation_id, child_seat_quantity, rehausseur_quantite, flower_bouquet, airport_assistance)
VALUES (@reservation_id, 1, 0, FALSE, TRUE);

-- Insérer les informations de route de test
INSERT INTO vtc_route_info (reservation_id, distance, duration, distance_value, duration_value)
VALUES (@reservation_id, '45,2 km', '55 minutes', 45200, 3300);

-- Insérer les informations de prix de test
INSERT INTO vtc_pricing_info (reservation_id, base_price, total_ht, tva_amount, total_ttc, distance_km)
VALUES (@reservation_id, 55.00, 55.00, 10.50, 65.50, 45.2);

-- =============================================
-- REQUÊTES UTILES POUR L'ADMINISTRATION VTC
-- =============================================

-- Voir toutes les réservations VTC avec détails
-- SELECT * FROM vtc_reservation_complete ORDER BY created_at DESC;

-- Statistiques VTC par mois
-- SELECT 
--     YEAR(reservation_date) as annee,
--     MONTH(reservation_date) as mois,
--     COUNT(*) as nombre_reservations,
--     SUM(estimated_price) as chiffre_affaires
-- FROM vtc_reservations 
-- GROUP BY YEAR(reservation_date), MONTH(reservation_date)
-- ORDER BY annee DESC, mois DESC;

-- Réservations VTC en attente
-- SELECT * FROM vtc_reservation_complete WHERE status = 'pending' ORDER BY reservation_date, reservation_time;
