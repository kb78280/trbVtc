-- Tables pour l'administration VTC
-- Créer ces tables dans votre base de données MySQL/MariaDB

-- Table des administrateurs
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des véhicules
CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    plaque_immatriculation VARCHAR(20) UNIQUE NOT NULL,
    capacite_places INT NOT NULL,
    capacite_bagages INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des prix par véhicule
CREATE TABLE IF NOT EXISTS vehicle_pricing (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    prix_km DECIMAL(10,2) NOT NULL,
    tarif_base DECIMAL(10,2) NOT NULL,
    tva DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vehicle_pricing (vehicle_id)
);

-- Insérer un utilisateur admin par défaut (mot de passe: admin123)
-- IMPORTANT: Changez ce mot de passe en production !
INSERT INTO admin_users (username, password_hash) VALUES 
('admin', '$2b$10$6f5YT6Ik48tABN1ib1V9f.q2QOvgJEv/KiHxxT0BmSKWiczDoVRf2') 
ON DUPLICATE KEY UPDATE username = username;

-- Exemples de véhicules (optionnel)
INSERT INTO vehicles (nom, plaque_immatriculation, capacite_places, capacite_bagages) VALUES
('Mercedes Classe E', 'AB-123-CD', 4, 3),
('BMW Série 5', 'EF-456-GH', 4, 3),
('Audi A6', 'IJ-789-KL', 4, 3),
('Mercedes Viano', 'MN-012-OP', 8, 6)
ON DUPLICATE KEY UPDATE nom = VALUES(nom);

-- Exemples de prix (optionnel)
INSERT INTO vehicle_pricing (vehicle_id, prix_km, tarif_base, tva) VALUES
(1, 1.50, 15.00, 20.00),
(2, 1.60, 18.00, 20.00),
(3, 1.55, 16.00, 20.00),
(4, 2.00, 25.00, 20.00)
ON DUPLICATE KEY UPDATE prix_km = VALUES(prix_km);

-- Index pour optimiser les performances
CREATE INDEX idx_vehicles_plaque ON vehicles(plaque_immatriculation);
CREATE INDEX idx_pricing_vehicle ON vehicle_pricing(vehicle_id);
CREATE INDEX idx_admin_username ON admin_users(username);
