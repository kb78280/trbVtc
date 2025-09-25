-- Migration pour ajouter les champs de tarification aux véhicules
-- À exécuter dans phpMyAdmin OVH

-- Ajouter les nouveaux champs à la table vtc_voitures
ALTER TABLE vtc_voitures 
ADD COLUMN prix_base_mad DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix de base Mise À Disposition en euros' AFTER type,
ADD COLUMN taux_km DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Taux par kilomètre en euros' AFTER prix_base_mad,
ADD COLUMN tva_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00 COMMENT 'Taux de TVA en pourcentage' AFTER taux_km;

-- Mettre à jour les véhicules existants avec des valeurs par défaut réalistes
-- Ces valeurs peuvent être modifiées ensuite via l'interface d'administration

-- Pour les véhicules de type 'confort'
UPDATE vtc_voitures 
SET 
    prix_base_mad = 45.00,    -- 45€/heure pour mise à disposition berline
    taux_km = 1.20,           -- 1.20€/km
    tva_percent = 20.00       -- 20% de TVA
WHERE type = 'confort';

-- Pour les véhicules de type 'van'
UPDATE vtc_voitures 
SET 
    prix_base_mad = 65.00,    -- 65€/heure pour mise à disposition van
    taux_km = 1.50,           -- 1.50€/km
    tva_percent = 20.00       -- 20% de TVA
WHERE type = 'van';

-- Vérification des modifications
SELECT 
    id,
    nom,
    plaque,
    type,
    prix_base_mad,
    taux_km,
    tva_percent,
    created_at
FROM vtc_voitures 
ORDER BY id;

-- Note: Les valeurs par défaut sont appliquées automatiquement.
-- Aucune donnée existante ne sera perdue lors de cette migration.
