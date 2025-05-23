README.MD
# 🎮 Real-Time Quiz Game

Ein modernes, interaktives Multiplayer-Quiz-Spiel mit Echtzeit-Funktionalität, Firebase-Authentifizierung und erweiterten Features.

## ✨ Features

### 🎯 Spielfeatures
- **Echtzeit-Multiplayer**: Bis zu 10 Spieler gleichzeitig
- **10 Umfangreiche Kategorien**: Von Allgemeinwissen bis Musik
- **Schwierigkeitsgrade**: Einfach, Normal, Schwer
- **Erweiterte Punktevergabe**: Basis-Punkte + Geschwindigkeitsbonus + Streak-Bonus
- **Host-Kontrollen**: Spiel pausieren, überspringen, Einstellungen anpassen
- **Live-Ranglisten**: Echzeit-Punkteanzeige während des Spiels
- **Wiederverbindung**: Automatische Wiederverbindung bei Verbindungsabbruch

### 🎨 Design & UX
- **Modernes Dark Theme**: Professionelle Slate-Farbpalette mit Gradients
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **Animationen**: Smooth CSS-Animationen und Übergänge
- **Barrierefreie UI**: Screen Reader kompatibel, Tastatur-Navigation
- **Progressive Web App**: Offline-Funktionalität und App-Installation

### 🔧 Technische Features
- **Firebase-Integration**: Authentifizierung und Firestore-Datenbank
- **Socket.IO**: Echzeit-Kommunikation
- **Security**: CSP Headers, Rate Limiting, Input Validation
- **Performance**: Code-Splitting, Asset-Optimierung, Caching
- **Monitoring**: Error Tracking, Performance Metriken

## 📋 Kategorien

Das Spiel enthält 10 umfangreiche Kategorien mit insgesamt über 50 Fragen:

1. **🧠 Allgemeinwissen** (5 Fragen)
2. **🔬 Wissenschaft & Technik** (6 Fragen)
3. **📚 Geschichte** (5 Fragen)
4. **⚽ Sport** (5 Fragen)
5. **🌍 Geografie** (5 Fragen)
6. **🎨 Kunst & Kultur** (5 Fragen)
7. **🎬 Film & Fernsehen** (5 Fragen)
8. **🦁 Natur & Tiere** (5 Fragen)
9. **🍕 Essen & Trinken** (5 Fragen)
10. **🎵 Musik** (5 Fragen)

## 🚀 Installation

### Voraussetzungen
- Node.js 16+ 
- npm oder yarn
- Firebase-Projekt
- Git

### 1. Repository klonen
```bash
git clone <repository-url>
cd quiz-game
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Firebase-Projekt einrichten

1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com)
2. Erstellen Sie ein neues Projekt
3. Aktivieren Sie Authentication (Email/Password, Google)
4. Aktivieren Sie Firestore Database
5. Laden Sie die Service Account JSON herunter
6. Erstellen Sie eine Web-App und notieren Sie die Config

### 4. Environment-Variablen konfigurieren

Erstellen Sie `.env.game.example`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN_GAME_CLIENT=http://localhost:3000

# Firebase Configuration (Client-side)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Auth App URL (for Hall of Fame integration)
AUTH_APP_URL=https://your-auth-app.com

# Firebase Admin SDK (Server-side)
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json

# Session Configuration
SESSION_COOKIE_NAME=quizGameSession
SESSION_COOKIE_SECRET=your_super_secret_key_here
CSRF_TOKEN_HEADER_NAME=X-CSRF-Token
```

### 5. Audio-Dateien hinzufügen

Erstellen Sie das Verzeichnis `public/assets/sounds/` und fügen Sie folgende Audio-Dateien hinzu:
- `click.mp3` - Button-Click-Sound
- `correctanswer.mp3` - Richtige Antwort
- `incorrectanswer.mp3` - Falsche Antwort
- `streak.mp3` - Streak-Bonus
- `timesup.mp3` - Zeit abgelaufen
- `newquestion.mp3` - Neue Frage/Spiel-Start
- `menumusic.mp3` - Hintergrundmusik

### 6. Server starten

```bash
# Development
npm run dev

# Production
npm start
```

Der Server läuft auf `http://localhost:3000`

## 🎮 Spielanleitung

### Lobby erstellen
1. Registrieren Sie sich oder melden Sie sich an
2. Klicken Sie auf "Create New Lobby"
3. Teilen Sie die Lobby-ID mit Freunden
4. Wählen Sie eine Kategorie und Schwierigkeit
5. Starten Sie das Spiel

### Als Gast beitreten
1. Geben Sie Ihren Namen ein
2. Geben Sie die Lobby-ID ein
3. Klicken Sie auf "Join Lobby"

### Während des Spiels
- Antworten Sie schnell für Bonuspunkte
- Bauen Sie Streaks für extra Punkte auf
- Host kann das Spiel pausieren/fortsetzen
- Live-Rangliste zeigt aktuelle Platzierung

### Punktesystem
- **Basis-Punkte**: 10 Punkte pro richtiger Antwort
- **Geschwindigkeitsbonus**: Bis zu 5 Bonuspunkte für schnelle Antworten
- **Streak-Bonus**: Extra-Punkte für aufeinanderfolgende richtige Antworten
- **Schwierigkeitsmultiplikator**: Zeitlimits variieren je nach Schwierigkeit

## 🔧 Konfiguration

### Spiel-Einstellungen
Der Host kann folgende Einstellungen anpassen:
- **Anzahl Fragen**: 5-50 Fragen pro Spiel
- **Schwierigkeit**: Beeinflusst Zeitlimits
- **Zeitmultiplikator**: 0.5x - 2.0x

### Audio-Einstellungen
- Sounds können stumm geschaltet werden
- Automatische Sprachausgabe für richtige Antworten
- Hintergrundmusik in Menüs

### Barrierefreiheit
- Tastatur-Navigation mit Tab
- Screen Reader Support
- Hohe Kontraste verfügbar
- Fokus-Indikatoren

## 🏗️ Architektur

### Frontend
- **HTML5**: Semantic Markup, Progressive Enhancement
- **CSS3**: Tailwind CSS, Custom Animations, Responsive Design
- **JavaScript**: ES6+, Event-driven Architecture, Real-time Updates

### Backend
- **Node.js**: Express.js Server
- **Socket.IO**: Real-time Communication
- **Firebase**: Authentication & Database
- **Security**: Helmet, CORS, Rate Limiting

### Dateistruktur
```
quiz-game/
├── public/
│   ├── assets/
│   │   └── sounds/          # Audio-Dateien
│   ├── index.html           # Haupt-HTML
│   ├── main.js             # Frontend-Logik
│   └── style.css           # Styles
├── firebaseAdmin.js        # Firebase Admin Setup
├── questions.json          # Fragen-Datenbank
├── server.js              # Backend-Server
└── package.json
```

## 🔒 Sicherheit

### Implementierte Maßnahmen
- **Content Security Policy**: Schutz vor XSS
- **Rate Limiting**: API-Schutz
- **Input Validation**: Alle Eingaben validiert
- **Firebase Rules**: Sichere Datenbankzugriffe
- **CORS-Konfiguration**: Beschränkte Origins
- **Session Management**: Sichere Tokens

### Empfohlene Produktions-Einstellungen
```bash
NODE_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
FORCE_HTTPS=true
```

## 📊 Monitoring & Analytics

### Performance-Metriken
- Ladezeiten-Tracking
- Socket-Verbindungsstatistiken
- Lobby-Aktivitäten
- Fehler-Logging

### Spielstatistiken
- Spieler-Performance
- Beliebte Kategorien
- Durchschnittliche Punktzahlen
- Verbindungsqualität

## 🚀 Deployment

### Heroku
```bash
# Heroku CLI installieren und anmelden
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_API_KEY=your_key
# ... weitere Environment-Variablen
git push heroku main
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx-Konfiguration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛠️ Entwicklung

### Entwicklungsserver starten
```bash
npm run dev
```

### Tests ausführen
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Code-Formatierung
```bash
npm run format
```

## 📝 API-Dokumentation

### REST-Endpoints
- `GET /game/api/categories` - Verfügbare Kategorien
- `GET /game/api/categories/:name` - Kategorie-Details
- `GET /game/api/user` - Benutzer-Informationen
- `GET /game/api/lobby-stats` - Lobby-Statistiken

### Socket.IO-Events
- `createLobby` - Neue Lobby erstellen
- `joinLobby` - Lobby beitreten
- `startGame` - Spiel starten
- `submitAnswer` - Antwort abgeben
- `leaveLobby` - Lobby verlassen

## 🤝 Mitwirken

### Entwicklungs-Workflow
1. Fork das Repository
2. Erstellen Sie einen Feature-Branch
3. Implementieren Sie Ihre Änderungen
4. Schreiben Sie Tests
5. Erstellen Sie eine Pull Request

### Code-Standards
- ESLint-Konfiguration befolgen
- Prettier für Code-Formatierung
- Conventional Commits verwenden
- Tests für neue Features schreiben

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

### Häufige Probleme
- **Audio funktioniert nicht**: Browser-Autoplay-Richtlinien erfordern Benutzerinteraktion
- **Verbindungsprobleme**: Firewall/Proxy-Einstellungen prüfen
- **Performance-Probleme**: Browser-Cache leeren

### Logs prüfen
```bash
# Server-Logs
tail -f logs/app.log

# Browser-Konsole
F12 -> Console-Tab
```

### Community
- GitHub Issues für Bug-Reports
- Discussions für Feature-Requests
- Discord-Server für Echtzeit-Support

## 🎯 Roadmap

### Version 2.0
- [ ] Benutzerdefinierte Fragensets
- [ ] Turniere und Ranglisten
- [ ] Voice-Chat Integration
- [ ] Mobile App (React Native)

### Version 2.1
- [ ] Team-Modus
- [ ] Zeitbasierte Events
- [ ] Erweiterte Statistiken
- [ ] Admin-Dashboard

## 📞 Kontakt

- **Entwickler**: Quiz Game Team
- **E-Mail**: support@quizgame.dev
- **Website**: https://game.korczewski.de
- **GitHub**: https://github.com/username/quiz-game

---

**Viel Spaß beim Quiz-Spielen! 🎮🧠**
