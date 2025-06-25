# Learn2Play - Multiplayer Quiz Game 🎮

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-containerized-blue)]()
[![Language Support](https://img.shields.io/badge/languages-EN%20%7C%20DE-orange)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

> A feature-rich, real-time multiplayer quiz game with advanced scoring, leaderboards, and comprehensive localization support.

## 🚀 Current Architecture

**Frontend**: React 18+ with TypeScript and Vite
**Backend**: Node.js 18+ with Express.js and Socket.IO
**Database**: PostgreSQL 15+ with connection pooling
**Infrastructure**: Docker, Traefik v3.0, Let's Encrypt SSL

## 📚 Documentation

This project's documentation has been organized into focused sections:

- **[📖 Main Documentation](docs/README.md)** - Complete documentation index
- **[🚀 Quick Start Guide](docs/quick-start.md)** - Get up and running quickly
- **[✨ Features Overview](docs/features.md)** - Complete feature documentation
- **[🏗️ Architecture & Technology](docs/architecture.md)** - Technical architecture and stack
- **[🔧 Development Guide](docs/development.md)** - Setup, commands, and development workflow
- **[📋 Recent Changes](docs/changelog.md)** - Latest updates and improvements
- **[🎨 Color Scheme Guide](docs/color-scheme.md)** - UI color system documentation
- **[🔄 React Migration Plan](docs/react-migration.md)** - Step-by-step React migration guide

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
- **Production**: http://10.0.0.44 (React production build)
- **Development**: http://10.0.0.44:3002 (React dev server with hot reload)
- **Production HTTPS**: https://game.korczewski.de
- **API**: http://10.0.0.44/api

## ✨ Key Features

- **🎯 Real-Time Multiplayer Gaming** - Synchronized sessions with live updates
- **🏆 Advanced Scoring System** - Time-based points with multiplier stacks
- **🎵 Immersive Audio Experience** - 33+ sound effects and background music
- **🏅 Hall of Fame & Leaderboards** - Top 10 scores per question set
- **🌐 Dual Language Support** - Complete German/English localization
- **🎨 Modern UI/UX** - Dark/light themes with responsive design

## 🏗️ Architecture

- **Frontend**: React 18+ with TypeScript, Vite build system
- **Backend**: Node.js 18+ with Express.js
- **Database**: PostgreSQL 15+ with connection pooling
- **Infrastructure**: Docker, Docker Compose, Traefik v3.0
- **SSL/TLS**: Let's Encrypt via Traefik

## ✅ Migration Status

**Status**: ✅ **COMPLETED** - React migration successfully implemented!  
**Frontend**: Modern React 18+ with TypeScript, real-time WebSocket integration  
**Production**: Nginx-served optimized build with Docker containerization

## 🔧 Development

For complete development setup and workflow, see the [Development Guide](docs/development.md).

```bash
# Quick commands
npm run rebuild           # Rebuild containers
npm run logs              # View logs
npm run status            # Check service status

# Development modes
npm run dev               # Start development environment (React dev server)
npm run prod              # Start production environment
npm run react:dev-local   # Start React dev server locally (without Docker)
```

## 📄 License

This project is licensed under the MIT License.