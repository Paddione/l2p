# Learn2Play - Multiplayer Quiz Game 🎮

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-containerized-blue)]()
[![Language Support](https://img.shields.io/badge/languages-EN%20%7C%20DE-orange)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

> A feature-rich, real-time multiplayer quiz game with advanced scoring, leaderboards, and comprehensive localization support.

## 📚 Documentation

This project's documentation has been organized into focused sections:

- **[📖 Main Documentation](docs/README.md)** - Complete documentation index
- **[🚀 Quick Start Guide](docs/quick-start.md)** - Get up and running quickly
- **[✨ Features Overview](docs/features.md)** - Complete feature documentation
- **[🏗️ Architecture & Technology](docs/architecture.md)** - Technical architecture and stack
- **[🔧 Development Guide](docs/development.md)** - Setup, commands, and development workflow
- **[📋 Recent Changes](docs/changelog.md)** - Latest updates and improvements
- **[🎨 Color Scheme Guide](docs/color-scheme.md)** - UI color system documentation

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
- **Local**: http://10.0.0.44
- **Production**: https://game.korczewski.de
- **Testing Dashboard**: http://10.0.0.44/testing.html

## ✨ Key Features

- **🎯 Real-Time Multiplayer Gaming** - Synchronized sessions with live updates
- **🏆 Advanced Scoring System** - Time-based points with multiplier stacks
- **🎵 Immersive Audio Experience** - 33+ sound effects and background music
- **🏅 Hall of Fame & Leaderboards** - Top 10 scores per question set
- **🌐 Dual Language Support** - Complete German/English localization
- **🎨 Modern UI/UX** - Dark/light themes with responsive design

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js 18+ with Express.js
- **Database**: PostgreSQL 15+ with connection pooling
- **Infrastructure**: Docker, Docker Compose, Traefik v3.0
- **SSL/TLS**: Let's Encrypt via Traefik

## 🔧 Development

For complete development setup and workflow, see the [Development Guide](docs/development.md).

```bash
# Quick commands
npm run rebuild           # Rebuild containers
npm run logs              # View logs
npm run status            # Check service status
```

## 📄 License

This project is licensed under the MIT License.