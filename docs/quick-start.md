# 🚀 Quick Start Guide

Get Learn2Play up and running in minutes!

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/learn2play.git
cd learn2play
```

### 2. Setup Environment

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

### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# Initialize database
docker-compose exec l2p-api node backend/scripts/db-manager.js init
```

## Access Points

Once running, you can access:

- **Main Application**: http://10.0.0.44
- **Production**: https://game.korczewski.de
- **Development/Cache Clearing**: https://l2p.korczewski.de
- **Testing Dashboard**: http://10.0.0.44/testing.html
- **UI Analysis**: http://10.0.0.44/analysis.html

## Quick Commands

```bash
# View service status
npm run status

# View logs
npm run logs

# Rebuild (recommended for updates)
npm run rebuild

# Stop services
npm run stop
```

## First Game

1. Open the application in your browser
2. Click "🎮 Alle Spieloptionen" for the unified game interface
3. Create a game by selecting a question set and setting question count
4. Share the game code with other players
5. Start playing!

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check Docker status
docker ps
docker-compose logs
```

**Database connection issues:**
```bash
# Reset database
docker-compose exec l2p-api node backend/scripts/db-manager.js reset --force
docker-compose exec l2p-api node backend/scripts/db-manager.js init
```

**Port conflicts:**
```bash
# Check what's using the ports
sudo netstat -tlnp | grep :8080
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5432
```

## Next Steps

- Read the [Features Overview](features.md) to understand all capabilities
- Check the [Development Guide](development.md) for development setup
- Review [Architecture](architecture.md) to understand the system design 