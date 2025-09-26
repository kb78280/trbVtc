-- Migration pour ajouter le champ rehausseur_quantite à la table vtc_reservation_options
-- À exécuter dans phpMyAdmin OVH

-- Ajouter le nouveau champ rehausseur_quantite
ALTER TABLE vtc_reservation_options 
ADD COLUMN rehausseur_quantite INT DEFAULT 0 COMMENT 'Nombre de réhausseurs demandés' AFTER child_seat_quantity;

-- Vérifier la structure de la table après modification
DESCRIBE vtc_reservation_options;

-- Vérification des données existantes (optionnel)
SELECT 
    id,
    reservation_id,
    child_seat_quantity,
    rehausseur_quantite,
    flower_bouquet,
    airport_assistance,
    created_at
FROM vtc_reservation_options 
ORDER BY id DESC
LIMIT 5;

-- Note: 
-- - Le champ rehausseur_quantite est ajouté avec une valeur par défaut de 0
-- - Toutes les réservations existantes auront automatiquement 0 réhausseur
-- - Le champ est positionné après child_seat_quantity pour une logique cohérente
