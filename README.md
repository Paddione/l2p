# Learn2Play - Multiplayer Quiz Game 🎮

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-containerized-blue)]()
[![Language Support](https://img.shields.io/badge/languages-EN%20%7C%20DE-orange)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

> A feature-rich, real-time multiplayer quiz game with advanced scoring, leaderboards, and comprehensive localization support.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/learn2play.git
cd learn2play

# Setup environment
npm run setup

# Start the application
docker-compose up -d

# Initialize database
docker-compose exec l2p-api node backend/scripts/db-manager.js init
```

**Access the application:**
- **Local**: http://localhost:8080
- **Production**: https://your-domain.com

## 📋 Recent Changes

### UI Updates
- **Title Consistency**: Updated login screen and main menu titles to display "Learn2Play" consistently across all languages (previously showed "Quiz Game" in English and "Quiz Spiel" in German)
- **Dark Mode Input Fields**: Fixed white background input fields to properly display with dark backgrounds in dark mode, improving visibility and theme consistency
- **Dark Mode Question Set Areas**: Fixed question set selection containers and question count sections to use dark backgrounds in dark mode, ensuring complete theme consistency
- **Simplified Question Count UI**: Removed explanatory text block from question count section to create a cleaner, less cluttered interface

## ✨ Features

### 🎯 Real-Time Multiplayer Gaming
- **Synchronized Sessions**: Server-coordinated game starts for all players
- **Live Question Progression**: Automatic advancement with 60-second timer
- **Real-Time Status Updates**: Live display of player progress and readiness
- **Adaptive Polling**: Smart polling system (3-23 seconds) with rate limit handling
- **Customizable Games**: 1-100 questions with random selection from question sets
- **Persistent Lobbies**: Lobbies remain active after games for continued play

### 🏆 Advanced Scoring System
- **Time-Based Points**: Dynamic scoring (60 base points minus elapsed time)
- **Multiplier System**: Individual stacks (1x → 2x → 3x → 4x → 5x) for consecutive correct answers
- **Visual Feedback**: Real-time avatar flashing (green/red) and multiplier badges
- **Smart Reset**: Multipliers reset on wrong answers
- **Formula**: `(60 - seconds_elapsed) × personal_multiplier`

### 🎵 Immersive Audio Experience
- **32 Sound Effects**: Complete audio system with categorized sounds
  - **Game Sounds**: `correct1.mp3` through `correct5.mp3` for streak feedback
  - **UI Sounds**: `button-click.mp3`, `button-hover.mp3`, `modal-open.mp3`, `modal-close.mp3`
  - **Notification Sounds**: `player-join.mp3`, `player-leave.mp3`, `player-ready.mp3`
  - **Timer Sounds**: `timer-warning.mp3`, `timer-urgent.mp3`, `countdown-tick.mp3`
  - **Special Effects**: `applause.mp3`, `sparkle.mp3`, `whoosh.mp3`, `combobreaker.mp3`
  - **Achievement Sounds**: `high-score.mp3`, `perfect-score.mp3`, `streak-bonus.mp3`, `multiplier-max.mp3`
- **Background Music**: Ambient music track for immersive gameplay
- **Progressive Feedback**: Streak-based sound effects for consecutive correct answers
- **Independent Volume Controls**: Separate music and sound effects sliders
- **Persistent Settings**: Volume preferences saved to localStorage

### 🏅 Hall of Fame & Leaderboards
- **Question Set Leaderboards**: Top 10 scores per question set
- **Medal System**: Gold/Silver/Bronze for top 3 players with gradient backgrounds
- **Comprehensive Stats**: Character, username, score, accuracy, max multiplier
- **One-Click Upload**: Direct score submission from game results
- **Fair Competition**: Only complete question set runs qualify for Hall of Fame

### 🌐 Dual Language Support
- **Complete Localization**: Full German 🇩🇪 and English 🇺🇸 support
- **Flag-Based Switching**: Instant language switching with flag buttons
- **Real-Time Updates**: All UI elements update instantly
- **Persistent Settings**: Language preference saved and restored
- **Dynamic Translation**: Smart fallback system for both languages

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Complete theme support with smooth transitions
- **Visual Feedback**: Animated answer responses with color coding
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Interactive Help System**: 6-section comprehensive documentation
- **Loading States**: Progress indicators throughout the application
- **Visual Assets**: SVG graphics including knowledge map and quiz pattern designs

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js 18+ with Express.js
- **Database**: PostgreSQL 15+ with connection pooling
- **Reverse Proxy**: Traefik v3.0 with automatic SSL
- **Containerization**: Docker & Docker Compose
- **SSL/TLS**: Let's Encrypt via Traefik

### Service Architecture
```
[Traefik] → [Frontend:8080] → Static Files & UI
         → [Backend:3000]   → API & Game Logic
         → [PostgreSQL:5432] → Data Storage
```

### Project Structure
```
learn2play/
├── 📁 backend/           # Node.js API server
│   ├── routes/           # API endpoints
│   ├── models/           # Data models
│   ├── database/         # DB configuration & schemas
│   ├── middleware/       # Express middleware
│   └── scripts/          # Database management tools
├── 📁 public/            # Frontend application
│   ├── js/               # JavaScript modules
│   │   ├── api/          # API communication
│   │   ├── game/         # Game mechanics
│   │   ├── ui/           # UI components
│   │   └── utils/        # Utilities
│   ├── css/              # Stylesheets
│   └── assets/           # Images & audio files
├── 📁 docker/            # Docker build files
├── 📁 traefik_config/    # Reverse proxy config
├── 📁 scripts/           # Setup and management scripts
└── 📄 docker-compose.yml # Container orchestration
```

## 🔧 Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Environment Setup

#### Automated Setup (Recommended)
```bash
npm run setup -- \
  --email=admin@domain.com \
  --production-domain=game.domain.com \
  --traefik-domain=traefik.domain.com \
  --local-ip=YOUR_LOCAL_IP \
  --traefik-user=admin \
  --traefik-pass=SecurePassword123! \
  --env-type=production
```

The setup script will:
- Generate secure JWT secrets
- Create Traefik dashboard authentication
- Configure SSL certificates
- Set up database credentials
- Configure CORS origins
- Create production-ready `.env` file

#### Manual Setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### Available Commands
```bash
# Development
npm run start             # Start all services
npm run rebuild           # Quick rebuild (recommended)
npm run rebuild:clean     # Clean rebuild
npm run logs              # View all logs
npm run logs:api          # Backend logs only
npm run logs:app          # Frontend logs only
npm run status            # Service status
npm run stop              # Stop services
npm run down              # Stop and remove containers

# Development Mode
npm run dev-mode:enable   # Enable development mode
npm run dev-mode:disable  # Disable development mode

# Database Management
docker-compose exec l2p-api node backend/scripts/db-manager.js status
docker-compose exec l2p-api node backend/scripts/db-manager.js init
docker-compose exec l2p-api node backend/scripts/db-manager.js reset --force
```

### Database Management

The `db-manager.js` script provides comprehensive database operations:

#### Available Commands
- **`status`**: Check current database status and required tables
- **`init`**: Initialize or update database schema (safe, preserves data)
- **`init --force`**: Reset and reinitialize database (destructive)
- **`reset --force`**: Complete database reset (destructive)

#### Database Schema
The application uses the following tables:
- **`users`**: User accounts and authentication
- **`hall_of_fame`**: Leaderboard entries with scores and statistics
- **`lobbies`**: Active game lobbies
- **`lobby_players`**: Player-lobby relationships
- **`question_sets`**: Question set metadata and content

### Making Changes
1. **Frontend**: Edit files in `public/`, refresh browser
2. **Backend**: Edit files in `backend/`, restart: `docker-compose restart l2p-api`
3. **Database**: Modify schema, run: `docker-compose exec l2p-api node backend/scripts/db-manager.js init`

## 🚀 Deployment

### Production Deployment
1. **Configure Environment**: Set up `.env` file with production values
2. **Create Docker Network**: `docker network create l2p-network`
3. **Start Services**: `docker-compose up -d`
4. **Initialize Database**: `docker-compose exec l2p-api node backend/scripts/db-manager.js init`
5. **Verify Health**: Check `https://your-domain.com/api/health`

### SSL Configuration
- Automatic SSL via Let's Encrypt and Traefik
- Certificates stored in `letsencrypt/` directory
- Automatic renewal handled by Traefik
- Secure file permissions: `chmod 600 letsencrypt/acme.json`

### Health Checks
- **Backend**: `GET /api/health` - Service status and database connectivity
- **Frontend**: `GET /` - Static file serving
- **Database**: PostgreSQL health checks with schema validation
- **Traefik**: Built-in ping healthcheck

## 🛠️ Scripts & Utilities

### Setup Scripts
- **`scripts/setup-env.sh`**: Automated environment configuration
- **`scripts/enable-dev-mode.sh`**: Enable development mode with cache clearing
- **`scripts/disable-dev-mode.sh`**: Disable development mode
- **`rebuild.sh`**: Quick application rebuild script

### Database Scripts
- **`backend/scripts/db-manager.js`**: Comprehensive database management tool

### Development Mode
Development mode provides:
- Forced cache clearing on application startup
- Enhanced logging and debugging
- Automatic frontend cache invalidation
- Development-specific middleware

## 🔍 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info
- `GET /api/auth/verify` - Token verification

### Game Lobby Endpoints
- `POST /api/lobbies/create` - Create new lobby
- `GET /api/lobbies/list` - List active lobbies
- `GET /api/lobbies/:code` - Get lobby details
- `POST /api/lobbies/:code/join` - Join lobby
- `POST /api/lobbies/:code/start` - Start game
- `POST /api/lobbies/:code/answer` - Submit answer

### Hall of Fame Endpoints
- `GET /api/hall-of-fame` - Get leaderboard entries
- `POST /api/hall-of-fame` - Submit new score
- `GET /api/hall-of-fame/leaderboard/:catalog` - Catalog-specific leaderboard

### Question Set Endpoints
- `GET /api/question-sets` - List available question sets
- `POST /api/question-sets` - Upload new question set
- `GET /api/question-sets/:id` - Get specific question set

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
docker-compose exec l2p-api node backend/scripts/db-manager.js status
# If issues persist:
docker-compose down -v && docker-compose up -d
```

**SSL Certificate Issues**
```bash
chmod 600 letsencrypt/acme.json
docker-compose logs traefik
```

**White Screen Issues**
- Hard refresh browser (Ctrl+F5)
- Check `docker-compose ps` - all services should be "healthy"
- Test API health: `curl http://localhost/api/health`

**Docker Network Issues**
```bash
docker network create l2p-network
docker-compose up -d
```

### Debug Commands
```bash
docker-compose ps                    # Service status
docker-compose logs [service-name]   # Service logs
curl http://localhost/api/health     # API health check
docker-compose exec l2p-api node backend/scripts/db-manager.js status  # Database status
```

## 📈 Performance & Monitoring

### Health Monitoring
- **Service Health Checks**: Automatic health monitoring for all services
- **Database Monitoring**: Connection pool status and query performance
- **Load Balancer**: Traefik health checks with automatic failover
- **SSL Certificate Monitoring**: Automatic renewal and expiry tracking

### Performance Features
- **Database Connection Pooling**: Optimized PostgreSQL connections
- **Static Asset Caching**: Frontend asset optimization
- **Rate Limiting**: API protection with configurable limits
- **Compression**: Gzip compression for all responses

## 🔄 Recent Updates

### v1.6.0 - Language & Development Features
- **🌐 Dual Language Support**: Complete German/English localization with flag-based switching
- **🛠️ Development Mode**: Forced cache clearing system for development workflow
- **🧹 Code Quality**: Cleaned up console logs and improved error handling
- **🔒 Security**: Enhanced JWT handling and input validation
- **🐳 Docker**: Multi-stage builds and performance optimizations

### Audio System Enhancements
- **Complete Audio Library**: 32 categorized sound effects for immersive gameplay
- **Background Music**: Ambient soundtrack for enhanced user experience
- **Progressive Audio Feedback**: Streak-based sound progression system
- **Volume Control**: Independent music and sound effects controls

### Database Improvements
- **Advanced Management**: Comprehensive database management tools
- **Schema Validation**: Automatic database structure verification
- **Safe Migrations**: Non-destructive database updates
- **Health Monitoring**: Real-time database status checking

## 🤝 Contributing

1. **Fork the Repository**: Create your own fork of the project
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your feature or fix
4. **Test Thoroughly**: Ensure all tests pass and features work
5. **Update Documentation**: Add relevant documentation
6. **Commit Changes**: `git commit -m 'Add amazing feature'`
7. **Push to Branch**: `git push origin feature/amazing-feature`
8. **Open Pull Request**: Create a detailed pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Traefik**: For excellent reverse proxy and SSL management
- **PostgreSQL**: For robust database performance
- **Docker**: For containerization and deployment simplification
- **Let's Encrypt**: For free SSL certificates
- **Audio Assets**: Custom sound effects and music for immersive experience