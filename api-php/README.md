# 🚀 API PHP pour TRB VTC - Installation OVH

## 📋 Structure des fichiers

```
api-php/
├── config.php          # Configuration DB et sécurité
├── reservation.php      # Endpoint pour créer une réservation
├── test.php            # Endpoint pour tester la connexion
└── README.md           # Ce fichier
```

## 🔧 Installation sur OVH

### 1. **Créer la base de données MySQL**

1. Connectez-vous à votre espace client OVH
2. Allez dans "Hébergements" > "Bases de données"
3. Créez une nouvelle base MySQL
4. Notez les informations de connexion :
   - Host : `your-mysql-host.ovh.net`
   - Database : `your_database_name`
   - Username : `your_username`
   - Password : `your_password`

### 2. **Exécuter le script SQL**

1. Connectez-vous à phpMyAdmin (via l'espace client OVH)
2. Sélectionnez votre base de données
3. Allez dans l'onglet "SQL"
4. Copiez-collez le contenu du fichier `../database/create_tables.sql`
5. Exécutez le script

### 3. **Uploader les fichiers PHP**

1. Via FTP ou le gestionnaire de fichiers OVH :
   ```
   /www/api/config.php
   /www/api/reservation.php
   /www/api/test.php
   ```

### 4. **Configurer config.php**

Modifiez le fichier `config.php` avec vos vraies informations :

```php
// Configuration de la base de données MySQL OVH
define('DB_HOST', 'mysql51-66.pro.ovh.net'); // Votre host MySQL OVH
define('DB_NAME', 'trbvtc_db');               // Nom de votre BDD
define('DB_USER', 'trbvtc_user');             // Votre utilisateur MySQL
define('DB_PASSWORD', 'votre_mot_de_passe');   // Votre mot de passe MySQL

// Configuration CORS pour votre domaine
define('ALLOWED_ORIGINS', [
    'https://your-domain.com',        // Votre domaine de production
    'https://www.your-domain.com',    // Avec www
    'http://localhost:3000',          // Pour le développement
]);
```

### 5. **Tester l'API**

1. **Test de connexion :**
   ```
   GET https://your-domain.com/api/test.php
   ```
   
   Réponse attendue :
   ```json
   {
     "success": true,
     "message": "API PHP fonctionnelle",
     "database": {
       "connected": true,
       "tables": ["reservations", "customer_info", ...]
     }
   }
   ```

2. **Test de réservation :**
   ```
   POST https://your-domain.com/api/reservation.php
   ```

## 🔐 Configuration Next.js

### 1. **Variables d'environnement**

Créez/modifiez `.env.local` :

```bash
# API PHP sur OVH
NEXT_PUBLIC_API_URL=https://your-domain.com/api/reservation.php

# Google Maps (existant)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 2. **Test depuis Next.js**

1. Démarrez votre site Next.js : `npm run dev`
2. Remplissez le formulaire de réservation
3. Cliquez sur "Envoyer la demande"
4. Vérifiez les logs dans la console
5. Vérifiez l'insertion en base via phpMyAdmin

## 📊 Monitoring et logs

### Logs PHP
Les erreurs sont enregistrées dans les logs PHP du serveur OVH.

### Vérification des données
```sql
-- Voir les dernières réservations
SELECT * FROM reservation_complete ORDER BY created_at DESC LIMIT 10;

-- Statistiques
SELECT 
    service_type,
    COUNT(*) as nombre,
    AVG(estimated_price) as prix_moyen
FROM reservations 
GROUP BY service_type;
```

## 🚨 Sécurité

- ✅ CORS configuré pour vos domaines uniquement
- ✅ Validation des données côté serveur
- ✅ Requêtes préparées (protection SQL injection)
- ✅ Logs d'erreurs et d'activité
- ✅ Transactions pour l'intégrité des données

## 🔄 Déploiement

1. **Développement** : `localhost:3000` → `localhost/api/`
2. **Production** : `your-domain.com` → `your-domain.com/api/`

Votre architecture est maintenant :
```
Next.js Static (OVH) ←→ API PHP (OVH) ←→ MySQL (OVH)
```

Tout hébergé chez OVH pour une performance optimale ! 🚀
