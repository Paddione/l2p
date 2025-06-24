# 🏗️ Architecture & Technology

Learn2Play is built with a modern, scalable architecture designed for real-time multiplayer gaming.

## Technology Stack

### Frontend
- **JavaScript**: Vanilla ES6+ for maximum performance and compatibility
- **HTML5**: Semantic markup with modern web standards
- **CSS3**: Advanced styling with custom properties and responsive design
- **Audio API**: Web Audio API for immersive sound experience
- **Local Storage**: Persistent user preferences and settings

### Backend
- **Node.js 18+**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **PostgreSQL 15+**: Relational database with connection pooling
- **JWT**: JSON Web Tokens for authentication
- **CORS**: Cross-Origin Resource Sharing configuration

### Infrastructure
- **Docker**: Containerization for all services
- **Docker Compose**: Multi-container orchestration
- **Traefik v3.0**: Reverse proxy with automatic SSL
- **Let's Encrypt**: Automatic SSL certificate management
- **PostgreSQL**: Persistent data storage

## Service Architecture

```
Internet → [Traefik Reverse Proxy:80/443]
                    ↓
            [SSL Termination & Routing]
                    ↓
    ┌─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
[Frontend:8080]                    [Backend:3000]
Static Files & UI                  API & Game Logic
    │                                     │
    │                                     ▼
    │                              [PostgreSQL:5432]
    │                              Data Storage
    │                                     │
    └─────────────── API Calls ──────────┘
```

### Service Details

#### Traefik (Reverse Proxy)
- **Port**: 80 (HTTP), 443 (HTTPS)
- **Function**: SSL termination, routing, load balancing
- **Features**: Automatic SSL certificates, dashboard, health checks

#### Frontend Service
- **Port**: 8080
- **Technology**: Static file server
- **Content**: HTML, CSS, JavaScript, assets
- **Features**: Gzip compression, caching headers

#### Backend API
- **Port**: 3000
- **Technology**: Node.js + Express
- **Features**: RESTful API, WebSocket-like polling, authentication
- **Endpoints**: Auth, lobbies, question sets, hall of fame

#### Database
- **Port**: 5432
- **Technology**: PostgreSQL 15+
- **Features**: Connection pooling, transactions, constraints
- **Data**: Users, lobbies, questions, scores

## Project Structure

```
learn2play/
├── 📁 backend/                    # Node.js API Server
│   ├── 📁 routes/                 # API Endpoints
│   │   ├── auth.js                # Authentication routes
│   │   ├── hallOfFame.js          # Leaderboard API
│   │   ├── lobby.js               # Game lobby management
│   │   └── questionSets.js        # Question set management
│   ├── 📁 models/                 # Data Models
│   │   ├── User.js                # User model
│   │   ├── HallOfFameEntry.js     # Leaderboard entry model
│   │   └── QuestionSet.js         # Question set model
│   ├── 📁 database/               # Database Layer
│   │   ├── connection.js          # Database connection
│   │   ├── init.js                # Database initialization
│   │   ├── schema.sql             # Database schema
│   │   ├── lobby.sql              # Lobby-specific tables
│   │   ├── questionsets.sql       # Question set tables
│   │   └── reset.js               # Database reset utilities
│   ├── 📁 middleware/             # Express Middleware
│   │   ├── auth.js                # Authentication middleware
│   │   └── validation.js          # Input validation
│   ├── 📁 scripts/                # Utility Scripts
│   │   └── db-manager.js          # Database management CLI
│   ├── server.js                  # Main server file
│   ├── healthcheck.js             # Health check endpoint
│   └── package.json               # Node.js dependencies
├── 📁 public/                     # Frontend Application
│   ├── 📁 js/                     # JavaScript Modules
│   │   ├── 📁 api/                # API Communication
│   │   │   ├── apiClient.js       # HTTP client
│   │   │   └── questionSetsApi.js # Question set API
│   │   ├── 📁 auth/               # Authentication
│   │   │   └── auth.js            # Auth management
│   │   ├── 📁 audio/              # Audio System
│   │   │   └── audioManager.js    # Sound management
│   │   ├── 📁 data/               # Data Management
│   │   │   ├── storage.js         # Local storage
│   │   │   └── hallOfFame.js      # Leaderboard data
│   │   ├── 📁 game/               # Game Logic
│   │   │   ├── gameController.js  # Game state management
│   │   │   ├── gameEngine.js      # Core game logic
│   │   │   ├── questionManager.js # Question handling
│   │   │   ├── scoreSystem.js     # Scoring logic
│   │   │   └── timer.js           # Timer system
│   │   ├── 📁 lobby/              # Lobby Management
│   │   │   ├── lobbyManager.js    # Lobby state
│   │   │   └── playerManager.js   # Player management
│   │   ├── 📁 ui/                 # UI Components
│   │   │   ├── animations.js      # Animation system
│   │   │   ├── notifications.js   # Notification system
│   │   │   ├── screenManager.js   # Screen navigation
│   │   │   ├── helpSystem.js      # Help documentation
│   │   │   ├── hallOfFame.js      # Leaderboard UI
│   │   │   ├── questionSetManager.js # Question set UI
│   │   │   ├── questionSetSelector.js # Question selection
│   │   │   ├── questionSetUploader.js # Question upload
│   │   │   └── volumeControls.js  # Audio controls
│   │   └── 📁 utils/              # Utilities
│   │       ├── constants.js       # Application constants
│   │       ├── helpers.js         # Helper functions
│   │       ├── translations.js    # Localization
│   │       ├── languageSwitcher.js # Language switching
│   │       ├── themeManager.js    # Theme management
│   │       └── developmentMode.js # Development utilities
│   ├── 📁 css/                    # Stylesheets
│   │   ├── main.css               # Base styles
│   │   ├── game.css               # Game-specific styles
│   │   ├── components.css         # UI component styles
│   │   ├── mobile-enhancements.css # Mobile optimizations
│   │   └── animations.css         # Animation definitions
│   ├── 📁 assets/                 # Static Assets
│   │   ├── 📁 audio/              # Sound files (33 files)
│   │   └── 📁 images/             # Graphics (SVG files)
│   ├── index.html                 # Main application
│   ├── simplified.html            # Simplified interface
│   ├── testing.html               # Testing dashboard
│   ├── analysis.html              # UI analysis
│   ├── clear-cache.html           # Cache management
│   ├── server.js                  # Static file server
│   └── package.json               # Frontend dependencies
├── 📁 docker/                     # Docker Configuration
│   ├── Dockerfile.backend         # Backend container
│   ├── Dockerfile.frontend        # Frontend container
│   └── Dockerfile.postgres        # Database container
├── 📁 traefik_config/             # Reverse Proxy Config
│   ├── traefik.yml                # Main Traefik config
│   └── 📁 dynamic/                # Dynamic configuration
│       └── dynamic_conf.yml       # Service routing
├── 📁 scripts/                    # Management Scripts
│   ├── setup-env.sh               # Environment setup
│   ├── enable-dev-mode.sh         # Development mode
│   └── disable-dev-mode.sh        # Production mode
├── 📁 docs/                       # Documentation
├── docker-compose.yml             # Container orchestration
├── env.example                    # Environment template
├── rebuild.sh                     # Quick rebuild script
└── package.json                   # Project dependencies
```

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    character_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### lobbies
```sql
CREATE TABLE lobbies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    host_id INTEGER REFERENCES users(id),
    question_count INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'waiting',
    current_question INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### lobby_players
```sql
CREATE TABLE lobby_players (
    id SERIAL PRIMARY KEY,
    lobby_id INTEGER REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    character_id INTEGER DEFAULT 1,
    score INTEGER DEFAULT 0,
    multiplier INTEGER DEFAULT 1,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lobby_id, user_id)
);
```

#### question_sets
```sql
CREATE TABLE question_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    created_by INTEGER REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### hall_of_fame
```sql
CREATE TABLE hall_of_fame (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    character_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    max_multiplier INTEGER NOT NULL,
    question_set_id INTEGER REFERENCES question_sets(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Design

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Lobby Management
- `POST /api/lobby/create` - Create new lobby
- `POST /api/lobby/join` - Join existing lobby
- `GET /api/lobby/:code` - Get lobby status
- `POST /api/lobby/:code/ready` - Mark player ready
- `POST /api/lobby/:code/start` - Start game (host only)
- `POST /api/lobby/:code/answer` - Submit answer
- `DELETE /api/lobby/:code/leave` - Leave lobby

### Question Sets
- `GET /api/question-sets` - List available question sets
- `POST /api/question-sets` - Create new question set
- `GET /api/question-sets/:id` - Get specific question set
- `PUT /api/question-sets/:id` - Update question set
- `DELETE /api/question-sets/:id` - Delete question set

### Hall of Fame
- `GET /api/hall-of-fame` - Get leaderboards
- `GET /api/hall-of-fame/:questionSetId` - Get leaderboard for specific question set
- `POST /api/hall-of-fame` - Submit score

## Security Features

### Authentication
- **JWT Tokens**: Secure authentication with JSON Web Tokens
- **Password Hashing**: bcrypt for secure password storage
- **Token Expiration**: Configurable token lifetimes
- **CORS Protection**: Configured cross-origin resource sharing

### Data Protection
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: API rate limiting to prevent abuse
- **Environment Variables**: Sensitive data in environment configuration

### Network Security
- **HTTPS Only**: SSL/TLS encryption for all communications
- **Secure Headers**: Security headers via Traefik
- **Docker Isolation**: Containerized services with network isolation

## Performance Optimizations

### Frontend
- **Modular JavaScript**: Code splitting and lazy loading
- **CSS Optimization**: Minimized and compressed stylesheets
- **Asset Compression**: Gzipped static files
- **Local Storage**: Cached user preferences and settings
- **60 FPS Limiting**: Framerate limiting for smooth animations

### Backend
- **Connection Pooling**: PostgreSQL connection pooling
- **Efficient Queries**: Optimized database queries
- **Caching Strategy**: Response caching where appropriate
- **Polling Optimization**: Smart polling intervals (3-23 seconds)

### Infrastructure
- **Container Optimization**: Lightweight Docker images
- **Reverse Proxy Caching**: Traefik caching for static assets
- **Database Indexing**: Proper database indexes for performance
- **Health Checks**: Container health monitoring

## Deployment Architecture

### Development Environment
```
Local Machine → Docker Compose → Local Services
```

### Production Environment
```
Internet → Traefik (SSL) → Docker Services → PostgreSQL
```

### Scaling Considerations
- **Horizontal Scaling**: Multiple backend instances via Docker Compose
- **Database Scaling**: PostgreSQL read replicas
- **Load Balancing**: Traefik automatic load balancing
- **CDN Integration**: Static asset delivery optimization 