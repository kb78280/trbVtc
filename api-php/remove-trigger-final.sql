-- SUPPRESSION DÉFINITIVE du trigger qui cause le conflit
-- Ce trigger modifie vtc_customer_info en même temps que reservation.php

DROP TRIGGER IF EXISTS update_reservation_count_after_insert;

-- Vérification : lister tous les triggers restants
SHOW TRIGGERS LIKE 'vtc_%';
