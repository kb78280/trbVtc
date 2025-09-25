-- CORRECTION : Supprimer le trigger qui cause le conflit
-- Le trigger entre en conflit avec l'insertion manuelle dans reservation.php

-- Supprimer le trigger automatique
DROP TRIGGER IF EXISTS update_nombre_reservations_after_insert;
DROP TRIGGER IF EXISTS update_nombre_reservations_after_delete;

-- Note: nombre_reservations sera maintenant géré manuellement dans le code PHP
-- Cela évite le conflit MySQL "table already used by statement"
