-- Table pour l'utilisateur administrateur unique
CREATE TABLE IF NOT EXISTS vtc_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table utilisateur admin unique';

-- Insérer l'utilisateur admin unique avec mot de passe hashé
-- Mot de passe: @@Tbensedi27@@
-- Hash bcrypt généré pour ce mot de passe
INSERT INTO vtc_user (username, password_hash) VALUES 
('AdminTrb', '$2y$12$8K9.QJxvQ3yF7HzMpWxTaOuYxJc4vL2rN6sE1fG3hI5jK7lM9nO0q')
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    updated_at = CURRENT_TIMESTAMP;

-- Note: Le hash ci-dessus est un exemple. Le vrai hash sera généré par l'API PHP.
-- Vérification de l'insertion
SELECT id, username, created_at FROM vtc_user;
