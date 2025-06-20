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
- **33 Sound Effects**: Complete audio system with categorized sounds
- **Progressive Feedback**: Streak-based sound effects (`correct1.mp3` through `correct5.mp3`)
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
│   └── middleware/       # Express middleware
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
```

### Making Changes
1. **Frontend**: Edit files in `public/`, refresh browser
2. **Backend**: Edit files in `backend/`, restart: `docker-compose restart l2p-api`
3. **Database**: Modify schema, run: `docker-compose exec l2p-api node backend/scripts/db-manager.js init`

## 🚀 Deployment

### Production Deployment
1. **Configure Environment**: Set up `.env` file with production values
2. **Start Services**: `docker-compose up -d`
3. **Initialize Database**: `docker-compose exec l2p-api node backend/scripts/db-manager.js init`
4. **Verify Health**: Check `https://your-domain.com/api/health`

### SSL Configuration
- Automatic SSL via Let's Encrypt and Traefik
- Certificates stored in `letsencrypt/` directory
- Automatic renewal handled by Traefik

### Health Checks
- **Backend**: `GET /api/health` - Service status and database connectivity
- **Frontend**: `GET /` - Static file serving
- **Database**: PostgreSQL health checks with schema validation

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

### Debug Commands
```bash
docker-compose ps                    # Service status
docker-compose logs [service-name]   # Service logs
curl http://localhost/api/health     # API health check
```

## 🔄 Recent Updates

### v1.6.0 - Language & Development Features
- **🌐 Dual Language Support**: Complete German/English localization with flag-based switching
- **🛠️ Development Mode**: Forced cache clearing system for development workflow
- **🧹 Code Quality**: Cleaned up console logs and improved error handling
- **🔒 Security**: Enhanced JWT handling and input validation
- **🐳 Docker**: Multi-stage builds and performance optimizations

### Bug Fixes (Latest)
- **🔢 Question Count Field Dark Mode**: Fixed question count input field under "Fragensatz" appearing too light in dark mode - enhanced contrast by using darker background (gray-800) for better visibility
- **🎮 Join Game Screen Dark Mode**: Fixed join game screen (Spiel beitreten) not displaying correctly in dark mode - added comprehensive dark theme styling for join-game-container, lobby lists, manual join forms, input fields, buttons, and all related UI components including modal overlays
- **🔧 Help System Dark Mode**: Fixed Help (Hilfe) page and modal system not displaying correctly in dark mode - added comprehensive dark theme styling for help navigation, content sections, and modal overlays with proper contrast and theming
- **🎭 Modal System Enhancement**: Added general modal overlay support with dark mode compatibility for all modal dialogs including Help system, ensuring consistent theming across all modal components
- **💾 Save Score Dark Mode**: Fixed "Save Your Score" button and Hall of Fame section in game results not displaying correctly in dark mode - added comprehensive dark theme styling for hall-of-fame-section, success/error messages, and secondary buttons
- **🏆 Hall of Fame Dark Mode**: Fixed Hall of Fame visibility issues where white text on white background made elements invisible in dark mode - added comprehensive dark theme styling for all Hall of Fame components, leaderboard entries, selectors, and text elements
- **🌙 Dark Mode**: Extended dark theme support to question set selection menus and "meine Sätze" (my sets) section
- **🎨 UI Consistency**: Added complete dark mode styling for question set modals, cards, upload sections, and form controls
- **⏱️ Timer Dark Mode**: Fixed timer/counter elements not displaying correctly in dark mode - added proper dark theme styles for all timer variants (normal, warning, danger)
- **🔢 Counter Elements**: Enhanced dark mode support for player count, question count, and other counter displays
- Fixed lobby player count display showing "0/8" instead of actual count
- Resolved question set upload field name mismatch
- Corrected authentication screen references
- Enhanced error handling for session expiration

## 📞 Support & Contributing

### Getting Help
- Check the **Troubleshooting** section above
- Review logs: `npm run logs`
- Test API health: `curl http://localhost/api/health`

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Version**: 1.6.0  
**Status**: Production Ready  
**Last Updated**: January 2025

Built with ❤️ for multiplayer quiz gaming