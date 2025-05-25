# Inhaltsverzeichnis und Analyse des Quiz-Spiels

## Projektüberblick

Dies ist ein vollständiger Multiplayer-Quiz-Anwendung mit zwei Hauptservern (Auth & Game) und einer modularen Client-Architektur. Das System verwendet Node.js/Express auf der Backend-Seite, Socket.IO für Echtzeit-Kommunikation und Firebase für Authentifizierung und Datenspeicherung.

---

## 📁 Projektstruktur

### **Root-Verzeichnis**
- **docker-compose.yml** - Docker-Orchestrierung für Production-Deployment
- **README.md** - Projektdokumentation (leer)
- **Tasks.md** - Aufgabenliste
- **Funktionskatalog.md** - Funktionsübersicht
- **.gitignore** - Git-Ignore-Regeln

### **🔐 Auth-Server (/auth/)**
- **app.js** - Hauptserver für Authentifizierung
- **firebaseAdmin.js** - Firebase Admin SDK Konfiguration
- **package.json** - Abhängigkeiten für Auth-Server
- **Dockerfile** - Container-Konfiguration
- **routes/hallOfFame.js** - Bestenlisten-API
- **public/** - Statische Dateien für Login-UI
    - **auth_client.js** - Client-seitige Auth-Logik
    - **auth_style.css** - Styling für Login-Seite

### **🎮 Game-Server (/game/)**
- **server.js** - Hauptserver-Einstiegspunkt
- **config.js** - Konfiguration und Umgebungsvalidierung
- **firebaseAdmin.js** - Firebase Admin SDK Setup
- **package.json** - Game-Server Abhängigkeiten
- **Dockerfile** - Container für Game-Server
- **questions.json** - Fragenkatalog nach Kategorien
- **routes.js** - Express-Routen für API
- **socketHandlers.js** - Socket.IO Event-Handler
- **middleware.js** - Express-Middleware Setup
- **database.js** - Datenbankoperationen
- **gameLogic.js** - Kernspiel-Logik
- **gameManager.js** - Spielablauf-Management
- **lobbyManager.js** - Lobby-Verwaltung

### **💻 Client-Code (/game/public/)**
- **index.html** - Hauptseite mit UI-Struktur
- **style.css** - Moderne UI-Styles
- **sw.js** - Service Worker (minimal)
- **main.js** - Backwards-Kompatibilität (deprecated)
- **js/** - Modulare Client-Architektur
    - **main.js** - Haupteinstiegspunkt
    - **state.js** - Zentrales Zustandsmanagement
    - **auth.js** - Firebase-Authentifizierung
    - **socket.js** - Socket.IO Client-Handler
    - **ui.js** - UI-Management und DOM-Manipulation
    - **game.js** - Spiellogik (Timer, Antworten)
    - **sound.js** - Audio-System
    - **api.js** - API-Aufrufe
    - **eventListeners.js** - Event-Handler Setup
    - **utils.js** - Hilfsfunktionen

---

## 🔧 Funktionalität der Module

### **Auth-Server Komponenten**

#### **app.js** - Authentifizierungs-Hub
- **Zweck**: Zentraler Auth-Server mit Firebase Integration
- **Funktionen**:
    - Benutzerregistrierung und -anmeldung
    - Session-Management mit CSRF-Schutz
    - Admin-Benutzer-Erstellung
    - Dynamische HTML-Generierung mit Config-Injection
    - CORS-Konfiguration für Multi-Domain-Setup

#### **routes/hallOfFame.js** - Bestenlisten-System
- **Zweck**: API für Highscores und Spielstatistiken
- **Funktionen**:
    - Score-Submission mit Authentifizierung
    - Bestenlisten-Abfrage mit Filterung
    - Kategoriebasierte Ranglisten

### **Game-Server Komponenten**

#### **server.js** - Game-Server Orchestrator
- **Zweck**: Haupteinstiegspunkt mit Server-Setup
- **Funktionen**:
    - Express + Socket.IO Server-Initialisierung
    - Middleware- und Route-Setup
    - Graceful Shutdown-Handling

#### **config.js** - Konfigurations-Manager
- **Zweck**: Zentrale Konfiguration und Validierung
- **Funktionen**:
    - Umgebungsvariablen-Validierung
    - Firebase-Config für Client-Injection
    - CORS-Origins Management
    - Spiel-Konstanten (Timer, Punkte, etc.)

#### **gameLogic.js** - Spiel-Kern
- **Zweck**: Fundamentale Spielmechaniken
- **Funktionen**:
    - Fragen laden und validieren
    - Punkte-Berechnung (Zeit-basiert)
    - Lobby-ID Generierung
    - Spieler-Name Resolution

#### **gameManager.js** - Spielablauf-Controller
- **Zweck**: Orchestrierung des Spielflusses
- **Funktionen**:
    - Spiel starten/beenden
    - Fragen-Timing und -Versendung
    - Antwort-Verarbeitung
    - Live-Score Updates
    - Ergebnis-Compilation

#### **lobbyManager.js** - Lobby-Verwaltung
- **Zweck**: Mehrspieler-Lobby-System
- **Funktionen**:
    - Lobby-Erstellung und -Beitritt
    - Spieler-Verbindungsmanagement
    - Host-Wechsel bei Disconnect
    - Lobby-Cleanup und Lifecycle

#### **socketHandlers.js** - Echtzeit-Kommunikation
- **Zweck**: Socket.IO Event-Management
- **Funktionen**:
    - Firebase-Token-Authentifizierung
    - Guest-User Support
    - Event-Routing (Lobby, Game, Disconnect)
    - Error-Handling mit strukturierten Responses

#### **database.js** - Persistierung
- **Zweck**: Firestore-Datenbankoperationen
- **Funktionen**:
    - Spielergebnisse speichern
    - Spielerstatistiken verwalten
    - Bestenlisten-Abfragen
    - Historische Spieldaten

### **Client-Module**

#### **main.js** - Client-Orchestrator
- **Zweck**: Anwendungs-Initialisierung und Dependency-Management
- **Funktionen**:
    - Modul-Dependencies Setup
    - Firebase-Konfiguration-Validierung
    - Error-Handling für kritische Startfehler

#### **state.js** - Zustandsmanagement
- **Zweck**: Zentraler Application State
- **Funktionen**:
    - Socket/Firebase Instanzen
    - Lobby/Spieler/Spiel-Zustand
    - UI-State (aktuelle Ansicht, Mute-Status)
    - LocalStorage-Persistierung

#### **auth.js** - Authentifizierungs-Client
- **Zweck**: Firebase Auth Integration
- **Funktionen**:
    - Email/Password Login
    - Guest-Mode Support
    - Auth-State-Listener
    - Token-Management
    - Logout mit State-Cleanup

#### **socket.js** - Echtzeit-Client
- **Zweck**: Socket.IO Client-Management
- **Funktionen**:
    - Verbindungsmanagement mit Auto-Reconnect
    - Event-Emission (Lobby, Game Actions)
    - Server-Event-Handling
    - Auth-Token Integration

#### **ui.js** - UI-Management
- **Zweck**: DOM-Manipulation und Screen-Management
- **Funktionen**:
    - Screen-Transitions (Auth, Lobby, Game, Results)
    - Dynamic HTML-Generierung
    - Event-Listener Setup
    - Responsive UI-Updates
    - Audio-Element-Erstellung

#### **game.js** - Client-Spiellogik
- **Zweck**: Spiel-Mechaniken auf Client-Seite
- **Funktionen**:
    - Question-Timer mit visuellen Effekten
    - Answer-Feedback Processing
    - State-Reset zwischen Spielen

#### **sound.js** - Audio-System
- **Zweck**: Sound-Management
- **Funktionen**:
    - Dynamic Audio-Element-Handling
    - Mute/Unmute-Funktionalität
    - User-Interaction-basierte Autoplay
    - Sound-Event-Mapping

#### **api.js** - HTTP-Client
- **Zweck**: REST-API Kommunikation
- **Funktionen**:
    - Categories-Fetching
    - Authenticated User-Info-Requests
    - Generic API-Call Helper mit Error-Handling

#### **eventListeners.js** - Event-Koordination
- **Zweck**: Zentrales Event-Management
- **Funktionen**:
    - Form-Submission-Handler
    - Button-Click-Management
    - Keyboard-Input-Processing
    - Cross-Module-Event-Coordination

---

## 🏗️ Architektur-Highlights

### **Microservice-Architektur**
- **Auth-Server**: Isolierte Authentifizierung
- **Game-Server**: Reine Spiellogik
- **Shared Firebase**: Gemeinsame Datenschicht

### **Modular Client-Design**
- **Dependency Injection**: Modules erhalten Referenzen zu anderen Modules
- **Centralized State**: Einheitlicher Zustand über `state.js`
- **Event-Driven**: Socket.IO + DOM Events

### **Skalierbarkeit**
- **Docker-Ready**: Production-fähige Container
- **Load-Balancer**: Traefik-Integration
- **Database**: Firebase/Firestore für Cloud-Skalierung

### **Developer Experience**
- **TypeScript-ähnlich**: JSDoc-Dokumentation
- **Modular**: Klare Verantwortlichkeiten
- **Error-Handling**: Strukturierte Fehlerbehandlung
- **Debugging**: Extensive Console-Logs

Diese Architektur ermöglicht es, ein robustes, skalbierbares Multiplayer-Quiz-System zu betreiben, das sowohl authentifizierte Benutzer als auch Gäste unterstützt und eine moderne, responsive Benutzeroberfläche bietet.