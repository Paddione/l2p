/**
 * Multi-language translations for Learn2Play
 * Supports German (DE) and English (EN)
 */

// Current language setting
let currentLanguage = localStorage.getItem('language') || 'de';

// German translations (existing)
const TRANSLATIONS_DE = {
    // Main Menu
    MAIN_MENU: {
        TITLE: 'Learn2Play',
        CREATE_GAME: 'Spiel erstellen',
        JOIN_GAME: 'Spiel beitreten',
        HALL_OF_FAME: 'Ruhmeshalle',
        HELP: 'Hilfe',
        LOGOUT: 'Abmelden'
    },

    // Authentication
    AUTH: {
        WELCOME: 'Willkommen bei Learn2Play',
        USERNAME: 'Benutzername',
        PASSWORD: 'Passwort',
        SIGN_IN: 'Anmelden',
        SIGN_UP: 'Registrieren',
        SWITCH_TO_SIGNUP: 'Noch kein Konto? Registrieren',
        SWITCH_TO_SIGNIN: 'Bereits ein Konto? Anmelden',
        CHOOSE_CHARACTER: 'Wähle deinen Charakter',
        SELECT_CHARACTER: 'Charakter auswählen',
        CREATE_ACCOUNT: 'Konto erstellen',
        SIGNING_IN: 'Anmeldung läuft...',
        CREATING_ACCOUNT: 'Konto wird erstellt...'
    },

    // Loading
    LOADING: {
        TITLE: 'Lade...',
        INITIALIZING: 'Anwendung wird initialisiert...',
        STORAGE: 'Speicher wird initialisiert...',
        SCREEN_MANAGER: 'Bildschirmverwaltung wird initialisiert...',
        AUTHENTICATION: 'Authentifizierung wird initialisiert...',
        LOBBY_SYSTEM: 'Lobby-System wird initialisiert...',
        API_CLIENT: 'API-Client wird initialisiert...',
        HALL_OF_FAME: 'Ruhmeshalle wird initialisiert...',
        QUESTION_SETS: 'Fragensätze werden initialisiert...',
        AUDIO_SYSTEM: 'Audio-System wird initialisiert...',
        GAME_CONTROLLER: 'Spiel-Controller wird initialisiert...',
        EVENT_HANDLERS: 'Event-Handler werden eingerichtet...',
        INITIALIZATION_FAILED: 'Initialisierung fehlgeschlagen',
        RETRY: 'Erneut versuchen'
    },

    // Game Creation
    CREATE_GAME: {
        TITLE: 'Neues Spiel erstellen',
        GAME_NAME: 'Spielname',
        GAME_NAME_PLACEHOLDER: 'Spielname eingeben',
        MAX_PLAYERS: 'Maximale Spieleranzahl',
        QUESTION_COUNT: 'Anzahl der Fragen',
        QUESTION_TIME: 'Zeit pro Frage (Sekunden)',
        CREATE_GAME: 'Spiel erstellen',
        BACK_TO_MENU: 'Zurück zum Menü'
    },

    // Join Game
    JOIN_GAME: {
        TITLE: 'Spiel beitreten',
        ACTIVE_GAMES: 'Aktive Spiele',
        JOIN_BY_CODE: 'Mit Code beitreten',
        ENTER_CODE: 'Spielcode eingeben',
        ENTER_4_DIGIT_CODE: '4-stelligen Code eingeben',
        JOIN: 'Beitreten',
        NO_ACTIVE_GAMES: 'Keine aktiven Spiele gefunden',
        HOST: 'Gastgeber',
        PLAYERS: 'Spieler'
    },

    // Lobby
    LOBBY: {
        TITLE: 'Spiel-Lobby',
        GAME_CODE: 'Spielcode',
        QUESTION_SET: 'Fragensatz',
        NO_QUESTION_SET: 'Kein Fragensatz ausgewählt',
        SELECT_QUESTION_SET: 'Fragensatz auswählen',
        CHOOSE_QUESTION_SET: 'Wähle einen Fragensatz um das Spiel zu starten',
        READY: 'Bereit',
        NOT_READY: 'Nicht bereit',
        START_GAME: 'Spiel starten',
        LEAVE_LOBBY: 'Lobby verlassen',
        WAITING_FOR_PLAYERS: 'Warte auf Spieler...',
        WAITING_FOR_HOST: 'Warte auf Gastgeber...',
        RETURN_TO_LOBBY: 'Zurück zur Lobby',
        REJOIN_LOBBY: 'Lobby wieder beitreten',
        PLAYERS: 'Spieler (0/8)',
        QUESTION_COUNT_PLACEHOLDER: 'Anzahl der Fragen eingeben',
        SET_COUNT: 'Anzahl festlegen',
        WAITING_FOR_HOST_QUESTION_SET: 'Warte auf Gastgeber um einen Fragensatz zu wählen',
        HOST_WILL_SELECT_QUESTIONS: 'Der Gastgeber wählt die Fragen für das Spiel aus'
    },

    // Game
    GAME: {
        QUESTION: 'Frage',
        TIME_LEFT: 'Verbleibende Zeit',
        SCORE: 'Punkte',
        MULTIPLIER: 'Multiplikator',
        CORRECT: 'Richtig!',
        INCORRECT: 'Falsch!',
        TIME_UP: 'Zeit abgelaufen!',
        NEXT_QUESTION: 'Nächste Frage',
        FINAL_RESULTS: 'Endergebnisse',
        YOUR_SCORE: 'Deine Punkte',
        ACCURACY: 'Genauigkeit',
        STREAK: 'Serie',
        PLAYERS: 'Spieler'
    },

    // Results
    RESULTS: {
        TITLE: 'Spielergebnisse',
        FINAL_SCORES: 'Endpunktzahlen',
        WINNER: 'Gewinner',
        POSITION: 'Platz',
        PLAYER: 'Spieler',
        SCORE: 'Punkte',
        ACCURACY: 'Genauigkeit',
        MAX_MULTIPLIER: 'Max. Multiplikator',
        UPLOAD_TO_HALL_OF_FAME: 'In Ruhmeshalle hochladen',
        BACK_TO_MENU: 'Zurück zum Menü'
    },

    // Hall of Fame
    HALL_OF_FAME: {
        TITLE: '🏆 Ruhmeshalle',
        SELECT_CATALOG: 'Fragenkatalog auswählen',
        TOP_SCORES: 'Top-Punktzahlen',
        RANK: 'Rang',
        PLAYER: 'Spieler',
        SCORE: 'Punkte',
        ACCURACY: 'Genauigkeit',
        QUESTIONS: 'Fragen',
        DATE: 'Datum',
        NO_SCORES: 'Noch keine Punktzahlen vorhanden',
        LOADING: 'Lade Ruhmeshalle...',
        BACK_TO_MENU: 'Zurück zum Menü'
    },

    // Question Sets
    QUESTION_SETS: {
        TITLE: 'Fragensatz auswählen',
        DESCRIPTION: 'Wähle einen Fragensatz für dein Spiel oder lade einen neuen hoch.',
        UPLOAD_NEW: 'Neuen Fragensatz hochladen',
        CREATE_WITH_SET: 'Spiel mit ausgewähltem Satz erstellen',
        BACK_TO_MENU: 'Zurück zum Menü',
        LOADING: 'Lade Fragensätze...',
        NO_SETS: 'Keine Fragensätze verfügbar',
        QUESTIONS_COUNT: 'Fragen',
        SELECT: 'Auswählen',
        SELECTED: 'Ausgewählt',
        QUESTIONS_AVAILABLE: 'Fragen verfügbar',
        QUESTIONS_SELECTED: 'Fragen ausgewählt',
        QUESTION_COUNT_DESC: 'Wie viele Fragen sollen in diesem Spiel gestellt werden?',
        QUESTION_COUNT_PLACEHOLDER: 'Anzahl eingeben',
        AVAILABLE_QUESTIONS: 'verfügbaren Fragen',
        CONFIRM_DELETE: 'Sicher, dass du "{name}" löschen möchtest?'
    },

    // Question Set Modal
    QUESTION_SET_MODAL: {
        AVAILABLE_SETS: 'Verfügbare Sätze',
        UPLOAD_NEW: 'Neuen hochladen',
        MY_SETS: 'Meine Sätze',
        UPLOAD_DESCRIPTION: 'Lade eine JSON-Datei mit deinem Fragensatz hoch oder füge JSON direkt unten ein:',
        OPTION_1_TITLE: 'Option 1: JSON direkt einfügen',
        OPTION_2_TITLE: 'Option 2: JSON-Datei hochladen',
        JSON_PLACEHOLDER: 'Füge dein JSON hier ein...',
        UPLOAD_JSON_TEXT: 'JSON-Text hochladen',
        CLEAR: 'Leeren',
        FILE_UPLOAD_DESCRIPTION: 'Wähle eine JSON-Datei mit dem gleichen Format wie oben gezeigt.',
        LOADING_MY_SETS: 'Lade deine Fragensätze...',
        CANCEL: 'Abbrechen'
    },

    // Upload Questions
    UPLOAD_QUESTIONS: {
        TITLE: 'Fragensatz hochladen',
        DESCRIPTION: 'Klicke auf die Schaltfläche unten, um eine JSON-Datei mit deinem benutzerdefinierten Fragensatz auszuwählen und hochzuladen.',
        CHOOSE_FILE: 'JSON-Datei auswählen',
        UPLOAD: 'Fragensatz hochladen',
        BACK_TO_MENU: 'Zurück zum Menü',
        FILE_SELECTED: 'Datei ausgewählt',
        UPLOADING: 'Wird hochgeladen...',
        SUCCESS: 'Erfolgreich hochgeladen!',
        ERROR: 'Fehler beim Hochladen'
    },

    // Volume Controls
    VOLUME: {
        MUSIC: '🎵 Musik',
        EFFECTS: '🔊 Effekte',
        TOGGLE_MUSIC: 'Musik stumm schalten/aktivieren',
        TOGGLE_EFFECTS: 'Effekte stumm schalten/aktivieren'
    },

    // Theme Controls
    THEME: {
        LIGHT_MODE: 'Heller Modus',
        DARK_MODE: 'Dunkler Modus'
    },

    // Error Messages
    ERRORS: {
        USERNAME_EXISTS: 'Benutzername existiert bereits',
        INVALID_USERNAME: 'Benutzername muss 3-16 Zeichen lang sein und darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten',
        INVALID_PASSWORD: 'Passwort muss mindestens 6 Zeichen lang sein',
        USER_NOT_FOUND: 'Benutzer nicht gefunden',
        INVALID_PASSWORD_LOGIN: 'Ungültiges Passwort',
        NO_CHARACTER: 'Bitte wähle einen Charakter',
        LOBBY_FULL: 'Lobby ist voll',
        INVALID_LOBBY: 'Ungültiger Lobby-Code',
        NOT_ENOUGH_PLAYERS: 'Nicht genügend Spieler zum Starten',
        GAME_IN_PROGRESS: 'Spiel bereits im Gange',
        FAILED_TO_CREATE_GAME: 'Spiel konnte nicht erstellt werden',
        FAILED_TO_JOIN_GAME: 'Spiel konnte nicht beigetreten werden',
        CONNECTION_ERROR: 'Verbindungsfehler',
        NETWORK_ERROR: 'Netzwerkfehler',
        ALREADY_EXISTS: 'Ein Fragensatz mit diesem Namen existiert bereits',
        FAILED_TO_START_GAME: 'Spiel konnte nicht gestartet werden',
        FAILED_TO_SUBMIT_ANSWER: 'Antwort konnte nicht übermittelt werden',
        FAILED_TO_RETURN_TO_LOBBY: 'Rückkehr zur Lobby fehlgeschlagen',
        FAILED_TO_REJOIN_LOBBY: 'Wieder-Beitritt zur Lobby fehlgeschlagen',
        HELP_NOT_AVAILABLE: 'Hilfesystem ist nicht verfügbar',
        FAILED_TO_OPEN_HELP: 'Hilfe konnte nicht geöffnet werden',
        FAILED_TO_START_NEW_GAME: 'Neues Spiel konnte nicht gestartet werden',
        FAILED_TO_SHOW_HALL_OF_FAME: 'Ruhmeshalle konnte nicht geöffnet werden',
        QUESTION_COUNT_MIN_ONE: 'Die Anzahl der Fragen muss mindestens 1 betragen',
        NO_QUESTION_SET_SELECTED: 'Bitte wähle zunächst einen Fragensatz aus',
        SELECT_QUESTION_SET_FIRST: 'Bitte wähle zunächst einen Fragensatz aus, um die Anzahl der Fragen zu konfigurieren',
        SET_QUESTION_COUNT_FIRST: 'Lege zunächst die Anzahl der Fragen fest',
        INVALID_QUESTION_COUNT: 'Bitte gib eine gültige Fragenanzahl ein',
        PLEASE_LOGIN_FIRST: 'Bitte melde dich zuerst an',
        QUESTION_COUNT_EXCEEDS_MAX: 'Maximale Anzahl an Fragen überschritten'
    },

    // Success Messages
    SUCCESS: {
        GAME_CREATED: 'Spiel erfolgreich erstellt!',
        JOINED_GAME: 'Spiel erfolgreich beigetreten!',
        UPLOADED_QUESTIONS: 'Fragensatz erfolgreich hochgeladen!',
        SCORE_UPLOADED: 'Punktzahl erfolgreich in die Ruhmeshalle hochgeladen!'
    },

    // Help System
    HELP: {
        TITLE: '📖 Hilfe & Anleitung',
        CLOSE: 'Schließen',
        
        // Main sections
        GETTING_STARTED: 'Erste Schritte',
        GAME_MODES: 'Spielmodi',
        SCORING_SYSTEM: 'Punktesystem',
        AUDIO_FEATURES: 'Audio-Funktionen',
        HALL_OF_FAME_HELP: 'Ruhmeshalle',
        TROUBLESHOOTING: 'Fehlerbehebung',

        // Getting Started
        GETTING_STARTED_CONTENT: `
            <h4>Willkommen bei Learn2Play!</h4>
            <p>Learn2Play ist ein Echtzeit-Multiplayer-Quiz-Spiel mit Benutzerauthentifizierung, dynamischer Punktevergabe und Bestenlisten.</p>
            
            <h5>Erste Schritte:</h5>
            <ol>
                <li><strong>Registrierung:</strong> Erstelle ein Konto mit Benutzername und Passwort</li>
                <li><strong>Charakter wählen:</strong> Wähle deinen Spielcharakter aus 8 verfügbaren Optionen</li>
                <li><strong>Spiel erstellen oder beitreten:</strong> Erstelle ein neues Spiel oder tritt einem bestehenden bei</li>
                <li><strong>Fragensatz auswählen:</strong> Wähle einen Fragensatz für dein Spiel</li>
                <li><strong>Spielen:</strong> Beantworte Fragen so schnell und genau wie möglich!</li>
            </ol>
        `,

        // Game Modes
        GAME_MODES_CONTENT: `
            <h4>Spielmodi</h4>
            
            <h5>🎮 Spiel erstellen</h5>
            <ul>
                <li>Erstelle eine neue Lobby als Gastgeber</li>
                <li>Wähle Spielname, maximale Spieleranzahl (2-8)</li>
                <li>Bestimme Anzahl der Fragen (1-100) und Zeit pro Frage</li>
                <li>Wähle einen Fragensatz aus verfügbaren Katalogen</li>
                <li>Starte das Spiel, wenn alle Spieler bereit sind</li>
            </ul>
            
            <h5>🚪 Spiel beitreten</h5>
            <ul>
                <li>Tritt bestehenden Lobbys bei über die Liste aktiver Spiele</li>
                <li>Oder gib einen 4-stelligen Lobby-Code direkt ein</li>
                <li>Markiere dich als "Bereit", wenn du spielbereit bist</li>
            </ul>
            
            <h5>🔄 Nach dem Spiel</h5>
            <ul>
                <li>Lobbys bleiben nach Spielende bestehen</li>
                <li>Gastgeber können zur Lobby zurückkehren</li>
                <li>Andere Spieler können wieder beitreten für weitere Runden</li>
            </ul>
        `,

        // Scoring System
        SCORING_SYSTEM_CONTENT: `
            <h4>Erweiterte Punktevergabe</h4>
            
            <h5>📊 Grundpunkte</h5>
            <p>Jede richtige Antwort gibt Grundpunkte basierend auf der Antwortzeit:</p>
            <p><strong>Formel:</strong> (60 - verstrichene_Sekunden) × persönlicher_Multiplikator</p>
            
            <h5>🔥 Persönliche Multiplikatoren</h5>
            <p>Dein Multiplikator steigt mit aufeinanderfolgenden richtigen Antworten:</p>
            <ul>
                <li>1. richtige Antwort: 1x Multiplikator</li>
                <li>2. richtige Antwort: 2x Multiplikator</li>
                <li>3. richtige Antwort: 3x Multiplikator</li>
                <li>4. richtige Antwort: 4x Multiplikator</li>
                <li>5+ richtige Antworten: 5x Multiplikator (Maximum)</li>
            </ul>
            
            <h5>⚠️ Multiplikator-Reset</h5>
            <p>Bei einer falschen Antwort wird dein Multiplikator auf 1x zurückgesetzt.</p>
            
            <h5>🎯 Beispiel</h5>
            <p>Antwort nach 15 Sekunden mit 3x Multiplikator: (60-15) × 3 = 135 Punkte</p>
        `,

        // Audio Features
        AUDIO_FEATURES_CONTENT: `
            <h4>🎵 Umfassendes Audio-System</h4>
            
            <h5>🎛️ Lautstärkeregelung</h5>
            <ul>
                <li><strong>Musik:</strong> Hintergrundmusik mit separater Lautstärkeregelung</li>
                <li><strong>Effekte:</strong> Soundeffekte mit eigener Lautstärkeregelung</li>
                <li>Einstellungen werden automatisch gespeichert</li>
                <li>Regler befinden sich oben im Bildschirm</li>
            </ul>
            
            <h5>🔊 Soundkategorien</h5>
            <ul>
                <li><strong>Antwort-Feedback:</strong> Progressive Sounds für aufeinanderfolgende richtige Antworten</li>
                <li><strong>Spielzustand:</strong> Spielstart, Timer-Warnungen, Countdown-Ticks</li>
                <li><strong>UI-Interaktionen:</strong> Button-Klicks, Benachrichtigungen</li>
                <li><strong>Erfolge:</strong> Multiplikator-Erfolge, Zeitboni, Highscores</li>
                <li><strong>Hintergrundmusik:</strong> Entspannende Ambient-Musik</li>
            </ul>
        `,

        // Hall of Fame
        HALL_OF_FAME_HELP_CONTENT: `
            <h4>🏆 Ruhmeshalle-System</h4>
            
            <h5>📊 Bestenlisten</h5>
            <ul>
                <li>Top 10 Punktzahlen für jeden Fragensatz</li>
                <li>Medaillensystem (🥇🥈🥉) für die ersten 3 Plätze</li>
                <li>Detaillierte Statistiken: Genauigkeit, Max-Multiplikator, Fragenzahl</li>
            </ul>
            
            <h5>📤 Punktzahl hochladen</h5>
            <ul>
                <li>Ein-Klick-Upload direkt nach dem Spiel</li>
                <li>Automatische Berechnung aller Statistiken</li>
                <li>Datum und Uhrzeit werden automatisch gespeichert</li>
            </ul>
            
            <h5>🎯 Angezeigte Informationen</h5>
            <ul>
                <li>Spielcharakter und Benutzername</li>
                <li>Erreichte Punktzahl</li>
                <li>Antwortgenauigkeit in Prozent</li>
                <li>Höchster erreichter Multiplikator</li>
                <li>Anzahl der gespielten Fragen</li>
                <li>Datum der Einreichung</li>
            </ul>
        `,

        // Troubleshooting
        TROUBLESHOOTING_CONTENT: `
            <h4>🔧 Fehlerbehebung</h4>
            
            <h5>🖥️ Weißer Bildschirm</h5>
            <ul>
                <li>Browser-Cache leeren (Strg+F5 oder Inkognito-Modus)</li>
                <li>API-Status prüfen: <code>/api/health</code></li>
                <li>Entwicklertools öffnen (F12) und JavaScript-Fehler prüfen</li>
            </ul>
            
            <h5>🔌 Verbindungsprobleme</h5>
            <ul>
                <li>Internetverbindung prüfen</li>
                <li>Seite neu laden</li>
                <li>Anderen Browser versuchen</li>
            </ul>
            
            <h5>🎮 Spielprobleme</h5>
            <ul>
                <li>Lobby verlassen und erneut beitreten</li>
                <li>Sicherstellen, dass alle Spieler bereit sind</li>
                <li>Gastgeber sollte Fragensatz auswählen</li>
            </ul>
            
            <h5>🔊 Audio-Probleme</h5>
            <ul>
                <li>Lautstärkeregler oben im Bildschirm prüfen</li>
                <li>Browser-Audio-Berechtigungen prüfen</li>
                <li>Seite neu laden für Audio-Initialisierung</li>
            </ul>
        `
    },

    // Common UI Elements
    UI: {
        BACK: 'Zurück',
        NEXT: 'Weiter',
        CANCEL: 'Abbrechen',
        CONFIRM: 'Bestätigen',
        SAVE: 'Speichern',
        DELETE: 'Löschen',
        EDIT: 'Bearbeiten',
        CLOSE: 'Schließen',
        LOADING: 'Wird geladen...',
        ERROR: 'Fehler',
        SUCCESS: 'Erfolgreich',
        WARNING: 'Warnung',
        INFO: 'Information',
        BACK_TO_MENU: 'Zurück zum Menü',
        OF: 'von'
    },

    // Character Names
    CHARACTERS: {
        CAT: 'Katze',
        DOG: 'Hund',
        FROG: 'Frosch',
        FOX: 'Fuchs',
        PANDA: 'Panda',
        KOALA: 'Koala',
        LION: 'Löwe',
        TIGER: 'Tiger'
    },

    // Status Messages
    STATUS: {
        LOADING_QUESTION_SETS: 'Loading question sets...',
        NO_ACTIVE_LOBBIES: 'No active lobbies',
        FAILED_TO_LOAD_LOBBIES: 'Error loading lobbies',
        FAILED_TO_LOAD_QUESTION_SETS: 'Error loading question sets',
        NO_QUESTION_SETS_AVAILABLE: 'No question sets available',
        UPLOADING_SCORE: 'Uploading score...',
        ERROR_LOADING_QUESTION_OPTIONS: 'Error loading question options',
        NO_ACTIVE_GAMES_FOUND: 'No active games found',
        FAILED_TO_LOAD_ACTIVE_GAMES: 'Error loading active games',
        PLEASE_SELECT_QUESTION_SET: 'Please select a question set to see scores',
        LOADING_SCORES: 'Loading scores...',
        FAILED_TO_LOAD_SCORES: 'Failed to load scores. Please try again.',
        CLEARING_CACHE: '🔄 Clearing cache...',
        CACHE_CLEARED_SUCCESS: '✅ Cache cleared successfully!',
        CREATING_GAME: 'Creating game...',
        RETURNING: 'Returning...',
        REJOINING: 'Rejoining...'
    }
};

// English translations (new)
const TRANSLATIONS_EN = {
    // Main Menu
    MAIN_MENU: {
        TITLE: 'Learn2Play',
        CREATE_GAME: 'Create Game',
        JOIN_GAME: 'Join Game',
        HALL_OF_FAME: 'Hall of Fame',
        HELP: 'Help',
        LOGOUT: 'Logout'
    },

    // Authentication
    AUTH: {
        WELCOME: 'Welcome to Learn2Play',
        USERNAME: 'Username',
        PASSWORD: 'Password',
        SIGN_IN: 'Sign In',
        SIGN_UP: 'Sign Up',
        SWITCH_TO_SIGNUP: 'No account yet? Sign up',
        SWITCH_TO_SIGNIN: 'Already have an account? Sign in',
        CHOOSE_CHARACTER: 'Choose your character',
        SELECT_CHARACTER: 'Select character',
        CREATE_ACCOUNT: 'Create Account',
        SIGNING_IN: 'Signing in...',
        CREATING_ACCOUNT: 'Creating account...'
    },

    // Loading
    LOADING: {
        TITLE: 'Loading...',
        INITIALIZING: 'Initializing application...',
        STORAGE: 'Initializing storage...',
        SCREEN_MANAGER: 'Initializing screen manager...',
        AUTHENTICATION: 'Initializing authentication...',
        LOBBY_SYSTEM: 'Initializing lobby system...',
        API_CLIENT: 'Initializing API client...',
        HALL_OF_FAME: 'Initializing hall of fame...',
        QUESTION_SETS: 'Initializing question sets...',
        AUDIO_SYSTEM: 'Initializing audio system...',
        GAME_CONTROLLER: 'Initializing game controller...',
        EVENT_HANDLERS: 'Setting up event handlers...',
        INITIALIZATION_FAILED: 'Initialization failed',
        RETRY: 'Retry'
    },

    // Game Creation
    CREATE_GAME: {
        TITLE: 'Create New Game',
        GAME_NAME: 'Game Name',
        GAME_NAME_PLACEHOLDER: 'Enter game name',
        MAX_PLAYERS: 'Maximum Players',
        QUESTION_COUNT: 'Number of Questions',
        QUESTION_TIME: 'Time per Question (seconds)',
        CREATE_GAME: 'Create Game',
        BACK_TO_MENU: 'Back to Menu'
    },

    // Join Game
    JOIN_GAME: {
        TITLE: 'Join Game',
        ACTIVE_GAMES: 'Active Games',
        JOIN_BY_CODE: 'Join by Code',
        ENTER_CODE: 'Enter game code',
        ENTER_4_DIGIT_CODE: 'Enter 4-digit code',
        JOIN: 'Join',
        NO_ACTIVE_GAMES: 'No active games found',
        HOST: 'Host',
        PLAYERS: 'Players'
    },

    // Lobby
    LOBBY: {
        TITLE: 'Game Lobby',
        GAME_CODE: 'Game Code',
        QUESTION_SET: 'Question Set',
        NO_QUESTION_SET: 'No question set selected',
        SELECT_QUESTION_SET: 'Select question set',
        READY: 'Ready',
        NOT_READY: 'Not ready',
        START_GAME: 'Start Game',
        LEAVE_LOBBY: 'Leave Lobby',
        WAITING_FOR_PLAYERS: 'Waiting for players...',
        WAITING_FOR_HOST: 'Waiting for host...',
        RETURN_TO_LOBBY: 'Return to Lobby',
        REJOIN_LOBBY: 'Rejoin Lobby',
        PLAYERS: 'Players (0/8)',
        QUESTION_COUNT_PLACEHOLDER: 'Enter number of questions',
        SET_COUNT: 'Set Count',
        WAITING_FOR_HOST_QUESTION_SET: 'Waiting for host to choose a question set',
        HOST_WILL_SELECT_QUESTIONS: 'The host will select questions for the game'
    },

    // Game
    GAME: {
        QUESTION: 'Question',
        TIME_LEFT: 'Time Left',
        SCORE: 'Score',
        MULTIPLIER: 'Multiplier',
        CORRECT: 'Correct!',
        INCORRECT: 'Incorrect!',
        TIME_UP: 'Time up!',
        NEXT_QUESTION: 'Next Question',
        FINAL_RESULTS: 'Final Results',
        YOUR_SCORE: 'Your Score',
        ACCURACY: 'Accuracy',
        STREAK: 'Streak',
        PLAYERS: 'Players'
    },

    // Results
    RESULTS: {
        TITLE: 'Game Results',
        FINAL_SCORES: 'Final Scores',
        WINNER: 'Winner',
        POSITION: 'Position',
        PLAYER: 'Player',
        SCORE: 'Score',
        ACCURACY: 'Accuracy',
        MAX_MULTIPLIER: 'Max. Multiplier',
        UPLOAD_TO_HALL_OF_FAME: 'Upload to Hall of Fame',
        BACK_TO_MENU: 'Back to Menu'
    },

    // Hall of Fame
    HALL_OF_FAME: {
        TITLE: '🏆 Hall of Fame',
        SELECT_CATALOG: 'Select Question Catalog',
        TOP_SCORES: 'Top Scores',
        RANK: 'Rank',
        PLAYER: 'Player',
        SCORE: 'Score',
        ACCURACY: 'Accuracy',
        QUESTIONS: 'Questions',
        DATE: 'Date',
        NO_SCORES: 'No scores yet',
        LOADING: 'Loading Hall of Fame...',
        BACK_TO_MENU: 'Back to Menu'
    },

    // Question Sets
    QUESTION_SETS: {
        TITLE: 'Select Question Set',
        DESCRIPTION: 'Choose a question set for your game or upload a new one.',
        UPLOAD_NEW: 'Upload New Question Set',
        CREATE_WITH_SET: 'Create Game with Selected Set',
        BACK_TO_MENU: 'Back to Menu',
        LOADING: 'Loading question sets...',
        NO_SETS: 'No question sets available',
        QUESTIONS_COUNT: 'Questions',
        SELECT: 'Select',
        SELECTED: 'Selected',
        QUESTIONS_AVAILABLE: 'questions available',
        QUESTIONS_SELECTED: 'questions selected',
        QUESTION_COUNT_DESC: 'How many questions should be asked in this game?',
        QUESTION_COUNT_PLACEHOLDER: 'Enter number',
        AVAILABLE_QUESTIONS: 'available questions',
        CONFIRM_DELETE: 'Are you sure you want to delete "{name}"?'
    },

    // Question Set Modal
    QUESTION_SET_MODAL: {
        AVAILABLE_SETS: 'Available Sets',
        UPLOAD_NEW: 'Upload New',
        MY_SETS: 'My Sets',
        UPLOAD_DESCRIPTION: 'Upload a JSON file containing your question set or paste JSON directly below:',
        OPTION_1_TITLE: 'Option 1: Paste JSON directly',
        OPTION_2_TITLE: 'Option 2: Upload JSON file',
        JSON_PLACEHOLDER: 'Paste your JSON here...',
        UPLOAD_JSON_TEXT: 'Upload JSON Text',
        CLEAR: 'Clear',
        FILE_UPLOAD_DESCRIPTION: 'Select a JSON file with the same format as shown above.',
        LOADING_MY_SETS: 'Loading your question sets...',
        CANCEL: 'Cancel'
    },

    // Upload Questions
    UPLOAD_QUESTIONS: {
        TITLE: 'Upload Question Set',
        DESCRIPTION: 'Click the button below to select and upload a JSON file with your custom question set.',
        CHOOSE_FILE: 'Choose JSON File',
        UPLOAD: 'Upload Question Set',
        BACK_TO_MENU: 'Back to Menu',
        FILE_SELECTED: 'File Selected',
        UPLOADING: 'Uploading...',
        SUCCESS: 'Successfully uploaded!',
        ERROR: 'Upload error'
    },

    // Volume Controls
    VOLUME: {
        MUSIC: '🎵 Music',
        EFFECTS: '🔊 Effects',
        TOGGLE_MUSIC: 'Toggle Music Mute',
        TOGGLE_EFFECTS: 'Toggle Sound Effects Mute'
    },

    // Theme Controls
    THEME: {
        LIGHT_MODE: 'Light Mode',
        DARK_MODE: 'Dark Mode'
    },

    // Language Controls
    LANGUAGE: {
        SWITCH_TO_ENGLISH: 'Switch to English',
        SWITCH_TO_GERMAN: 'Auf Deutsch wechseln'
    },

    // Error Messages
    ERRORS: {
        USERNAME_EXISTS: 'Username already exists',
        INVALID_USERNAME: 'Username must be 3-16 characters long and can only contain letters, numbers, underscores, and hyphens',
        INVALID_PASSWORD: 'Password must be at least 6 characters long',
        USER_NOT_FOUND: 'User not found',
        INVALID_PASSWORD_LOGIN: 'Invalid password',
        NO_CHARACTER: 'Please choose a character',
        LOBBY_FULL: 'Lobby is full',
        INVALID_LOBBY: 'Invalid lobby code',
        NOT_ENOUGH_PLAYERS: 'Not enough players to start',
        GAME_IN_PROGRESS: 'Game already in progress',
        FAILED_TO_CREATE_GAME: 'Game could not be created',
        FAILED_TO_JOIN_GAME: 'Game could not be joined',
        CONNECTION_ERROR: 'Connection error',
        NETWORK_ERROR: 'Network error',
        ALREADY_EXISTS: 'A question set with this name already exists',
        FAILED_TO_START_GAME: 'Game could not be started',
        FAILED_TO_SUBMIT_ANSWER: 'Answer could not be submitted',
        FAILED_TO_RETURN_TO_LOBBY: 'Return to lobby failed',
        FAILED_TO_REJOIN_LOBBY: 'Rejoin lobby failed',
        HELP_NOT_AVAILABLE: 'Help system not available',
        FAILED_TO_OPEN_HELP: 'Help could not be opened',
        FAILED_TO_START_NEW_GAME: 'New game could not be started',
        FAILED_TO_SHOW_HALL_OF_FAME: 'Hall of Fame could not be opened',
        QUESTION_COUNT_MIN_ONE: 'Question count must be at least 1',
        NO_QUESTION_SET_SELECTED: 'Please select a question set first',
        SELECT_QUESTION_SET_FIRST: 'Please select a question set first to configure the number of questions',
        SET_QUESTION_COUNT_FIRST: 'Please set the question count first',
        INVALID_QUESTION_COUNT: 'Please enter a valid question count',
        PLEASE_LOGIN_FIRST: 'Please log in first',
        QUESTION_COUNT_EXCEEDS_MAX: 'Maximum number of questions exceeded'
    },

    // Success Messages
    SUCCESS: {
        GAME_CREATED: 'Game created successfully!',
        JOINED_GAME: 'Game joined successfully!',
        UPLOADED_QUESTIONS: 'Question set uploaded successfully!',
        SCORE_UPLOADED: 'Score uploaded to Hall of Fame successfully!'
    },

    // Help System
    HELP: {
        TITLE: '📖 Help & Guide',
        CLOSE: 'Close',
        
        // Main sections
        GETTING_STARTED: 'First Steps',
        GAME_MODES: 'Game Modes',
        SCORING_SYSTEM: 'Scoring System',
        AUDIO_FEATURES: 'Audio Features',
        HALL_OF_FAME_HELP: 'Hall of Fame',
        TROUBLESHOOTING: 'Troubleshooting',

        // Getting Started
        GETTING_STARTED_CONTENT: `
            <h4>Welcome to Learn2Play!</h4>
            <p>Learn2Play is a real-time multiplayer quiz game with user authentication, dynamic scoring, and leaderboards.</p>
            
            <h5>First Steps:</h5>
            <ol>
                <li><strong>Registration:</strong> Create an account with username and password</li>
                <li><strong>Choose Character:</strong> Choose your game character from 8 available options</li>
                <li><strong>Create or Join Game:</strong> Create a new game or join an existing one</li>
                <li><strong>Select Question Set:</strong> Choose a question set for your game</li>
                <li><strong>Play:</strong> Answer questions as quickly and accurately as possible!</li>
            </ol>
        `,

        // Game Modes
        GAME_MODES_CONTENT: `
            <h4>Game Modes</h4>
            
            <h5>🎮 Create Game</h5>
            <ul>
                <li>Create a new lobby as host</li>
                <li>Choose game name, maximum player count (2-8)</li>
                <li>Determine number of questions (1-100) and time per question</li>
                <li>Choose a question set from available catalogs</li>
                <li>Start the game when all players are ready</li>
            </ul>
            
            <h5>🚪 Join Game</h5>
            <ul>
                <li>Join existing lobbies via the list of active games</li>
                <li>Or enter a 4-digit lobby code directly</li>
                <li>Mark yourself as "Ready" when you're ready to play</li>
            </ul>
            
            <h5>🔄 After the Game</h5>
            <ul>
                <li>Lobbies remain after game end</li>
                <li>Hosts can return to lobby</li>
                <li>Other players can rejoin for further rounds</li>
            </ul>
        `,

        // Scoring System
        SCORING_SYSTEM_CONTENT: `
            <h4>Advanced Scoring</h4>
            
            <h5>📊 Base Points</h5>
            <p>Each correct answer gives base points based on answer time:</p>
            <p><strong>Formula:</strong> (60 - elapsed_seconds) × personal_multiplier</p>
            
            <h5>🔥 Personal Multipliers</h5>
            <p>Your multiplier increases with consecutive correct answers:</p>
            <ul>
                <li>1. correct answer: 1x multiplier</li>
                <li>2. correct answer: 2x multiplier</li>
                <li>3. correct answer: 3x multiplier</li>
                <li>4. correct answer: 4x multiplier</li>
                <li>5+ correct answers: 5x multiplier (Maximum)</li>
            </ul>
            
            <h5>⚠️ Multiplier Reset</h5>
            <p>A wrong answer resets your multiplier to 1x.</p>
            
            <h5>🎯 Example</h5>
            <p>Answer after 15 seconds with 3x multiplier: (60-15) × 3 = 135 points</p>
        `,

        // Audio Features
        AUDIO_FEATURES_CONTENT: `
            <h4>🎵 Comprehensive Audio System</h4>
            
            <h5>🎛️ Volume Control</h5>
            <ul>
                <li><strong>Music:</strong> Background music with separate volume control</li>
                <li><strong>Effects:</strong> Sound effects with separate volume control</li>
                <li>Settings are automatically saved</li>
                <li>Controls are located at the top of the screen</li>
            </ul>
            
            <h5>🔊 Sound Categories</h5>
            <ul>
                <li><strong>Answer Feedback:</strong> Progressive sounds for consecutive correct answers</li>
                <li><strong>Game State:</strong> Game start, timer warnings, countdown ticks</li>
                <li><strong>UI Interactions:</strong> Button clicks, notifications</li>
                <li><strong>Achievements:</strong> Multiplier achievements, time bonuses, high scores</li>
                <li><strong>Background Music:</strong> Relaxing Ambient Music</li>
            </ul>
        `,

        // Hall of Fame
        HALL_OF_FAME_HELP_CONTENT: `
            <h4>🏆 Hall of Fame System</h4>
            
            <h5>📊 Leaderboards</h5>
            <ul>
                <li>Top 10 scores for each question set</li>
                <li>Medal system (🥇🥈🥉) for the top 3 places</li>
                <li>Detailed statistics: Accuracy, Max-Multiplier, Question Count</li>
            </ul>
            
            <h5>📤 Score Upload</h5>
            <ul>
                <li>One-click upload directly after the game</li>
                <li>Automatic calculation of all statistics</li>
                <li>Date and time are automatically saved</li>
            </ul>
            
            <h5>🎯 Displayed Information</h5>
            <ul>
                <li>Game character and username</li>
                <li>Achieved score</li>
                <li>Answer accuracy in percentage</li>
                <li>Highest achieved multiplier</li>
                <li>Number of questions played</li>
                <li>Date of submission</li>
            </ul>
        `,

        // Troubleshooting
        TROUBLESHOOTING_CONTENT: `
            <h4>🔧 Troubleshooting</h4>
            
            <h5>🖥️ White Screen</h5>
            <ul>
                <li>Clear browser cache (Ctrl+F5 or Incognito mode)</li>
                <li>Check API status: <code>/api/health</code></li>
                <li>Open developer tools (F12) and check JavaScript errors</li>
            </ul>
            
            <h5>🔌 Connection Issues</h5>
            <ul>
                <li>Check internet connection</li>
                <li>Reload the page</li>
                <li>Try another browser</li>
            </ul>
            
            <h5>🎮 Game Issues</h5>
            <ul>
                <li>Leave lobby and rejoin</li>
                <li>Ensure all players are ready</li>
                <li>Host should select question set</li>
            </ul>
            
            <h5>🔊 Audio Issues</h5>
            <ul>
                <li>Check volume controls at the top of the screen</li>
                <li>Check browser audio permissions</li>
                <li>Reload the page for audio initialization</li>
            </ul>
        `
    },

    // Common UI Elements
    UI: {
        BACK: 'Back',
        NEXT: 'Next',
        CANCEL: 'Cancel',
        CONFIRM: 'Confirm',
        SAVE: 'Save',
        DELETE: 'Delete',
        EDIT: 'Edit',
        CLOSE: 'Close',
        LOADING: 'Loading...',
        ERROR: 'Error',
        SUCCESS: 'Success',
        WARNING: 'Warning',
        INFO: 'Info',
        BACK_TO_MENU: 'Back to Menu',
        OF: 'of'
    },

    // Character Names
    CHARACTERS: {
        CAT: 'Cat',
        DOG: 'Dog',
        FROG: 'Frog',
        FOX: 'Fox',
        PANDA: 'Panda',
        KOALA: 'Koala',
        LION: 'Lion',
        TIGER: 'Tiger'
    },

    // Status Messages
    STATUS: {
        LOADING_QUESTION_SETS: 'Loading question sets...',
        NO_ACTIVE_LOBBIES: 'No active lobbies',
        FAILED_TO_LOAD_LOBBIES: 'Error loading lobbies',
        FAILED_TO_LOAD_QUESTION_SETS: 'Error loading question sets',
        NO_QUESTION_SETS_AVAILABLE: 'No question sets available',
        UPLOADING_SCORE: 'Uploading score...',
        ERROR_LOADING_QUESTION_OPTIONS: 'Error loading question options',
        NO_ACTIVE_GAMES_FOUND: 'No active games found',
        FAILED_TO_LOAD_ACTIVE_GAMES: 'Error loading active games',
        PLEASE_SELECT_QUESTION_SET: 'Please select a question set to see scores',
        LOADING_SCORES: 'Loading scores...',
        FAILED_TO_LOAD_SCORES: 'Failed to load scores. Please try again.',
        CLEARING_CACHE: '🔄 Clearing cache...',
        CACHE_CLEARED_SUCCESS: '✅ Cache cleared successfully!',
        CREATING_GAME: 'Creating game...',
        RETURNING: 'Returning...',
        REJOINING: 'Rejoining...'
    }
};

// Get current translations based on selected language
const getCurrentTranslations = () => {
    return currentLanguage === 'en' ? TRANSLATIONS_EN : TRANSLATIONS_DE;
};

// Legacy export for backward compatibility
export const TRANSLATIONS = getCurrentTranslations();

/**
 * Set the current language and update localStorage
 * @param {string} language - Language code ('en' or 'de')
 */
export function setLanguage(language) {
    if (language === 'en' || language === 'de') {
        currentLanguage = language;
        localStorage.setItem('language', language);
        
        // Trigger a custom event to notify components about language change
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
    }
}

/**
 * Get the current language
 * @returns {string} Current language code ('en' or 'de')
 */
export function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Get translated text by key path
 * @param {string} keyPath - Dot-separated path to translation key (e.g., 'MAIN_MENU.TITLE')
 * @param {string} fallback - Fallback text if translation not found
 * @returns {string} Translated text or fallback
 */
export function t(keyPath, fallback = keyPath) {
    const translations = getCurrentTranslations();
    const keys = keyPath.split('.');
    let current = translations;
    
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return fallback;
        }
    }
    
    return typeof current === 'string' ? current : fallback;
}

/**
 * Get all translations for a section
 * @param {string} section - Section name (e.g., 'MAIN_MENU')
 * @returns {Object} Section translations or empty object
 */
export function getSection(section) {
    const translations = getCurrentTranslations();
    return translations[section] || {};
}

// Additional raw string translations for notification/toast messages that are still hard-coded in English
const RAW_TRANSLATIONS_DE = {
    'Please select a JSON file': 'Bitte wähle eine JSON-Datei aus',
    'File too large. Maximum size is 5MB.': 'Datei zu groß. Maximale Größe ist 5MB.',
    'Please select a file first': 'Bitte wähle zuerst eine Datei aus',
    'Failed to load question sets': 'Fragensätze konnten nicht geladen werden',
    'Failed to load question sets. Please try again.': 'Fragensätze konnten nicht geladen werden. Bitte versuche es erneut.',
    'Please select a question set first': 'Bitte wähle zunächst einen Fragensatz aus',
    'Please enter a valid question count': 'Bitte gib eine gültige Anzahl an Fragen ein',
    'Please log in first': 'Bitte melde dich zuerst an',
    'Game created successfully!': 'Spiel erfolgreich erstellt!',
    'Returned to lobby successfully!': 'Erfolgreich zur Lobby zurückgekehrt!',
    'Rejoined lobby successfully!': 'Lobby erfolgreich wieder beigetreten!',
    'Failed to initialize lobby. Please try again.': 'Lobby konnte nicht initialisiert werden. Bitte versuche es erneut.',
    'Only the host can set question count': 'Nur der Host kann die Fragenanzahl festlegen',
    'Only the host can select question sets': 'Nur der Host kann Fragensätze auswählen',
    'Please enter a valid number': 'Bitte gib eine gültige Zahl ein',
    'Number of questions must be at least 1': 'Die Anzahl der Fragen muss mindestens 1 betragen',
    'Joined lobby successfully!': 'Erfolgreich der Lobby beigetreten!',
    'Left lobby': 'Lobby verlassen',
    'Failed to leave lobby': 'Lobby konnte nicht verlassen werden',
    'The lobby has been closed': 'Die Lobby wurde geschlossen',
    'Game is starting!': 'Das Spiel startet!',
    'Question set uploaded successfully!': 'Fragensatz erfolgreich hochgeladen!',
    'Question set deleted successfully': 'Fragensatz erfolgreich gelöscht',
    'Failed to load scores. Please try again.': 'Punktzahlen konnten nicht geladen werden. Bitte versuche es erneut.',
    'Failed to load lobbies': 'Lobbys konnten nicht geladen werden',
    'Failed to load your question sets': 'Deine Fragensätze konnten nicht geladen werden',
    'No active lobby found': 'Keine aktive Lobby gefunden'
};

// English raw translations (for completeness, though most are already in English)
const RAW_TRANSLATIONS_EN = {
    'Please select a JSON file': 'Please select a JSON file',
    'File too large. Maximum size is 5MB.': 'File too large. Maximum size is 5MB.',
    'Please select a file first': 'Please select a file first',
    'Failed to load question sets': 'Failed to load question sets',
    'Failed to load question sets. Please try again.': 'Failed to load question sets. Please try again.',
    'Please select a question set first': 'Please select a question set first',
    'Please enter a valid question count': 'Please enter a valid question count',
    'Please log in first': 'Please log in first',
    'Game created successfully!': 'Game created successfully!',
    'Returned to lobby successfully!': 'Returned to lobby successfully!',
    'Rejoined lobby successfully!': 'Rejoined lobby successfully!',
    'Failed to initialize lobby. Please try again.': 'Failed to initialize lobby. Please try again.',
    'Only the host can set question count': 'Only the host can set question count',
    'Please enter a valid number': 'Please enter a valid number',
    'Number of questions must be at least 1': 'Number of questions must be at least 1',
    'Joined lobby successfully!': 'Joined lobby successfully!',
    'Left lobby': 'Left lobby',
    'Failed to leave lobby': 'Failed to leave lobby',
    'The lobby has been closed': 'The lobby has been closed',
    'Game is starting!': 'Game is starting!',
    'Question set uploaded successfully!': 'Question set uploaded successfully!',
    'Question set deleted successfully': 'Question set deleted successfully',
    'Failed to load scores. Please try again.': 'Failed to load scores. Please try again.',
    'Failed to load lobbies': 'Failed to load lobbies',
    'Failed to load your question sets': 'Failed to load your question sets',
    'No active lobby found': 'No active lobby found'
};

/**
 * Fallback translation for raw text messages (mainly notifications).
 * It first checks the RAW_TRANSLATIONS map for an exact match and then tries to
 * match common dynamic patterns (numbers, quoted names, etc.). If nothing
 * matches it returns the original text.
 * @param {string} text - Raw message
 * @returns {string} - Translated text or original text
 */
export function translateRaw(text) {
    const rawTranslations = currentLanguage === 'en' ? RAW_TRANSLATIONS_EN : RAW_TRANSLATIONS_DE;
    if (rawTranslations[text]) return rawTranslations[text];

    // Dynamic pattern: "Maximum X questions available in this set"
    const maxMatch = text.match(/Maximum\s+(\d+)\s+questions available in this set/);
    if (maxMatch) {
        return currentLanguage === 'en' 
            ? `Maximum ${maxMatch[1]} questions available in this set`
            : `Maximal ${maxMatch[1]} Fragen in diesem Satz verfügbar`;
    }

    // Dynamic pattern: "Question count set to X"
    const qcMatch = text.match(/Question count set to\s+(\d+)/);
    if (qcMatch) {
        return currentLanguage === 'en'
            ? `Question count set to ${qcMatch[1]}`
            : `Fragenanzahl auf ${qcMatch[1]} gesetzt`;
    }

    // Dynamic pattern: "Question set changed to \"NAME\""
    const qsChanged = text.match(/Question set changed to \"(.+)\"/);
    if (qsChanged) {
        return currentLanguage === 'en'
            ? `Question set changed to "${qsChanged[1]}"`
            : `Fragensatz geändert zu "${qsChanged[1]}"`;
    }

    // Dynamic pattern: "Lobby CODE created successfully!"
    const lobbyCreated = text.match(/Lobby\s+(\w+)\s+created successfully!/);
    if (lobbyCreated) {
        return currentLanguage === 'en'
            ? `Lobby ${lobbyCreated[1]} created successfully!`
            : `Lobby ${lobbyCreated[1]} erfolgreich erstellt!`;
    }

    // Dynamic pattern: "Question set \"NAME\" uploaded successfully!"
    const qsUploaded = text.match(/Question set \"(.+)\" uploaded successfully!/);
    if (qsUploaded) {
        return currentLanguage === 'en'
            ? `Question set "${qsUploaded[1]}" uploaded successfully!`
            : `Fragensatz "${qsUploaded[1]}" erfolgreich hochgeladen!`;
    }

    // Dynamic pattern: "Failed to select question set: ERROR"
    const qsSelectFailed = text.match(/Failed to select question set: (.+)/);
    if (qsSelectFailed) {
        return currentLanguage === 'en'
            ? `Failed to select question set: ${qsSelectFailed[1]}`
            : `Fragensatz konnte nicht ausgewählt werden: ${qsSelectFailed[1]}`;
    }

    // Fallback: return original text if no translation found
    return text;
}