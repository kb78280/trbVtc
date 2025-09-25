-- Table pour la gestion des véhicules VTC
CREATE TABLE IF NOT EXISTS vtc_voitures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL COMMENT 'Nom/modèle du véhicule',
    plaque VARCHAR(20) NOT NULL UNIQUE COMMENT 'Numéro de plaque d\'immatriculation',
    nombre_places INT NOT NULL DEFAULT 4 COMMENT 'Nombre de places passagers',
    nombre_bagages INT DEFAULT 0 COMMENT 'Nombre de bagages (0 si null)',
    type ENUM('confort', 'van') NOT NULL DEFAULT 'confort' COMMENT 'Type de véhicule',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de mise à jour',
    
    INDEX idx_type (type),
    INDEX idx_plaque (plaque),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des véhicules VTC';

-- Insertion de quelques véhicules d'exemple
INSERT INTO vtc_voitures (nom, plaque, nombre_places, nombre_bagages, type) VALUES
('Mercedes Classe E', 'AB-123-CD', 4, 3, 'confort'),
('BMW Série 5', 'EF-456-GH', 4, 3, 'confort'),
('Mercedes Vito', 'IJ-789-KL', 8, 6, 'van'),
('Volkswagen Caravelle', 'MN-012-OP', 8, 8, 'van')
ON DUPLICATE KEY UPDATE 
    nom = VALUES(nom),
    nombre_places = VALUES(nombre_places),
    nombre_bagages = VALUES(nombre_bagages),
    type = VALUES(type);
