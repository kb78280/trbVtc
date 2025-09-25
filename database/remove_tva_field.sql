-- Script pour supprimer le champ tva_percent de la table vtc_voitures
-- À exécuter dans phpMyAdmin OVH

-- Supprimer la colonne tva_percent de la table vtc_voitures
ALTER TABLE vtc_voitures 
DROP COLUMN tva_percent;

-- Vérification de la structure de la table après suppression
DESCRIBE vtc_voitures;

-- Vérification des données (optionnel)
SELECT 
    id,
    nom,
    plaque,
    type,
    prix_base_mad,
    taux_km,
    created_at
FROM vtc_voitures 
ORDER BY id
LIMIT 5;

-- Note: La colonne tva_percent a été supprimée.
-- La TVA sera gérée en dur dans le code selon le type de service.
