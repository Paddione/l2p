# Learn2Play - Multiplayer Quiz-Spiel 🎮

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-containerized-blue)]()
[![Language Support](https://img.shields.io/badge/languages-EN%20%7C%20DE-orange)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

> Ein funktionsreiches Echtzeit-Multiplayer-Quiz-Spiel mit erweiterten Punktevergabe, Bestenlisten und umfassender Lokalisierungsunterstützung.

## 🚀 Schnellstart

```bash
# Repository klonen
git clone https://github.com/YOUR-USERNAME/learn2play.git
cd learn2play

# Umgebung einrichten
npm run setup

# Anwendung starten
docker-compose up -d

# Datenbank initialisieren
docker-compose exec l2p-api node backend/scripts/db-manager.js init
```

**Anwendung aufrufen:**
- **Lokal**: http://localhost:8080
- **Produktion**: https://ihre-domain.com

## ✨ Funktionen

### 🎯 Echtzeit-Multiplayer-Gaming
- **Synchronisierte Sessions**: Server-koordinierte Spielstarts für alle Spieler
- **Live-Fragenfortschritt**: Automatisches Voranschreiten mit 60-Sekunden-Timer
- **Echtzeit-Status-Updates**: Live-Anzeige des Spielerfortschritts und der Bereitschaft
- **Adaptives Polling**: Intelligentes Polling-System (3-23 Sekunden) mit Rate-Limit-Behandlung
- **Anpassbare Spiele**: 1-100 Fragen mit zufälliger Auswahl aus Fragensätzen
- **Persistente Lobbys**: Lobbys bleiben nach Spielen aktiv für kontinuierliches Spielen

### 🏆 Erweiterte Punktevergabe
- **Zeitbasierte Punkte**: Dynamische Punktevergabe (60 Basispunkte minus vergangene Zeit)
- **Multiplikator-System**: Individuelle Stapel (1x → 2x → 3x → 4x → 5x) für aufeinanderfolgende richtige Antworten
- **Visuelles Feedback**: Echtzeit-Avatar-Blinken (grün/rot) und Multiplikator-Abzeichen
- **Intelligenter Reset**: Multiplikatoren werden bei falschen Antworten zurückgesetzt
- **Formel**: `(60 - vergangene_sekunden) × persönlicher_multiplikator`

### 🎵 Immersive Audio-Erfahrung
- **32 Soundeffekte**: Vollständiges Audio-System mit kategorisierten Sounds
  - **Spiel-Sounds**: `correct1.mp3` bis `correct5.mp3` für Streak-Feedback
  - **UI-Sounds**: `button-click.mp3`, `button-hover.mp3`, `modal-open.mp3`, `modal-close.mp3`
  - **Benachrichtigungs-Sounds**: `player-join.mp3`, `player-leave.mp3`, `player-ready.mp3`
  - **Timer-Sounds**: `timer-warning.mp3`, `timer-urgent.mp3`, `countdown-tick.mp3`
  - **Spezialeffekte**: `applause.mp3`, `sparkle.mp3`, `whoosh.mp3`, `combobreaker.mp3`
  - **Achievement-Sounds**: `high-score.mp3`, `perfect-score.mp3`, `streak-bonus.mp3`, `multiplier-max.mp3`
- **Hintergrundmusik**: Ambient-Musiktrack für immersives Gameplay
- **Progressive Rückmeldung**: Streak-basierte Soundeffekte für aufeinanderfolgende richtige Antworten
- **Unabhängige Lautstärkeregler**: Separate Musik- und Soundeffekt-Regler
- **Persistente Einstellungen**: Lautstärke-Präferenzen werden in localStorage gespeichert

### 🏅 Ruhmeshalle & Bestenlisten
- **Fragensatz-Bestenlisten**: Top 10 Punkte pro Fragensatz
- **Medaillensystem**: Gold/Silber/Bronze für die Top 3 Spieler mit Verlaufshintergründen
- **Umfassende Statistiken**: Charakter, Benutzername, Punkte, Genauigkeit, maximaler Multiplikator
- **Ein-Klick-Upload**: Direkte Punkteübertragung aus Spielergebnissen
- **Fairer Wettbewerb**: Nur vollständige Fragensatz-Durchläufe qualifizieren für die Ruhmeshalle

### 🌐 Zweisprachige Unterstützung
- **Vollständige Lokalisation**: Vollständige deutsche 🇩🇪 und englische 🇺🇸 Unterstützung
- **Flaggen-basiertes Umschalten**: Sofortiges Sprachwechseln mit Flaggen-Buttons
- **Echtzeit-Updates**: Alle UI-Elemente werden sofort aktualisiert
- **Persistente Einstellungen**: Sprachpräferenz wird gespeichert und wiederhergestellt
- **Dynamische Übersetzung**: Intelligentes Fallback-System für beide Sprachen

### 🎨 Modernes UI/UX
- **Dunkel/Hell-Modus**: Vollständige Theme-Unterstützung mit sanften Übergängen
- **Visuelles Feedback**: Animierte Antwort-Reaktionen mit Farbkodierung
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobilgeräte
- **Interaktives Hilfesystem**: 6-Abschnitte umfassende Dokumentation
- **Ladezustände**: Fortschrittsanzeigen in der gesamten Anwendung
- **Visuelle Assets**: SVG-Grafiken einschließlich Wissenskarte und Quiz-Pattern-Designs

## 🏗️ Architektur

### Technologie-Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js 18+ mit Express.js
- **Datenbank**: PostgreSQL 15+ mit Connection Pooling
- **Reverse Proxy**: Traefik v3.0 mit automatischem SSL
- **Containerisierung**: Docker & Docker Compose
- **SSL/TLS**: Let's Encrypt über Traefik

### Service-Architektur
```
[Traefik] → [Frontend:8080] → Statische Dateien & UI
         → [Backend:3000]   → API & Spiellogik
         → [PostgreSQL:5432] → Datenspeicherung
```

### Projektstruktur
```
learn2play/
├── 📁 backend/           # Node.js API-Server
│   ├── routes/           # API-Endpunkte
│   ├── models/           # Datenmodelle
│   ├── database/         # DB-Konfiguration & Schemas
│   ├── middleware/       # Express-Middleware
│   └── scripts/          # Datenbankmanagement-Tools
├── 📁 public/            # Frontend-Anwendung
│   ├── js/               # JavaScript-Module
│   │   ├── api/          # API-Kommunikation
│   │   ├── game/         # Spielmechaniken
│   │   ├── ui/           # UI-Komponenten
│   │   └── utils/        # Hilfsprogramme
│   ├── css/              # Stylesheets
│   └── assets/           # Bilder & Audio-Dateien
├── 📁 docker/            # Docker-Build-Dateien
├── 📁 traefik_config/    # Reverse-Proxy-Konfiguration
├── 📁 scripts/           # Setup- und Management-Skripte
└── 📄 docker-compose.yml # Container-Orchestrierung
```

## 🔧 Entwicklung

### Voraussetzungen
- Docker & Docker Compose
- Node.js 18+ (für lokale Entwicklung)
- Git

### Umgebungseinrichtung

#### Automatische Einrichtung (Empfohlen)
```bash
npm run setup -- \
  --email=admin@domain.com \
  --production-domain=game.domain.com \
  --traefik-domain=traefik.domain.com \
  --local-ip=IHRE_LOKALE_IP \
  --traefik-user=admin \
  --traefik-pass=SecurePassword123! \
  --env-type=production
```

Das Setup-Skript wird:
- Sichere JWT-Geheimnisse generieren
- Traefik-Dashboard-Authentifizierung erstellen
- SSL-Zertifikate konfigurieren
- Datenbank-Anmeldedaten einrichten
- CORS-Origins konfigurieren
- Produktionsbereite `.env`-Datei erstellen

#### Manuelle Einrichtung
```bash
cp env.example .env
# .env mit Ihrer Konfiguration bearbeiten
```

### Verfügbare Befehle
```bash
# Entwicklung
npm run start             # Alle Services starten
npm run rebuild           # Schneller Rebuild (empfohlen)
npm run rebuild:clean     # Sauberer Rebuild
npm run logs              # Alle Logs anzeigen
npm run logs:api          # Nur Backend-Logs
npm run logs:app          # Nur Frontend-Logs
npm run status            # Service-Status
npm run stop              # Services stoppen
npm run down              # Services stoppen und Container entfernen

# Entwicklungsmodus
npm run dev-mode:enable   # Entwicklungsmodus aktivieren
npm run dev-mode:disable  # Entwicklungsmodus deaktivieren

# Datenbankmanagement
docker-compose exec l2p-api node backend/scripts/db-manager.js status
docker-compose exec l2p-api node backend/scripts/db-manager.js init
docker-compose exec l2p-api node backend/scripts/db-manager.js reset --force
```

### Datenbankmanagement

Das `db-manager.js`-Skript bietet umfassende Datenbankoperationen:

#### Verfügbare Befehle
- **`status`**: Aktuellen Datenbankstatus und erforderliche Tabellen prüfen
- **`init`**: Datenbankschema initialisieren oder aktualisieren (sicher, erhält Daten)
- **`init --force`**: Datenbank zurücksetzen und neu initialisieren (destruktiv)
- **`reset --force`**: Vollständiger Datenbank-Reset (destruktiv)

#### Datenbankschema
Die Anwendung verwendet folgende Tabellen:
- **`users`**: Benutzerkonten und Authentifizierung
- **`hall_of_fame`**: Bestenlisten-Einträge mit Punkten und Statistiken
- **`lobbies`**: Aktive Spiel-Lobbys
- **`lobby_players`**: Spieler-Lobby-Beziehungen
- **`question_sets`**: Fragensatz-Metadaten und -Inhalte

### Änderungen vornehmen
1. **Frontend**: Dateien in `public/` bearbeiten, Browser aktualisieren
2. **Backend**: Dateien in `backend/` bearbeiten, neu starten: `docker-compose restart l2p-api`
3. **Datenbank**: Schema ändern, ausführen: `docker-compose exec l2p-api node backend/scripts/db-manager.js init`

## 🚀 Deployment

### Produktions-Deployment
1. **Umgebung konfigurieren**: `.env`-Datei mit Produktionswerten einrichten
2. **Docker-Netzwerk erstellen**: `docker network create l2p-network`
3. **Services starten**: `docker-compose up -d`
4. **Datenbank initialisieren**: `docker-compose exec l2p-api node backend/scripts/db-manager.js init`
5. **Gesundheit überprüfen**: `https://ihre-domain.com/api/health` prüfen

### SSL-Konfiguration
- Automatisches SSL über Let's Encrypt und Traefik
- Zertifikate im `letsencrypt/`-Verzeichnis gespeichert
- Automatische Erneuerung durch Traefik
- Sichere Dateiberechtigungen: `chmod 600 letsencrypt/acme.json`

### Gesundheitschecks
- **Backend**: `GET /api/health` - Service-Status und Datenbankverbindung
- **Frontend**: `GET /` - Statische Datei-Bereitstellung
- **Datenbank**: PostgreSQL-Gesundheitschecks mit Schema-Validierung
- **Traefik**: Eingebauter Ping-Gesundheitscheck

## 🛠️ Skripte & Hilfsprogramme

### Setup-Skripte
- **`scripts/setup-env.sh`**: Automatisierte Umgebungskonfiguration
- **`scripts/enable-dev-mode.sh`**: Entwicklungsmodus mit Cache-Clearing aktivieren
- **`scripts/disable-dev-mode.sh`**: Entwicklungsmodus deaktivieren
- **`rebuild.sh`**: Schnelles Anwendungs-Rebuild-Skript

### Datenbank-Skripte
- **`backend/scripts/db-manager.js`**: Umfassendes Datenbankmanagement-Tool

### Entwicklungsmodus
Der Entwicklungsmodus bietet:
- Erzwungenes Cache-Clearing beim Anwendungsstart
- Erweiterte Protokollierung und Debugging
- Automatische Frontend-Cache-Invalidierung
- Entwicklungsspezifische Middleware

## 🔍 API-Dokumentation

### Authentifizierungs-Endpunkte
- `POST /api/auth/register` - Benutzerregistrierung
- `POST /api/auth/login` - Benutzeranmeldung
- `POST /api/auth/logout` - Benutzerabmeldung
- `GET /api/auth/me` - Aktuelle Benutzerinfo
- `GET /api/auth/verify` - Token-Verifizierung

### Spiel-Lobby-Endpunkte
- `POST /api/lobbies/create` - Neue Lobby erstellen
- `GET /api/lobbies/list` - Aktive Lobbys auflisten
- `GET /api/lobbies/:code` - Lobby-Details abrufen
- `POST /api/lobbies/:code/join` - Lobby beitreten
- `POST /api/lobbies/:code/start` - Spiel starten
- `POST /api/lobbies/:code/answer` - Antwort einreichen

### Ruhmeshalle-Endpunkte
- `GET /api/hall-of-fame` - Bestenlisten-Einträge abrufen
- `POST /api/hall-of-fame` - Neue Punktzahl einreichen
- `GET /api/hall-of-fame/leaderboard/:catalog` - Katalog-spezifische Bestenliste

### Fragensatz-Endpunkte
- `GET /api/question-sets` - Verfügbare Fragensätze auflisten
- `POST /api/question-sets` - Neuen Fragensatz hochladen
- `GET /api/question-sets/:id` - Spezifischen Fragensatz abrufen

## 🚨 Fehlerbehebung

### Häufige Probleme

**Datenbankverbindungsfehler**
```bash
docker-compose exec l2p-api node backend/scripts/db-manager.js status
# Bei anhaltenden Problemen:
docker-compose down -v && docker-compose up -d
```

**SSL-Zertifikat-Probleme**
```bash
chmod 600 letsencrypt/acme.json
docker-compose logs traefik
```

**Weißer Bildschirm-Probleme**
- Browser hart aktualisieren (Strg+F5)
- `docker-compose ps` prüfen - alle Services sollten "healthy" sein
- API-Gesundheit testen: `curl http://localhost/api/health`

**Docker-Netzwerk-Probleme**
```bash
docker network create l2p-network
docker-compose up -d
```

### Debug-Befehle
```bash
docker-compose ps                    # Service-Status
docker-compose logs [service-name]   # Service-Logs
curl http://localhost/api/health     # API-Gesundheitscheck
docker-compose exec l2p-api node backend/scripts/db-manager.js status  # Datenbankstatus
```

## 📈 Performance & Überwachung

### Gesundheitsüberwachung
- **Service-Gesundheitschecks**: Automatische Gesundheitsüberwachung für alle Services
- **Datenbanküberwachung**: Connection-Pool-Status und Query-Performance
- **Load Balancer**: Traefik-Gesundheitschecks mit automatischem Failover
- **SSL-Zertifikat-Überwachung**: Automatische Erneuerung und Ablaufverfolgung

### Performance-Features
- **Datenbank-Connection-Pooling**: Optimierte PostgreSQL-Verbindungen
- **Statisches Asset-Caching**: Frontend-Asset-Optimierung
- **Rate Limiting**: API-Schutz mit konfigurierbaren Limits
- **Komprimierung**: Gzip-Komprimierung für alle Antworten

## 🔄 Aktuelle Updates

### v1.6.0 - Sprach- & Entwicklungsfeatures
- **🌐 Zweisprachige Unterstützung**: Vollständige deutsche/englische Lokalisation mit flaggen-basiertem Umschalten
- **🛠️ Entwicklungsmodus**: Erzwungenes Cache-Clearing-System für Entwicklungsworkflow
- **🧹 Code-Qualität**: Aufgeräumte Konsolen-Logs und verbesserte Fehlerbehandlung
- **🔒 Sicherheit**: Verbesserte JWT-Behandlung und Eingabevalidierung
- **🐳 Docker**: Multi-Stage-Builds und Performance-Optimierungen

### Audio-System-Verbesserungen
- **Vollständige Audio-Bibliothek**: 32 kategorisierte Soundeffekte für immersives Gameplay
- **Hintergrundmusik**: Ambient-Soundtrack für verbesserte Benutzererfahrung
- **Progressive Audio-Rückmeldung**: Streak-basiertes Sound-Progressionssystem
- **Lautstärkeregelung**: Unabhängige Musik- und Soundeffekt-Kontrollen

### Datenbank-Verbesserungen
- **Erweiterte Verwaltung**: Umfassende Datenbankmanagement-Tools
- **Schema-Validierung**: Automatische Datenbankstruktur-Verifizierung
- **Sichere Migrationen**: Nicht-destruktive Datenbank-Updates
- **Gesundheitsüberwachung**: Echtzeit-Datenbankstatus-Prüfung

## 🤝 Mitwirken

1. **Repository forken**: Erstellen Sie Ihren eigenen Fork des Projekts
2. **Feature-Branch erstellen**: `git checkout -b feature/amazing-feature`
3. **Änderungen vornehmen**: Implementieren Sie Ihr Feature oder Ihren Fix
4. **Gründlich testen**: Stellen Sie sicher, dass alle Tests bestehen und Features funktionieren
5. **Dokumentation aktualisieren**: Fügen Sie relevante Dokumentation hinzu
6. **Änderungen committen**: `git commit -m 'Add amazing feature'`
7. **Zu Branch pushen**: `git push origin feature/amazing-feature`
8. **Pull Request öffnen**: Erstellen Sie einen detaillierten Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die [LICENSE](LICENSE)-Datei für Details.

## 🙏 Danksagungen

- **Traefik**: Für exzellentes Reverse-Proxy und SSL-Management
- **PostgreSQL**: Für robuste Datenbankperformance
- **Docker**: Für Containerisierung und Deployment-Vereinfachung
- **Let's Encrypt**: Für kostenlose SSL-Zertifikate
- **Audio-Assets**: Benutzerdefinierte Soundeffekte und Musik für immersive Erfahrung 