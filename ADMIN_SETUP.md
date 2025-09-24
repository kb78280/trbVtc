# Configuration de l'Administration VTC

## Installation des tables de base de données

1. **Exécuter le script SQL dans votre base de données :**
   ```bash
   mysql -u your_username -p your_database < database/admin_tables.sql
   ```

2. **Variables d'environnement requises :**
   Ajoutez dans votre fichier `.env` (production) :
   ```
   DB_HOST=your_mysql_host
   DB_PORT=3306
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_database_name
   JWT_SECRET=
   ```

## Accès à l'administration

1. **URL d'accès :** `/admin`

2. **Identifiants par défaut :**
   - Nom d'utilisateur : `admin`
   - Mot de passe : `admin123`

   ⚠️ **IMPORTANT :** Changez ces identifiants en production !

## Fonctionnalités disponibles

### Gestion des véhicules
- Ajouter un nouveau véhicule
- Modifier les informations d'un véhicule
- Supprimer un véhicule
- Champs : Nom, plaque d'immatriculation, capacité places, capacité bagages

### Gestion des prix
- Configurer les tarifs par véhicule
- Un seul tarif par véhicule
- Champs : Prix/km, tarif de base, TVA
- Modification et suppression des tarifs

## Structure des tables

### Table `admin_users`
- `id` : Identifiant unique
- `username` : Nom d'utilisateur
- `password_hash` : Mot de passe hashé avec bcrypt

### Table `vehicles`
- `id` : Identifiant unique
- `nom` : Nom du véhicule
- `plaque_immatriculation` : Plaque unique
- `capacite_places` : Nombre de places
- `capacite_bagages` : Capacité bagages

### Table `vehicle_pricing`
- `id` : Identifiant unique
- `vehicle_id` : Référence au véhicule
- `prix_km` : Prix par kilomètre
- `tarif_base` : Tarif de base
- `tva` : Taux de TVA

## Sécurité

- Authentification JWT avec expiration 24h
- Vérification des tokens sur toutes les routes admin
- Hashage bcrypt des mots de passe
- Validation des données côté serveur

## Routes API

### Authentification
- `POST /api/admin/auth` : Connexion
- `GET /api/admin/verify` : Vérification du token

### Véhicules
- `GET /api/admin/vehicles` : Liste des véhicules
- `POST /api/admin/vehicles` : Créer un véhicule
- `PUT /api/admin/vehicles/[id]` : Modifier un véhicule
- `DELETE /api/admin/vehicles/[id]` : Supprimer un véhicule

### Prix
- `GET /api/admin/pricing` : Liste des tarifs
- `POST /api/admin/pricing` : Créer un tarif
- `PUT /api/admin/pricing/[id]` : Modifier un tarif
- `DELETE /api/admin/pricing/[id]` : Supprimer un tarif

## Changement du mot de passe admin

1. Utiliser le script fourni :
   ```bash
   node scripts/create-admin.js
   ```

2. Copier le hash généré dans une requête SQL :
   ```sql
   UPDATE admin_users SET password_hash = 'nouveau_hash' WHERE username = 'admin';
   ```
