# 📦 STOCK MANAGER – Logiciel de Gestion des Stocks

![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=flat&logo=laravel)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat&logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=flat&logo=sqlite)
![PHP](https://img.shields.io/badge/PHP-8.1+-777BB4?style=flat&logo=php)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 📖 Présentation

**Stock Manager** est une solution sur mesure développée pour l'**Institut Spécialisé de Technologie Appliquée Hôtelière et Touristique de Tanger (ISTAHT)**. Elle répond aux termes de référence pour l'acquisition d'un système robuste dédié au pilotage des approvisionnements, du stockage et de la distribution au sein des magasins de l'établissement.

> *"Optimiser l'approvisionnement, le suivi des mouvements et l'inventaire permanent des magasins."*

---

## 🎯 Problématique et Objectifs

| Problème | Impact |
|----------|--------|
| 📋 Saisie manuelle | Erreurs de saisie, perte de temps |
| 📊 Absence d'inventaire permanent | Difficulté à suivre les flux en temps réel |
| ⚠️ Ruptures de stock | Interruption des activités pédagogiques |
| 🔍 Manque de traçabilité | Impossibilité d'auditer les mouvements |
| 📄 Gestion papier | Documents perdus, archivage difficile |

| Objectif | Description |
|----------|-------------|
| 🎯 Suivi rigoureux des flux | Inventaire permanent avec historique complet |
| 📷 Intégration codes-barres | Douchette pour comptage physique rapide |
| 🔔 Alertes automatiques | Notification en cas de stock critique |
| 📄 Génération PDF | Bons de commande, réception, sortie, rapports |
| 🔒 Traçabilité | Journalisation des actions et historique des mouvements |

---

## ⚙️ Fonctionnalités

### Modules Fonctionnels

| # | Module | Description |
|---|--------|-------------|
| 1 | Gestion des Articles | Création, modification, codes-barres, images, catégories, seuils d'alerte |
| 2 | Gestion des Entrées/Sorties | Enregistrement en temps réel des mouvements de stock |
| 3 | Inventaire Permanent | Suivi continu des quantités disponibles |
| 4 | Codes-Barres | Génération, impression et lecture par douchette |
| 5 | Alertes de Stock | Notification visuelle au tableau de bord |
| 6 | Transfert entre Magasins | Mouvement de quantités avec justification |
| 7 | Demandes Internes | Formulation et validation des requêtes |
| 8 | Génération de Documents | Bons de commande, réception, sortie, consommation |
| 9 | Rapports PDF/Excel | Mouvements journaliers, approvisionnements, alertes |
| 10 | Gestion des Utilisateurs | Création de comptes avec rôles (Admin, Magasinier, Demandeur) |
| 11 | Archivage | Conservation sécurisée des documents PDF |
| 12 | Import/Export | Fichiers CSV/TXT, export Excel/PDF |

---

## 👥 Acteurs et Droits d'Accès

| Acteur | Prérogatives |
|--------|--------------|
| 👑 **Administrateur** | Supervision, validation des commandes, rapports, gestion des habilitations, paramétrage |
| 📦 **Magasinier** | Saisie des mouvements, inventaire physique, gestion des alertes, gestion des articles, transferts |
| 📝 **Demandeur** | Formulation des demandes, réservation, suivi en temps réel, historique de consommation |

---
## 🏗️ Architecture Technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Client (Frontend)** | React JS, Tailwind CSS, Axios, React Router | Interface utilisateur dynamique et réactive |
| **Communication** | API REST (JSON) | Échange de données entre Frontend et Backend |
| **Serveur (Backend)** | Laravel, Eloquent ORM, Sanctum, RBAC | Logique métier, authentification, autorisation |
| **Base de données** | SQLite | Persistance des données, transactions ACID |

---

## 🛠️ Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Backend | Laravel (PHP) | 11.x |
| Frontend | React (JavaScript) | 18.x |
| Styling | Tailwind CSS | 3.x |
| Base de données | SQLite | 3.x |
| Authentification | Laravel Sanctum | 11.x |
| HTTP Client | Axios | 1.x |
| Versioning | Git & GitHub | - |
| Gestion de projet | JIRA (Agile/Scrum) | - |
| UI/UX Design | Figma | - |

---

## 📦 Installation

### Prérequis

```bash
PHP >= 8.1
Composer
Node.js >= 18.x
NPM / Yarn
SQLite (ou MySQL)
Git
Étapes d'Installation
bash
# 1. Cloner le projet
git clone https://github.com/mohamedBouray/stock-manager.git
cd stock-manager

# 2. Installer les dépendances Backend
composer install

# 3. Installer les dépendances Frontend
npm install

# 4. Configurer l'environnement
cp .env.example .env

# 5. Créer la base de données SQLite
touch database/database.sqlite

# 6. Générer la clé d'application
php artisan key:generate

# 7. Exécuter les migrations et les seeders
php artisan migrate:fresh --seed

# 8. Compiler le Frontend (Production)
npm run build

# 9. Lancer le serveur de développement
php artisan serve
👨‍💻 Comptes de Test
Rôle	Email	Mot de passe
👑 Administrateur	admin@stock.com	password123
📦 Magasinier	magasinier@stock.com	password123
📝 Demandeur	demandeur@stock.com	password123
🔗 API Endpoints
Méthode	Endpoint	Description
POST	/api/login	Connexion
POST	/api/logout	Déconnexion
GET	/api/user	Informations utilisateur
GET	/api/articles	Liste des articles
GET	/api/articles/{id}	Détails d'un article
POST	/api/articles	Création d'un article
PUT	/api/articles/{id}	Modification d'un article
DELETE	/api/articles/{id}	Suppression d'un article
GET	/api/stocks	État des stocks
GET	/api/stocks/alertes	Articles en alerte
POST	/api/mouvements	Enregistrement d'un mouvement
GET	/api/mouvements	Historique des mouvements
POST	/api/transferts	Transfert entre magasins
GET	/api/demandes	Liste des demandes
POST	/api/demandes	Nouvelle demande
PUT	/api/demandes/{id}/status	Validation/refus
GET	/api/rapports	Génération de rapports
🔒 Sécurité
Mesure	Description
🔒 HTTPS	Chiffrement SSL/TLS
🛡️ RBAC	Role-Based Access Control
🔑 Sanctum	Authentification par tokens
📝 Logs	Journalisation inaltérable
💾 Sauvegarde	Quotidienne de la base
🔐 Hachage	Mots de passe (bcrypt)
⏰ Inactivité	Déconnexion automatique
🛡️ Protection CSRF	Laravel native
🛡️ Protection XSS	Laravel native
🛡️ Protection SQL Injection	Eloquent ORM
🤝 Contributeurs
Nom	Rôle
Mohamed Bouray	Développeur Full Stack
Sybous Mohamed	Développeur Full Stack
M. Tarek AIT BAHA	Encadrant Académique (EST Guelmim)
M. Yassine AZNAG	Encadrant de Stage (OPTIZAWORKS)
📄 Licence
Ce projet est sous licence MIT. Vous êtes libre de l'utiliser, de le modifier et de le distribuer.
