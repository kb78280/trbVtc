# 🚀 Guide de Déploiement - TRB VTC

## 📋 Architecture

- **Frontend Next.js** : Hébergé sur Vercel (actuellement) → OVH (futur)
- **Backend PHP** : Hébergé sur OVH
- **Base de données** : MySQL OVH (partagée avec WordPress)

## 🗄️ Configuration Base de Données

### 1. Tables VTC avec préfixes (aucun impact sur WordPress)

Les tables VTC utilisent le préfixe `vtc_` pour éviter tout conflit :

```sql
- vtc_reservations          (table principale)
- vtc_customer_info         (informations client)
- vtc_reservation_options   (options supplémentaires)
- vtc_waypoints            (étapes intermédiaires)
- vtc_route_info           (informations de route)
- vtc_pricing_info         (détails des prix)
```

Test

### 2. Exécution du script SQL

**Option A : phpMyAdmin (Recommandé)**
1. Connectez-vous à phpMyAdmin via OVH
2. Sélectionnez votre base de données WordPress
3. Onglet "SQL"
4. Copiez/collez le contenu de `database/create_vtc_tables.sql`
5. Exécutez le script

**Option B : Ligne de commande**
```bash
mysql -h mysql51-XX.pro.ovh.net -u votre_user -p votre_base < database/create_vtc_tables.sql
```

## ⚙️ Configuration API PHP

### 1. Mise à jour de `api-php/config.php`

```php
<?php
// Vos informations OVH
define('DB_HOST', 'mysql51-XX.pro.ovh.net'); // Remplacez XX
define('DB_NAME', 'votre_base_wordpress');    // Votre base existante
define('DB_USER', 'votre_utilisateur');       // Votre utilisateur MySQL
define('DB_PASSWORD', 'votre_mot_de_passe');  // Votre mot de passe

// CORS pour Vercel et votre domaine
define('ALLOWED_ORIGINS', [
    'https://votre-domaine.com',              // Votre domaine final
    'https://www.votre-domaine.com',          // Version www
    'https://votre-projet.vercel.app',        // URL Vercel
    'http://localhost:3000',                  // Développement
]);
?>
```

### 2. Upload des fichiers API sur OVH

Uploadez le dossier `api-php/` dans votre hébergement OVH :
```
votre-domaine.com/
├── wp-content/          (WordPress existant)
├── wp-admin/            (WordPress existant)
├── wp-includes/         (WordPress existant)
├── api-php/             (← Nouveau dossier VTC)
│   ├── config.php
│   ├── reservation.php
│   └── test-connection.php
└── index.php            (WordPress existant)
```

## 🧪 Tests de Fonctionnement

### 1. Test de connexion base de données

Visitez : `https://votre-domaine.com/api-php/test-connection.php`

Vous devriez voir :
- ✅ Connexion réussie
- ✅ Toutes les tables VTC existent
- ✅ Test d'insertion/suppression

### 2. Test API depuis Vercel

L'URL de votre API sera :
```
https://votre-domaine.com/api-php/reservation.php
```

## 🌐 Configuration Vercel

### 1. Variables d'environnement

Dans votre dashboard Vercel, ajoutez :

```env
# Google Maps (si utilisé)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# API Backend (URL de votre domaine OVH)
NEXT_PUBLIC_API_BASE_URL=https://votre-domaine.com
```

### 2. Configuration CORS

Assurez-vous que votre URL Vercel est dans `ALLOWED_ORIGINS` :
```php
'https://votre-projet.vercel.app',
'https://votre-projet-git-main.vercel.app',
```

## 🔒 Sécurité

### 1. Protection des fichiers sensibles

Ajoutez dans le `.htaccess` de votre OVH :

```apache
# Protection config.php
<Files "config.php">
    Order allow,deny
    Deny from all
</Files>

# Protection fichiers de test (optionnel)
<Files "test-connection.php">
    Order allow,deny
    Allow from [VOTRE_IP]
    Deny from all
</Files>
```

### 2. Validation des origines

Le script PHP valide automatiquement les origines CORS configurées.

## 📊 Monitoring

### 1. Logs d'erreurs

Les erreurs sont enregistrées dans les logs PHP d'OVH :
- Panneau OVH → Hébergement → Logs et statistiques

### 2. Test de performance

Utilisez `test-connection.php` pour vérifier régulièrement :
- Connexion base de données
- Performances des requêtes
- Intégrité des tables

## 🚀 Migration Future vers OVH

Quand vous migrerez de Vercel vers OVH :

1. **Build Next.js statique** :
```bash
npm run build
npm run export
```

2. **Upload du build** :
   - Uploadez le contenu de `out/` dans un sous-dossier
   - Ex: `votre-domaine.com/vtc/`

3. **Mise à jour CORS** :
```php
define('ALLOWED_ORIGINS', [
    'https://votre-domaine.com',
    'https://www.votre-domaine.com',
]);
```

## 📞 Support

En cas de problème :

1. **Vérifiez** `test-connection.php`
2. **Consultez** les logs OVH
3. **Testez** depuis Postman/curl
4. **Vérifiez** les paramètres CORS

---

## ✅ Checklist de Déploiement

- [ ] Récupérer les identifiants MySQL OVH
- [ ] Mettre à jour `config.php` avec vos informations
- [ ] Exécuter `create_vtc_tables.sql` sur la base OVH
- [ ] Uploader le dossier `api-php/` sur OVH
- [ ] Tester avec `test-connection.php`
- [ ] Configurer les variables Vercel
- [ ] Ajouter l'URL Vercel dans CORS
- [ ] Tester une réservation complète
- [ ] Configurer la sécurité (.htaccess)

**Votre application VTC sera opérationnelle sans affecter WordPress !** 🎉
