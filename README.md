# ZonAlert & ProConnect — Backend NestJS

Backend **production-ready** pour les applications **ZonAlert** (signalement de pannes) et **ProConnect** (mise en relation citoyens ↔ artisans).

---

## 🚀 Démarrage rapide

### Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Node.js | 18.x |
| npm | 9.x |
| PostgreSQL | 14.x |

### Installation

```bash
# 1. Cloner le dépôt
git clone <repo-url>
cd zonalert-backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# → Éditer .env avec vos valeurs (DB, JWT secrets, etc.)

# 4. Lancer en développement
npm run start:dev
```

Le serveur démarre sur **http://localhost:3000**
La documentation Swagger est disponible sur **http://localhost:3000/api/docs**

---

## 📁 Architecture du projet

```
src/
├── main.ts                          # Bootstrap (Helmet, CORS, Swagger, Validation)
├── app.module.ts                    # Module racine
│
├── config/
│   └── app.config.ts                # Variables d'environnement typées
│
├── database/
│   └── database.module.ts           # TypeORM async factory
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser()
│   │   └── roles.decorator.ts          # @Roles(...)
│   ├── filters/
│   │   └── all-exceptions.filter.ts    # Filtre d'erreurs global
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Guard JWT access token
│   │   ├── jwt-refresh.guard.ts        # Guard JWT refresh token
│   │   └── roles.guard.ts              # Guard contrôle de rôles
│   └── interceptors/
│       ├── logging.interceptor.ts      # Log HTTP requests
│       └── transform.interceptor.ts    # Enveloppe { success, data, timestamp }
│
├── auth/
│   ├── strategies/
│   │   ├── jwt-access.strategy.ts      # Passport JWT access
│   │   └── jwt-refresh.strategy.ts     # Passport JWT refresh
│   ├── dto/
│   │   ├── auth.dto.ts                 # LoginDto, RegisterDto, RefreshTokenDto
│   │   └── auth-response.dto.ts        # AuthResponseDto, UserResponseDto
│   ├── interfaces/
│   │   └── jwt-payload.interface.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── users/
│   ├── entities/user.entity.ts
│   ├── enums/user-role.enum.ts
│   ├── dto/update-user.dto.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
│
├── incidents/
│   ├── entities/incident.entity.ts
│   ├── enums/
│   │   ├── incident-type.enum.ts       # electricity | water
│   │   └── incident-status.enum.ts     # new | confirmed | in_progress | critical | resolved
│   ├── dto/incident.dto.ts
│   ├── incidents.controller.ts
│   ├── incidents.service.ts            # Haversine geo-search
│   └── incidents.module.ts
│
├── confirmations/
│   ├── entities/confirmation.entity.ts
│   ├── dto/confirmation.dto.ts
│   ├── confirmations.controller.ts
│   ├── confirmations.service.ts
│   └── confirmations.module.ts
│
├── reports/
│   ├── entities/report.entity.ts
│   ├── dto/report.dto.ts
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── reports.module.ts
│
├── comments/
│   ├── entities/comment.entity.ts
│   ├── dto/comment.dto.ts
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   └── comments.module.ts
│
├── professionals/
│   ├── entities/professional.entity.ts
│   ├── enums/professional-specialty.enum.ts  # electrician | plumber
│   ├── dto/professional.dto.ts
│   ├── professionals.controller.ts
│   ├── professionals.service.ts
│   └── professionals.module.ts
│
├── service-requests/
│   ├── entities/service-request.entity.ts
│   ├── enums/service-request-status.enum.ts  # pending | accepted | declined | completed | cancelled
│   ├── dto/service-request.dto.ts
│   ├── service-requests.controller.ts
│   ├── service-requests.service.ts
│   └── service-requests.module.ts
│
├── notifications/
│   ├── entities/notification.entity.ts
│   ├── enums/notification-type.enum.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   ├── notifications.gateway.ts        # WebSocket (Socket.io)
│   └── notifications.module.ts
│
└── interventions/
    ├── entities/intervention.entity.ts
    ├── enums/intervention-status.enum.ts
    ├── interventions.service.ts
    └── interventions.module.ts
```

---

## 🔗 Contrat API complet

### Auth

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/register` | ❌ | Créer un compte |
| POST | `/auth/login` | ❌ | Connexion |
| POST | `/auth/refresh` | Refresh Token | Renouveler l'access token |
| GET | `/auth/me` | ✅ JWT | Profil connecté |
| POST | `/auth/logout` | ✅ JWT | Déconnexion |

**Réponse login/register :**
```json
{
  "access_token": "eyJ...",
  "user": {
    "id": "uuid",
    "firstName": "Koffi",
    "lastName": "Akplogan",
    "email": "koffi@example.com",
    "phone": "+22997000000",
    "city": "Cotonou",
    "role": "citizen",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Users

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/users/:id` | ✅ JWT | Récupérer un utilisateur |
| PATCH | `/users/:id` | ✅ JWT | Mettre à jour le profil |

### Incidents (ZonAlert)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/incidents` | ✅ JWT | Liste paginée + filtres |
| POST | `/incidents` | ✅ JWT | Signaler un incident |
| GET | `/incidents/:id` | ✅ JWT | Détail avec commentaires |
| PATCH | `/incidents/:id/status` | ✅ ADMIN | Changer le statut |

**Query params GET /incidents :**
```
?page=1&limit=20&type=electricity&status=new
?lat=6.3703&lng=2.3912&radius=5    ← recherche dans un rayon de 5km
```

**Réponse paginée :**
```json
{
  "data": [...],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

### Confirmations

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/confirmations` | ✅ JWT | Confirmer un incident |

> Déclenchement automatique : à 3 confirmations, l'incident passe en statut `confirmed`

### Reports

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/reports` | ✅ JWT | Signaler un incident comme inapproprié |

### Comments

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/comments` | ✅ JWT | Commenter un incident |
| GET | `/comments/:incidentId` | ✅ JWT | Commentaires d'un incident |

### Professionals (ProConnect)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/professionals` | ✅ JWT | Liste filtrée + tri par distance |
| POST | `/professionals` | ✅ JWT | S'inscrire comme artisan |
| GET | `/professionals/:id` | ✅ JWT | Détail d'un professionnel |

**Query params GET /professionals :**
```
?specialty=electrician&city=Cotonou&available=true
?lat=6.3703&lng=2.3912    ← tri par proximité
```

### Service Requests (ProConnect)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/service-requests` | ✅ JWT | Créer une demande |
| GET | `/service-requests/user/:id` | ✅ JWT | Demandes d'un citoyen |
| GET | `/service-requests/professional/:id` | ✅ JWT | Demandes reçues |
| PATCH | `/service-requests/:id/status` | ✅ JWT | Changer le statut |

### Notifications

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/notifications` | ✅ JWT | Mes notifications (50 dernières) |
| PATCH | `/notifications/:id/read` | ✅ JWT | Marquer comme lue |
| PATCH | `/notifications/read-all` | ✅ JWT | Tout marquer comme lu |

---

## 📡 WebSocket — Notifications temps réel

**Namespace :** `ws://localhost:3000/notifications`

### Connexion

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  auth: { token: 'your_access_token' }
});
```

### Événements reçus (serveur → client)

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `notification` | `Notification` | Nouvelle notification personnelle |
| `incident_update` | `{ incidentId, status }` | Mise à jour broadcast |
| `pong` | `{ timestamp }` | Réponse au ping |

### Événements envoyés (client → serveur)

| Événement | Description |
|-----------|-------------|
| `ping` | Test de connexion |

---

## 🔐 Authentification

### Flux complet

```
1. POST /auth/register  →  { access_token, user }
2. POST /auth/login     →  { access_token, user }
   (refresh_token stocké côté serveur, haché en bcrypt)

3. Utiliser access_token dans le header :
   Authorization: Bearer <access_token>

4. Quand access_token expire (15min) :
   POST /auth/refresh   body: { refreshToken: "..." }
   →  { access_token, refresh_token }
```

> **Note :** Le frontend actuel stocke uniquement l'`access_token`. Pour exploiter le refresh token, implémenter un intercepteur Angular qui récupère le refresh token depuis un cookie `HttpOnly` ou le stockage sécurisé.

### Rôles

| Rôle | Valeur | Permissions |
|------|--------|-------------|
| Citoyen | `citizen` | Par défaut à l'inscription |
| Professionnel | `professional` | Assigné automatiquement lors de `POST /professionals` |
| Admin | `admin` | Gestion des statuts incidents, accès étendu |

---

## 🗃️ Schéma de base de données

### Relations principales

```
User (1) ──── (N) Incident
User (1) ──── (N) Comment
User (1) ──── (N) Confirmation       [UNIQUE user+incident]
User (1) ──── (N) Report             [UNIQUE user+incident]
User (1) ──── (N) Notification
User (1) ──── (N) ServiceRequest
User (1) ──── (1) Professional

Incident (1) ──── (N) Comment
Incident (1) ──── (N) Confirmation
Incident (1) ──── (N) Report
Incident (1) ──── (N) Notification
Incident (1) ──── (N) Intervention

Professional (1) ──── (N) ServiceRequest
Professional (1) ──── (N) Intervention
```

### Index géospatiaux

```sql
-- Index sur latitude/longitude (Incident + Professional)
CREATE INDEX idx_incident_lat  ON incidents(latitude);
CREATE INDEX idx_incident_lng  ON incidents(longitude);
CREATE INDEX idx_pro_lat       ON professionals(latitude);
CREATE INDEX idx_pro_lng       ON professionals(longitude);
```

### Logique métier automatique

| Trigger | Condition | Action |
|---------|-----------|--------|
| Confirmation | `confirmationCount >= 3` | Incident → statut `confirmed` |
| Incident critique | Admin → statut `critical` | `priorityScore = 100` |
| POST /professionals | Création réussie | User → rôle `professional` |

---

## ⚙️ Variables d'environnement

```env
# Application
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=zonalert_db
DB_SYNC=true          # false en production !
DB_LOGGING=false

# JWT (changer en production !)
JWT_ACCESS_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_in_production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS (URLs du frontend)
CORS_ORIGINS=http://localhost:8100,http://localhost:4200

# Rate limiting
THROTTLE_TTL=60       # secondes
THROTTLE_LIMIT=100    # requêtes par TTL
```

---

## 🛡️ Sécurité

| Mesure | Implémentation |
|--------|---------------|
| Hashage passwords | `bcrypt` (10 rounds) |
| JWT access token | Expiration 15 min |
| JWT refresh token | Hashé en base, expiration 7 jours |
| Entêtes sécurisés | `helmet()` |
| CORS | Origines configurables par env |
| Rate limiting | `express-rate-limit` (100 req/min) |
| Validation entrées | `ValidationPipe` whitelist strict |
| Sérialisation | `@Exclude()` sur `password` et `refreshToken` |
| Contrôle d'accès | `RolesGuard` + `@Roles(...)` |

---

## 📦 Scripts disponibles

```bash
npm run start:dev      # Développement avec hot-reload
npm run start:prod     # Production (après build)
npm run build          # Compilation TypeScript
npm run lint           # ESLint
npm run test           # Tests unitaires
npm run test:cov       # Couverture de tests

# Migrations TypeORM
npm run migration:generate  # Générer une migration
npm run migration:run       # Appliquer les migrations
npm run migration:revert    # Annuler la dernière migration
```

---

## 📚 Documentation interactive

En mode développement, Swagger UI est accessible sur :

**http://localhost:3000/api/docs**

Toutes les routes sont documentées avec :
- Description et paramètres
- Corps de requête typé
- Exemples de réponses
- Authentification Bearer intégrée

---

## 🔧 Configuration PostgreSQL rapide

```sql
-- Créer la base de données
CREATE DATABASE zonalert_db;
CREATE USER zonalert_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zonalert_db TO zonalert_user;
```

Avec `DB_SYNC=true`, TypeORM crée automatiquement toutes les tables au démarrage.

> ⚠️ Passer à `DB_SYNC=false` et utiliser les migrations en production.

---

## 🌍 Géolocalisation

La recherche géospatiale utilise la **formule de Haversine** implémentée directement en SQL PostgreSQL :

```sql
-- Incidents dans un rayon de 5km autour de (6.3703, 2.3912)
SELECT *, (
  6371 * acos(
    cos(radians(6.3703)) * cos(radians(latitude)) *
    cos(radians(longitude) - radians(2.3912)) +
    sin(radians(6.3703)) * sin(radians(latitude))
  )
) AS distance
FROM incidents
WHERE distance <= 5
ORDER BY distance ASC;
```

---

## 📈 Évolutions prévues

- [ ] Migration vers PostGIS pour les requêtes géospatiales avancées
- [ ] Intégration Firebase Cloud Messaging (push notifications mobiles)
- [ ] Système de review/rating pour les professionnels
- [ ] Module admin complet (dashboard, statistiques)
- [ ] Upload photos pour incidents et profils (S3/Cloudinary)
- [ ] Authentification Google/Facebook OAuth2
- [ ] Mise en cache Redis (incidents populaires, sessions)
- [ ] Tests E2E avec Supertest
