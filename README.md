# Quiz Meister - Project Reference Guide

## 🎯 Project Overview
**Quiz Meister** is a multiplayer quiz game with real-time gameplay, user authentication, and leaderboards. The application is containerized with Docker and uses Traefik as a reverse proxy.

**Repository**: https://github.com/Paddione/l2p  
**Production URL**: https://game.korczewski.de  
**Local Development**: http://10.0.0.44

## 🎮 Game Features

### 🕹️ Real-Time Multiplayer
- **Synchronized Game Sessions**: All players start games simultaneously via server coordination
- **Real-Time Question Progression**: Questions automatically advance when all players answer or time runs out
- **Live Player Status**: Real-time display of answer progress and player readiness
- **Adaptive Polling**: Optimized synchronization system (2s intervals) for responsive multiplayer gameplay

### 🎯 Advanced Scoring System
- **Time-Based Points**: Dynamic scoring with 60 base points minus time elapsed
- **Personal Multipliers**: Individual multiplier stacks (1x → 2x → 3x → 4x → 5x) for consecutive correct answers
- **Smart Reset**: Multipliers reset to 1x on wrong answers
- **Final Calculation**: `(60 - seconds_elapsed) × personal_multiplier`

### 🎵 Comprehensive Audio System
The game includes 33+ sound effects for immersive gameplay with **integrated volume controls**:

**Volume Controls**:
- **Fixed Header Controls**: Music and sound effects volume sliders at the top of the screen
- **Independent Volume**: Separate controls for background music (🎵) and sound effects (🔊)
- **Persistent Settings**: Volume preferences saved to localStorage and restored on reload
- **Real-time Adjustment**: Instant volume changes with visual percentage feedback
- **Optimized Defaults**: Music at 30%, sound effects at 13% (25% of previous level) for balanced audio

**Answer Feedback** (Essential):
- `correct1.mp3` through `correct5.mp3` - Progressive sounds based on consecutive answer streak (fixed variable scoping issue)
- `wrong.mp3` - Wrong answer feedback
- `combobreaker.mp3` - Multiplier stack loss sound (when losing 2x+ multipliers, fixed logic to check original multiplier)

**Game State Audio**:
- `game-start.mp3` - Game initialization
- `timer-warning.mp3` - 10 seconds remaining
- `timer-urgent.mp3` - 5 seconds remaining  
- `countdown-tick.mp3` - Final 3-second countdown
- `round-end.mp3` - Question round completion
- `applause.mp3` - Winner celebration

**UI Interactions**:
- `button-click.mp3` - Button press feedback (auto-applied to all buttons)
- `notification.mp3`, `success-chime.mp3`, `error-alert.mp3` - User feedback

**Achievement Sounds**:
- `multiplier-max.mp3` - 5-streak achievement
- `time-bonus.mp3` - Fast answer bonus (< 2 seconds)
- `perfect-score.mp3`, `high-score.mp3` - Performance achievements

**Background Music**:
- `background-music.mp3` - Looping ambient music (starts after first user interaction)

### 🏆 Hall of Fame System
- **Leaderboard**: Global and catalog-specific rankings
- **Score Upload**: One-click score submission after games with comprehensive statistics
- **Enhanced Score Screen**: Beautiful results display with immediate Hall of Fame upload option
- **Player Statistics**: Accuracy tracking, max multipliers, and performance analytics
- **Data Validation**: Proper limit/offset validation for large data requests
- **Navigation Controls**: Play Again and Back to Menu options from results screen

### 🎨 Enhanced UI/UX
- **Visual Answer Feedback**: Animated correct (green flash/glow) and incorrect (red flash/shake) responses
- **Smart Answer Display**: Responsive text scaling and proper word wrapping for long answers
- **Correct Answer Highlighting**: Shows correct answer when player selects wrong option
- **Score Animations**: Scaling animations with color transitions for score updates
- **Enhanced Results Screen**: Comprehensive final score display with ranked player list and winner highlighting
- **Hall of Fame Integration**: Seamless score upload directly from results screen with real-time feedback
- **Loading States**: Comprehensive loading screens with progress indicators

---

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with pg-cron extension
- **Reverse Proxy**: Traefik v3.0
- **Containerization**: Docker & Docker Compose
- **SSL/TLS**: Let's Encrypt via Traefik

### Service Architecture
```
[Traefik] → [quiz-app:8080] (Frontend)
         → [quiz-api:3000] (Backend API)
         → [postgres:5432] (Database)
```

### Frontend-Backend Communication
The frontend communicates with the backend through a centralized API client (`public/js/api/apiClient.js`) that handles:
- **Authentication**: JWT token management and automatic inclusion in requests
- **Error Handling**: Comprehensive error handling with retry logic and exponential backoff
- **Request Timeout**: 30-second timeout with automatic retry for network failures
- **Rate Limiting**: Built-in 429 error handling with smart backoff strategies
- **CORS**: Configured for both development and production environments

**API Base URL Configuration**:
- **Development**: `http://localhost:3000/api` (when hostname is localhost)
- **Production**: `${window.location.protocol}//${window.location.host}/api`

---

## 📁 Project Structure

### Root Directory
```
/
├── README.md                 # This reference guide
├── package.json             # Root package.json (minimal configuration)
├── docker-compose.yml       # Multi-service container orchestration
├── rebuild.sh              # Quick rebuild script
├── env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── .cursorignore           # Cursor IDE ignore rules
├── .dockerignore           # Docker build context exclusions
├── backend/                # Backend API service
├── public/                 # Frontend application
├── docker/                 # Docker build files
├── scripts/                # Setup and utility scripts
│   └── setup-env.sh       # Environment setup script
├── traefik_config/         # Traefik reverse proxy configuration
├── letsencrypt/            # SSL certificates (auto-generated)
└── node_modules/           # Root dependencies
```

### Backend Structure (`/backend/`)
```
backend/
├── package.json            # Backend dependencies & scripts
├── server.js              # Main Express server entry point
├── healthcheck.js         # Docker health check script
├── routes/                # API route handlers
│   ├── auth.js           # Authentication endpoints
│   ├── lobby.js          # Game lobby management
│   ├── questionSets.js   # Quiz question management
│   └── hallOfFame.js     # Leaderboard functionality
├── models/               # Data models
│   ├── User.js           # User data model
│   ├── QuestionSet.js    # Question set model
│   └── HallOfFameEntry.js # Leaderboard entry model
├── middleware/           # Express middleware
│   ├── auth.js          # JWT authentication middleware
│   └── validation.js    # Request validation middleware
├── database/            # Database configuration & schemas
│   ├── connection.js    # PostgreSQL connection pool
│   ├── init.js         # Database initialization & migration
│   ├── reset.js        # Database reset functionality
│   ├── schema.sql      # Core database schema (users, hall_of_fame)
│   ├── lobby.sql       # Lobby-related schema
│   └── questionsets.sql # Question set schema
├── scripts/             # Database management scripts
│   └── db-manager.js   # Database management CLI tool
└── node_modules/       # Backend dependencies
```

### Frontend Structure (`/public/`)
```
public/
├── index.html             # Main HTML entry point
├── clear-cache.html       # Cache clearing utility page
├── package.json          # Frontend dependencies & scripts
├── server.js             # Simple Express server for serving static files
├── css/                  # Stylesheets
│   ├── main.css         # Base styles & variables
│   ├── components.css   # UI component styles
│   ├── animations.css   # Animation definitions
│   └── game.css         # Game-specific styles
├── js/                   # JavaScript modules
│   ├── app.js           # Main application entry point
│   ├── api/             # API communication modules
│   │   ├── apiClient.js # Centralized API client with retry logic
│   │   └── questionSetsApi.js # Question sets specific API calls
│   ├── auth/            # Authentication logic
│   ├── game/            # Game mechanics & logic
│   │   ├── gameController.js # Game UI controller
│   │   ├── gameEngine.js # Core game logic & synchronization
│   │   ├── scoreSystem.js # Scoring logic & Hall of Fame integration
│   │   ├── timer.js     # Game timer management
│   │   └── questionManager.js # Question handling
│   ├── lobby/           # Lobby management
│   ├── ui/              # UI components & interactions
│   │   └── volumeControls.js # Volume control sliders and audio integration
│   ├── utils/           # Utility functions & constants
│   ├── data/            # Data management
│   └── audio/           # Audio handling
├── assets/              # Static assets
│   ├── images/          # Image files
│   └── audio/           # Audio files (33+ MP3 sound effects)
└── node_modules/        # Frontend dependencies
```

### Docker Configuration (`/docker/`)
```
docker/
├── Dockerfile.backend   # Optimized multi-stage backend API container
├── Dockerfile.frontend  # Optimized multi-stage frontend container
└── Dockerfile.postgres  # Optimized PostgreSQL container with pg_cron extension
```

### Traefik Configuration (`/traefik_config/`)
```
traefik_config/
├── traefik.yml         # Main Traefik configuration
└── dynamic/
    └── dynamic_conf.yml # Dynamic configuration (middlewares, TLS)
```

---

## 🔧 Key Components & Interactions

### 1. Authentication System
**Location**: `backend/routes/auth.js`, `backend/middleware/auth.js`, `public/js/auth/`

**Backend Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/verify` - Verify token validity

**Frontend Integration**:
- JWT tokens stored in localStorage with automatic expiration handling
- Automatic token inclusion in API requests via Authorization header
- Token refresh handling for expired sessions with graceful logout on failure
- Centralized authentication state management

### 2. Game Lobby System
**Location**: `backend/routes/lobby.js`, `public/js/lobby/`

**Backend Endpoints**:
- `POST /api/lobbies/create` - Create new lobby
- `GET /api/lobbies/list` - Get all active lobbies with automatic cleanup
- `GET /api/lobbies/:code` - Get specific lobby details
- `PUT /api/lobbies/:code` - Update lobby settings
- `DELETE /api/lobbies/:code` - Delete lobby
- `POST /api/lobbies/:code/join` - Join lobby
- `POST /api/lobbies/:code/leave` - Leave lobby with proper host transfer
- `POST /api/lobbies/:code/ready` - Mark player as ready
- `POST /api/lobbies/:code/question-set` - Set question set for lobby
- `POST /api/lobbies/:code/start` - Start game
- `POST /api/lobbies/:code/answer` - Submit answer
- `GET /api/lobbies/:code/debug` - Debug endpoint for lobby state inspection
- `GET /api/lobbies/cleanup` - Manual lobby cleanup

**Enhanced Lobby Data Handling**:
- **Improved Question Parsing**: Better JSON parsing with error handling for question data
- **Current Question Access**: Direct access to current question in lobby response
- **Debug Information**: Comprehensive debug data including question count, game phase, and current question status
- **Error Recovery**: Robust error handling for malformed question data

**Frontend Integration**:
- Real-time updates via optimized polling (2s intervals)
- Lobby state management with automatic refresh
- Player management and ready state tracking
- Question set selection within lobby context

### 3. Quiz Game Engine
**Location**: `public/js/game/`, `backend/routes/questionSets.js`

**Game Flow**:
1. Host creates lobby and selects question set
2. Players join and mark ready
3. Synchronized game start for all players
4. Server-managed question timing and progression
5. Real-time answer submission and scoring
6. Automatic Hall of Fame score upload

**Scoring Algorithm**:
```javascript
const basePoints = 60;
const timeElapsed = 60 - timeRemaining;
const finalScore = (basePoints - timeElapsed) * personalMultiplier;
```

**Multiplier System**:
- Starts at 1x for all players
- Increases by 1 for each consecutive correct answer (max 5x)
- Resets to 1x on wrong answers
- Tracked individually per player

### 4. Hall of Fame System
**Location**: `backend/routes/hallOfFame.js`, `public/js/data/`

**Backend Endpoints**:
- `GET /api/hall-of-fame` - Get hall of fame entries (with catalog filtering and large limit support)
- `POST /api/hall-of-fame` - Add new hall of fame entry
- `GET /api/hall-of-fame/stats/:catalog` - Get catalog statistics
- `GET /api/hall-of-fame/leaderboard/:catalog` - Get catalog leaderboard
- `GET /api/hall-of-fame/my-entries` - Get current user's entries

**Features**:
- **One-Click Upload**: Direct upload from final scoreboard with comprehensive game data
- **Statistics Calculation**: Real-time calculation of catalog stats (total plays, average score, etc.)
- **Proper Validation**: Enhanced limit/offset validation supporting requests up to 10,000 entries
- **Data Tracking**: Accurate tracking of correct answers, accuracy, max multiplier during gameplay

### 5. Audio System
**Location**: `public/js/audio/audioManager.js`

**Features**:
- **Singleton Pattern**: Global audio manager prevents multiple instances and duplicate sounds
- **Browser Compatibility**: Proper handling of autoplay policies with user interaction detection
- **Progressive Sounds**: Streak-based correct answer sounds (correct1 → correct2 → correct3 → etc.)
- **Smart Feedback**: Differentiated sounds for combo breakers vs regular wrong answers
- **Automatic UI Integration**: Button click sounds automatically applied to all buttons

---

## 🚀 Deployment & Operations

### Environment Setup

#### Automated Setup (Recommended)
Use the comprehensive setup script with command line parameters:
```bash
./scripts/setup-env.sh \
  --email=admin@domain.de \
  --production-domain=game.domain.de \
  --traefik-domain=traefik.domain.de \
  --local-ip=10.0.0.44 \
  --traefik-user=admin \
  --traefik-pass=MySecurePassword123! \
  --env-type=production
```

**Script Features**:
- Auto-detects local IP if not specified
- Generates all cryptographically secure secrets
- Creates complete `.env` file with proper validation
- Handles Traefik password hashing and escaping

**Required Parameters**:
- `--email`: Email for Let's Encrypt SSL certificates
- `--production-domain`: Production domain (e.g., `game.korczewski.de`)
- `--traefik-domain`: Traefik dashboard domain (e.g., `traefik.korczewski.de`)
- `--traefik-pass`: Traefik dashboard password

#### Manual Setup (Alternative)
```bash
cp env.example .env
# Edit .env with your actual values
```

### Database Management

**Important**: All database commands must be run using `docker compose exec quiz-api` because the database is only accessible from within the Docker network.

#### Basic Database Commands
```bash
# Check database status and health
docker compose exec quiz-api node backend/scripts/db-manager.js status

# Initialize/update database schema (safe, preserves existing data)
docker compose exec quiz-api node backend/scripts/db-manager.js init

# Show help and available commands
docker compose exec quiz-api node backend/scripts/db-manager.js help
```

#### Development Commands
```bash
# Force fresh database initialization (⚠️ DELETES ALL DATA)
docker compose exec quiz-api node backend/scripts/db-manager.js init --force

# Complete database reset (⚠️ DELETES ALL DATA)  
docker compose exec quiz-api node backend/scripts/db-manager.js reset --force
```

#### Common Workflows

**Daily Development**:
```bash
docker compose up -d
docker compose exec quiz-api node backend/scripts/db-manager.js status
docker compose exec quiz-api node backend/scripts/db-manager.js init
```

**First Time Setup**:
```bash
docker compose up -d
docker compose exec quiz-api node backend/scripts/db-manager.js init --force
```

**Clean Reset**:
```bash
docker compose down -v
docker compose up -d
docker compose exec quiz-api node backend/scripts/db-manager.js init --force
```

#### Enhanced Database Features
- **Idempotent Operations**: All database operations can be run multiple times safely
- **Comprehensive Checks**: Validates tables, indexes, functions, and triggers
- **Safe Updates**: Schema updates without data loss for existing databases
- **Fresh Initialization**: Complete reset capability for development/testing
- **Automatic Migration**: Adds missing columns and updates schema as needed

### Container Management
```bash
# Quick rebuild (application containers only - recommended)
./rebuild.sh

# Full rebuild (all containers including postgres and traefik)
docker compose down
docker compose build --no-cache
docker compose up -d

# View logs
docker compose logs -f [service-name]
```

### Service Health Checks
- **Backend**: `GET /api/health` - Returns service status, database connectivity, uptime
- **Frontend**: `GET /` - Served by Express server on port 8080
- **Database**: PostgreSQL `pg_isready` check + comprehensive schema validation
- **Traefik**: `/ping` endpoint for health monitoring

---

## 🔍 Development Workflow

### Local Development
1. **Start Services**: `docker compose up -d`
2. **Initialize Database**: `docker compose exec quiz-api node backend/scripts/db-manager.js init`
3. **Access Frontend**: `http://10.0.0.44`
4. **Access API**: `http://10.0.0.44/api`
5. **View Logs**: `docker compose logs -f`

### Making Changes
1. **Frontend**: Edit files in `public/`, refresh browser (no rebuild needed)
2. **Backend**: Edit files in `backend/`, restart container: `docker compose restart quiz-api`
3. **Database**: Modify schema files and run: `docker compose exec quiz-api node backend/scripts/db-manager.js init`
4. **CSS/JS**: Changes reflected immediately (no rebuild needed)

### API Development
- **Backend Runs**: Port 3000 inside container, accessed via Traefik
- **Frontend Runs**: Port 8080 inside container, accessed via Traefik
- **Database**: Accessible on port 5432 (development only, via exec)
- **Live Reload**: Frontend changes are immediate, backend requires container restart

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   ```bash
   # Use exec commands instead of local database access
   docker compose exec quiz-api node backend/scripts/db-manager.js status
   docker compose exec postgres psql -U quiz_user -d quiz_meister
   
   # If authentication fails, reset database
   docker compose down -v && docker compose up -d
   docker compose exec quiz-api node backend/scripts/db-manager.js init --force
   ```

2. **SSL Certificate Issues**:
   - Verify `letsencrypt/acme.json` permissions: `chmod 600 letsencrypt/acme.json`
   - Check domain DNS configuration
   - Review Traefik logs: `docker compose logs traefik`

3. **White Screen Issues**:
   - **Browser Cache**: Hard refresh (Ctrl+F5) or use incognito mode
   - **API Health**: Test `https://game.korczewski.de/api/health`
   - **Service Status**: Check `docker compose ps` - all should be "healthy"
   - **Console Errors**: Open F12 Developer Tools for JavaScript errors

4. **Game Synchronization Issues**:
   - **Rate Limiting**: System handles 429 errors with exponential backoff
   - **Authentication Expiry**: Automatic logout and redirect when JWT tokens expire
   - **Polling Issues**: 2-second intervals prevent rate limiting while maintaining responsiveness

5. **Audio Issues**:
   - **Browser Policy**: Audio starts after first user interaction (expected behavior)
   - **Missing Files**: All 33 audio files should be present in `/public/assets/audio/`
   - **Console Errors**: Check for 404 errors on audio file loading

### Debug Commands
```bash
# Service status
docker compose ps

# Service logs
docker compose logs [service-name]

# Database access
docker compose exec postgres psql -U quiz_user -d quiz_meister

# Database status via API container
docker compose exec quiz-api node backend/scripts/db-manager.js status

# API health check
curl http://10.0.0.44/api/health

# Test specific endpoints
curl -H "Authorization: Bearer <token>" http://10.0.0.44/api/auth/me
```

### Performance Optimization
- **Docker Builds**: Multi-stage builds reduce image sizes by ~60%
- **Database**: Optimized PostgreSQL settings for small-medium workloads
- **API**: Connection pooling with retry logic and timeout handling
- **Frontend**: Optimized polling intervals and smart caching strategies
- **Audio**: Lazy loading and singleton pattern prevent resource waste

---

## 🔄 System Features Summary

### Multiplayer Gaming
- **Real-time synchronization** with server-managed game state
- **Adaptive polling** system (2s intervals) for optimal performance
- **Automatic question progression** with 60-second timing
- **Player state tracking** with live answer progress display

### Scoring & Competition
- **Advanced scoring algorithm** with time-based points and personal multipliers
- **Hall of Fame integration** with one-click score upload
- **Comprehensive statistics** including accuracy, streaks, and achievements
- **Leaderboard system** with global and catalog-specific rankings

### User Experience
- **Visual feedback system** with animated answer responses
- **Comprehensive audio system** with 33+ sound effects
- **Responsive design** supporting desktop, tablet, and mobile
- **Progressive web app** features with offline capability considerations

### Technical Reliability
- **Robust error handling** with exponential backoff and retry logic
- **Database integrity** with transactions and automatic migration
- **Security features** including JWT authentication and CORS protection
- **Container orchestration** with health checks and automatic recovery

---

## 📝 Recent Changes

### January 2025 - Volume Controls Implementation
- **Fixed Header Volume Controls**: Added persistent volume sliders at the top of the screen for music and sound effects
- **Independent Audio Control**: Separate volume controls for background music (🎵) and sound effects (🔊) with real-time adjustment
- **Optimized Audio Levels**: Reduced default sound effects volume to 13% (25% of previous level) for better balance with background music
- **Persistent Settings**: Volume preferences automatically saved to localStorage and restored on page reload
- **Visual Feedback**: Real-time percentage display showing current volume levels with smooth slider interactions
- **Responsive Design**: Volume controls adapt to different screen sizes with mobile-optimized layout
- **Audio Manager Integration**: New `volumeControls.js` module seamlessly integrates with existing audio system
- **Enhanced User Experience**: Fixed header design with backdrop blur and subtle shadow for professional appearance

### January 2025 - Game Engine Robustness Update
- **Enhanced Question Data Validation**: Improved `startQuestion` method in `gameEngine.js` with comprehensive question data validation
- **Better Error Handling**: Added validation for question text, type, and options before dispatching UI events
- **Improved Data Structure**: Enhanced question data preparation with explicit field mapping and fallback handling
- **Critical UI Updates**: Modified `syncGameState` to force UI updates with timing delays for better screen readiness
- **Robust Player Count**: Added null-safe player count calculation to prevent undefined object errors
- **Question Type Validation**: Added specific validation for multiple choice questions to ensure options array exists

### January 2025 - Game Controller Module Dependencies Fix
- **Critical Fix**: Fixed `lobbyManager.getCurrentLobby is not a function` error by updating gameController initialization
- **Module Dependencies**: Modified `initGameController` to accept both `lobbyManager` and `playerManager` parameters
- **Correct Method Access**: Updated `getCurrentCatalogName` function to use `playerManager.getCurrentLobby()` instead of `lobbyManager.getCurrentLobby()`
- **Data Structure Fix**: Fixed lobby data access to use `question_set.name` instead of `questionSet.name` to match API response format
- **Architecture Improvement**: Maintained separation of concerns where lobbyManager handles API calls and playerManager handles UI state
- **Error Resolution**: Resolved TypeError that was preventing game end screen from displaying catalog names correctly

### January 2025 - Game Controller Initialization Fix
- **Critical Fix**: Added missing `gameController.init()` call in `app.js` to properly initialize game engine and event listeners
- **Game Engine Setup**: Fixed gameEngine, questionManager, scoreSystem, and timer initialization that was preventing games from starting
- **Event Listener Registration**: Fixed GAME_STARTED event handler registration that was causing games to get stuck after lobby start
- **Enhanced Game Screen Handling**: Improved `updateGameUI` function in `gameController.js` with better screen transition handling
- **Separated UI Logic**: Split UI update logic into dedicated `updateGameUIElements` function for better maintainability
- **Improved Error Handling**: Added critical element validation with early returns to prevent UI corruption
- **Enhanced Screen Activation**: Added force activation of game screen when visibility issues are detected
- **Better Timing**: Increased screen transition timeout from 100ms to 300ms for more reliable UI updates
- **Error Placeholders**: Added error message display when question options fail to load

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Production Ready


