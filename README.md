# 🎮 Kommilitonen Quiz - Real-Time Multiplayer Quiz Game

Eine moderne, skalierbare Multiplayer-Quiz-Anwendung mit Echtzeit-Funktionalität, Firebase-Authentifizierung und professioneller Microservice-Architektur.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![Firebase](https://img.shields.io/badge/firebase-integrated-orange.svg)

## 🏗️ Architektur-Übersicht

Das System besteht aus drei Hauptkomponenten:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Server   │    │   Game Server   │    │     Traefik     │
│   (Port 3001)   │    │   (Port 3000)   │    │  Reverse Proxy  │
│                 │    │                 │    │                 │
│ • User Auth     │    │ • Game Logic    │    │ • SSL/TLS       │
│ • Registration  │    │ • Socket.IO     │    │ • Load Balancer │
│ • Hall of Fame  │    │ • Real-time     │    │ • Let's Encrypt │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Firebase     │
                    │                 │
                    │ • Authentication│
                    │ • Firestore DB  │
                    │ • Admin SDK     │
                    └─────────────────┘
```

## ✨ Features

### 🎯 Spielfeatures
- **Echtzeit-Multiplayer**: Bis zu 10 Spieler gleichzeitig mit WebSocket-Verbindungen
- **6 Kategorien**: Allgemeinwissen, Wissenschaft, Geschichte, Geographie, Sport, Technologie
- **Intelligentes Punktesystem**:
    - Basis-Punkte basierend auf verbleibender Zeit
    - Dynamische Multiplikatoren (erhöhen sich bei richtigen Antworten)
    - Streak-System für aufeinanderfolgende richtige Antworten
- **Host-Kontrollen**: Spiel pausieren, überspringen, Einstellungen anpassen
- **Automatische Wiederverbindung**: Nahtlose Reconnection bei Verbindungsabbruch
- **Guest-Modus**: Spielen ohne Registrierung möglich

### 🔐 Authentifizierung & Sicherheit
- **Firebase Authentication**: Sichere Benutzeranmeldung
- **Dual-Mode**: Registrierte Benutzer und Gäste
- **CSRF-Schutz**: Cross-Site Request Forgery Prevention
- **Rate Limiting**: API-Schutz gegen Spam
- **Helmet.js**: Umfassende HTTP-Security-Headers
- **Admin-System**: Rollenbasierte Zugriffskontrolle

### 🎨 Technische Features
- **Containerisiert**: Docker & Docker Compose ready
- **SSL/TLS**: Automatische Let's Encrypt Zertifikate
- **Reverse Proxy**: Traefik für Load Balancing
- **Real-time Communication**: Socket.IO für Echtzeit-Updates
- **Responsive Design**: Mobile-first Ansatz
- **Error Handling**: Umfassendes Error Tracking

## 📂 Projektstruktur

```
kommilitonen-quiz/
├── auth/                          # Authentifizierungs-Mikroservice
│   ├── app.js                     # Express Server für Auth
│   ├── firebaseAdmin.js           # Firebase Admin SDK Setup
│   ├── routes/
│   │   └── hallOfFame.js          # Hall of Fame API Routes
│   ├── public/
│   │   ├── auth_client.js         # Frontend Auth Logic
│   │   └── auth_style.css         # Styling für Auth-Seiten
│   ├── Dockerfile                 # Container Definition
│   ├── package.json               # Dependencies
│   └── .env.auth.example          # Environment Template
│
├── game/                          # Spiel-Mikroservice
│   ├── server.js                  # Socket.IO Game Server
│   ├── firebaseAdmin.js           # Firebase Admin SDK Setup
│   ├── questions.json             # Fragen-Datenbank (90+ Fragen)
│   ├── public/                    # Frontend Assets (nicht im Upload)
│   ├── Dockerfile                 # Container Definition
│   ├── package.json               # Dependencies
│   └── .env.game.example          # Environment Template
│
├── scripts/
│   └── deploy.sh                  # Deployment Automation
├── docker-compose.yml             # Service Orchestration
├── health-check.sh                # System Health Monitoring
├── rebuild.sh                     # Quick Rebuild Script
└── README.md                      # Diese Datei
```

## 🚀 Schnellstart

### Voraussetzungen

- **Node.js** 18+ und npm
- **Docker** und Docker Compose
- **Firebase-Projekt** mit aktivierter Authentication und Firestore
- **Domain** mit DNS-Konfiguration (für Produktion)

### 1. Repository klonen

```bash
git clone <your-repository-url>
cd kommilitonen-quiz
```

### 2. Firebase-Projekt einrichten

1. Erstellen Sie ein [Firebase-Projekt](https://console.firebase.google.com)
2. Aktivieren Sie **Authentication** (Email/Password + Google)
3. Aktivieren Sie **Firestore Database**
4. Erstellen Sie eine **Web-App** und notieren Sie die Config
5. Generieren Sie einen **Service Account Key** (JSON)
6. Platzieren Sie die JSON-Datei als `service-account.json` in beiden Ordnern (`auth/` und `game/`)

### 3. Environment-Variablen konfigurieren

**Auth Server (.env.auth):**
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN_GAME_CLIENT=https://game.korczewski.de
CORS_ORIGIN_AUTH_APP=https://auth.korczewski.de

# Firebase Client SDK (from Firebase Console)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/service-account.json

# Game Server URL
GAME_APP_URL=https://game.korczewski.de

# Security
SESSION_SECRET=your_super_secret_key_here
CSRF_SECRET_COOKIE_NAME=_csrf_auth

# Admin User (wird automatisch erstellt)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password
```

**Game Server (.env.game):**
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN_GAME_CLIENT=https://game.korczewski.de

# Firebase Configuration (identisch mit Auth Server)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/service-account.json

# Auth Server URL
AUTH_APP_URL=https://auth.korczewski.de
```

### 4. DNS konfigurieren

Erstellen Sie A-Records für Ihre Domain:
```
auth.yourdomain.com  →  YOUR_SERVER_IP
game.yourdomain.com  →  YOUR_SERVER_IP
```

### 5. Deployment

```bash
# Automatisches Deployment
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Oder manuell
docker-compose up -d --build
```

### 6. Gesundheitscheck

```bash
# System-Status prüfen
chmod +x health-check.sh
./health-check.sh

# Logs anzeigen
docker-compose logs -f
```

## 🎮 Spielmechanik

### Punktesystem

Das innovative Punktesystem belohnt sowohl Korrektheit als auch Geschwindigkeit:

```javascript
// Basis-Punkte = verbleibende Zeit (in Sekunden)
const basePoints = Math.max(0, timeLimit - timeTaken);

// Finale Punkte = Basis-Punkte × Multiplikator
const finalPoints = basePoints * playerMultiplier;

// Multiplikator-System:
// - Richtige Antwort: +1 zum Multiplikator
// - Falsche Antwort: -1 zum Multiplikator (Minimum: 1)
```

### Lobby-System

1. **Host erstellt Lobby** → Erhält eindeutige Lobby-ID
2. **Spieler treten bei** → Mit Lobby-ID oder als Gast
3. **Host wählt Kategorie** → Aus 6 verfügbaren Kategorien
4. **Spiel startet** → 10 zufällige Fragen der Kategorie
5. **Echtzeit-Antworten** → Alle Spieler antworten gleichzeitig
6. **Live-Rangliste** → Updates nach jeder Frage

### WebSocket-Events

**Client → Server:**
- `createLobby` - Neue Lobby erstellen
- `joinLobby` - Lobby beitreten
- `startGame` - Spiel starten (nur Host)
- `submitAnswer` - Antwort abgeben
- `hostTogglePause` - Spiel pausieren/fortsetzen

**Server → Client:**
- `lobbyUpdate` - Lobby-Status Update
- `question` - Neue Frage senden
- `timerUpdate` - Timer-Countdown
- `answerResult` - Antwort-Feedback
- `gameOver` - Spiel beendet

## 🔧 API-Referenz

### Auth Server Endpoints

```http
GET  /                      # Login/Register-Seite
POST /api/auth/register     # Benutzer registrieren
GET  /api/user              # Benutzer-Profil abrufen
GET  /api/hall-of-fame      # Hall of Fame anzeigen
POST /api/hall-of-fame/submit  # Score einreichen
```

### Game Server Endpoints

```http
GET  /                      # Spiel-Hauptseite
GET  /game/api/categories   # Verfügbare Kategorien
GET  /game/api/user         # Benutzer-Status prüfen
```

## 🐳 Docker-Konfiguration

### Microservice-Architektur

Jeder Service läuft in einem eigenen Container:

**Auth Server Container:**
- Node.js 18-slim Base Image
- Port 3001 exponiert
- Firebase Admin SDK konfiguriert
- Volume-Mounts für Development

**Game Server Container:**
- Node.js 18-slim Base Image
- Port 3000 exponiert
- Socket.IO für Real-time Communication
- Volume-Mounts für Development

**Traefik Reverse Proxy:**
- Automatische SSL-Zertifikate
- Load Balancing
- Health Checks
- Dashboard auf Port 8080

### Produktions-Optimierungen

```dockerfile
# Multi-stage Builds für kleinere Images
FROM node:18-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🛡️ Sicherheitsfeatures

### Authentifizierung
- Firebase Authentication mit JWT-Tokens
- Sichere Session-Management
- CSRF-Schutz mit Tokens
- Rate Limiting für API-Endpunkte

### Netzwerk-Sicherheit
- HTTPS-Erzwingung via Traefik
- CORS-Konfiguration
- Content Security Policy Headers
- HTTP Security Headers via Helmet.js

### Input-Validierung
```javascript
// Beispiel: Antwort-Validierung
if (!lobbyId || !questionIndex || !answer) {
    return socket.emit('answerError', { 
        message: 'Invalid submission data' 
    });
}
```

## 📊 Monitoring & Debugging

### Health Checks

```bash
# Automatisierte Gesundheitschecks
./health-check.sh

# Manuelle Container-Überwachung
docker-compose ps
docker-compose logs auth_server
docker-compose logs game_server
```

### Logging-Strategien

**Strukturiertes Logging:**
```javascript
console.log(`Player ${playerId} joined lobby ${lobbyId}`);
console.error('Firebase Admin SDK initialization error', error);
```

**Container-Logs:**
```bash
# Alle Services
docker-compose logs -f

# Spezifischer Service
docker-compose logs -f game_server

# Mit Timestamps
docker-compose logs -f -t
```

## 🔄 Development Workflow

### Lokale Entwicklung

```bash
# Auth Server
cd auth && npm run dev

# Game Server
cd game && npm run dev

# Mit Docker (Hot Reload)
docker-compose up -d
```

### Code-Struktur

**Auth Server (auth/app.js):**
- Express.js REST API
- Firebase Admin SDK Integration
- Session Management
- Dynamic HTML Generation

**Game Server (game/server.js):**
- Socket.IO Event Handling
- Game State Management
- Real-time Communication
- Player Management

### Datenbank-Schema

**Firestore Collections:**

```javascript
// users/{userId}
{
  email: "user@example.com",
  displayName: "Player Name",
  role: "user" | "admin",
  createdAt: Timestamp,
  isVerified: boolean
}

// hallOfFame/{entryId}
{
  userId: "user-id",
  playerName: "Display Name",
  score: 150,
  category: "Wissenschaft",
  submittedAt: Timestamp
}
```

## 🚀 Deployment-Strategien

### Produktions-Deployment

1. **Server vorbereiten:**
   ```bash
   # Docker installieren
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Docker Compose installieren
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Automated Deployment:**
   ```bash
   ./scripts/deploy.sh
   ```

### Skalierung

**Horizontale Skalierung:**
```yaml
game_server:
  deploy:
    replicas: 3
  depends_on:
    - auth_server
```

**Load Balancing via Traefik:**
- Automatische Service Discovery
- Health Check Integration
- Sticky Sessions für Socket.IO

## 🔧 Troubleshooting

### Häufige Probleme

**Firebase-Konfiguration fehlt:**
```bash
# Prüfen Sie die .env-Dateien
cat auth/.env.auth | grep FIREBASE
cat game/.env.game | grep FIREBASE
```

**CORS-Fehler:**
```javascript
// Prüfen Sie die Origin-Konfiguration
const corsOrigins = [
    process.env.CORS_ORIGIN_GAME_CLIENT,
    process.env.CORS_ORIGIN_AUTH_APP
];
```

**SSL-Zertifikat-Probleme:**
```bash
# Traefik-Logs prüfen
docker-compose logs traefik

# Let's Encrypt Status
ls -la letsencrypt/acme.json
```

### Debug-Modus

```bash
# Debug-Informationen aktivieren
NODE_ENV=development docker-compose up

# Detaillierte Socket.IO-Logs
DEBUG=socket.io* npm run dev
```

## 📈 Performance-Optimierungen

### Frontend-Optimierungen
- Komprimierte Assets via gzip
- Tailwind CSS für minimalen CSS-Footprint
- Event-debouncing für Socket.IO
- Efficient DOM-Updates

### Backend-Optimierungen
- Connection Pooling für Firebase
- Memory-efficient Player State Management
- Rate Limiting für API-Schutz
- Compression Middleware

### Monitoring-Metriken
```javascript
// Beispiel: Performance-Tracking
const gameStartTime = Date.now();
// ... Spiel-Logic
const gameDuration = Date.now() - gameStartTime;
console.log(`Game completed in ${gameDuration}ms`);
```

## 🤝 Contributing

### Development Setup

1. Fork das Repository
2. Feature-Branch erstellen: `git checkout -b feature/amazing-feature`
3. Änderungen committen: `git commit -m 'Add amazing feature'`
4. Branch pushen: `git push origin feature/amazing-feature`
5. Pull Request erstellen

### Code-Standards

- **ESLint** für JavaScript-Linting
- **Prettier** für Code-Formatting
- **Conventional Commits** für Commit-Messages
- **Jest** für Unit-Tests (wenn implementiert)

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/kommilitonen-quiz/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/kommilitonen-quiz/discussions)
- **Email**: support@yourdomain.com

## 🎯 Roadmap

### Version 2.0
- [ ] Mobile App (React Native)
- [ ] Voice Chat Integration
- [ ] Custom Question Sets
- [ ] Tournament Mode
- [ ] Advanced Analytics Dashboard

### Version 2.1
- [ ] AI-powered Question Generation
- [ ] Team Mode
- [ ] Localization (English, Spanish)
- [ ] Social Media Integration
- [ ] Advanced Admin Controls

---

**Entwickelt mit ❤️ für interaktive Lernspiele**

*Viel Spaß beim Quiz-Spielen! 🎮🧠*# l2p
