# ERP RoadToTP

ERP spécialisé pour les entreprises de Travaux Publics.

## 🏗️ Stack Technique

- **Frontend**: React 18 + Vite + Recharts
- **Backend**: Laravel 11 + Sanctum
- **Base de données**: MySQL 8
- **Infrastructure**: Docker + Docker Compose

## 📦 Fonctionnalités

- ✅ **Gestion des Chantiers** - Suivi complet des projets
- ✅ **Gestion des Employés** - RH et affectations
- ✅ **Gestion du Matériel** - Équipements et maintenances
- ✅ **Gestion des Clients** - CRM intégré
- ✅ **Planning** - Calendrier et planification
- ✅ **Tableau de bord** - KPIs et statistiques

## 🚀 Installation

### Prérequis

- Docker et Docker Compose
- Git

### Démarrage rapide

```bash
# Cloner le projet
git clone <repo-url>
cd ERP-ROADTOTP

# Copier le fichier d'environnement
cp backend/.env.example backend/.env

# Lancer les containers Docker
docker-compose up -d --build

# Installer les dépendances Laravel (dans le container)
docker-compose exec backend composer install

# Générer la clé d'application
docker-compose exec backend php artisan key:generate

# Exécuter les migrations avec les données de démo
docker-compose exec backend php artisan migrate --seed
```

### Accès aux services

| Service | URL |
|---------|-----|
| Frontend React | http://localhost:5173 |
| API Laravel | http://localhost/api |
| phpMyAdmin | http://localhost:8080 |

## 📁 Structure du Projet

```
ERP-ROADTOTP/
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   └── index.css      # Design system
│   └── package.json
├── backend/                # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   └── Models/
│   ├── database/migrations/
│   └── routes/api.php
├── docker/                 # Configuration Docker
│   ├── nginx/
│   ├── php/
│   └── node/
└── docker-compose.yml
```

## 🔐 Authentification

L'application utilise Laravel Sanctum pour l'authentification.

### Compte de démo

- **Email**: admin@roadtotp.fr
- **Mot de passe**: password

## 🛠️ Développement

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
docker-compose exec backend php artisan migrate:fresh --seed
docker-compose exec backend php artisan cache:clear
```

## 📝 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

### Chantiers
- `GET /api/chantiers` - Liste des chantiers
- `POST /api/chantiers` - Créer un chantier
- `GET /api/chantiers/{id}` - Détails d'un chantier
- `PUT /api/chantiers/{id}` - Modifier un chantier
- `DELETE /api/chantiers/{id}` - Supprimer un chantier

### Employés
- `GET /api/employes` - Liste des employés
- `POST /api/employes` - Créer un employé
- `PUT /api/employes/{id}` - Modifier un employé
- `DELETE /api/employes/{id}` - Supprimer un employé

### Matériels
- `GET /api/materiels` - Liste des matériels
- `POST /api/materiels` - Créer un matériel
- `PUT /api/materiels/{id}` - Modifier un matériel
- `DELETE /api/materiels/{id}` - Supprimer un matériel

### Clients
- `GET /api/clients` - Liste des clients
- `POST /api/clients` - Créer un client
- `PUT /api/clients/{id}` - Modifier un client
- `DELETE /api/clients/{id}` - Supprimer un client

## 📄 Licence

MIT
