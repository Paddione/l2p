# Learn2Play - Multiplayer Quiz Game 🎮

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-containerized-blue)]()
[![Language Support](https://img.shields.io/badge/languages-EN%20%7C%20DE-orange)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

> A feature-rich, real-time multiplayer quiz game with advanced scoring, leaderboards, and comprehensive localization support.

## 📚 Documentation

This documentation is organized into the following sections:

- **[Quick Start Guide](quick-start.md)** - Get up and running quickly
- **[Features Overview](features.md)** - Complete feature documentation
- **[Architecture & Technology](architecture.md)** - Technical architecture and stack
- **[Development Guide](development.md)** - Setup, commands, and development workflow
- **[Recent Changes](changelog.md)** - Latest updates and improvements
- **[Color Scheme Guide](color-scheme.md)** - UI color system documentation

## 🚀 Quick Access

**Application URLs:**
- **Local**: http://10.0.0.44
- **Production**: https://game.korczewski.de
- **Development/Cache Clearing**: https://l2p.korczewski.de
- **Testing Dashboard**: http://10.0.0.44/testing.html
- **UI Analysis**: http://10.0.0.44/analysis.html

## 🎯 What is Learn2Play?

Learn2Play is a modern, real-time multiplayer quiz game built with web technologies. It features:

- **Real-time multiplayer gaming** with synchronized sessions
- **Advanced scoring system** with time-based points and multipliers
- **Comprehensive audio experience** with 33+ sound effects
- **Hall of Fame leaderboards** with medal system
- **Dual language support** (German/English)
- **Modern responsive UI** with dark/light themes
- **Production-ready architecture** with Docker containerization

## 🏗️ Project Structure

```
learn2play/
├── 📁 docs/              # Documentation (you are here)
├── 📁 backend/           # Node.js API server
├── 📁 public/            # Frontend application
├── 📁 docker/            # Docker build files
├── 📁 traefik_config/    # Reverse proxy config
├── 📁 scripts/           # Setup and management scripts
├── 📄 docker-compose.yml # Container orchestration
├── 📄 env.example       # Environment configuration template
└── 📄 rebuild.sh        # Quick rebuild script
```

## 🤝 Contributing

For development setup and contribution guidelines, see the [Development Guide](development.md).

## 📄 License

This project is licensed under the MIT License. 