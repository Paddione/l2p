# 📖 Learn2Play Documentation

Welcome to the comprehensive documentation for Learn2Play - a feature-rich, real-time multiplayer quiz game built with modern web technologies.

## 🎯 What is Learn2Play?

Learn2Play is a production-ready multiplayer quiz game that combines real-time gameplay, advanced scoring mechanics, and immersive audio-visual experiences. The system supports up to 8 simultaneous players with synchronized gameplay, dynamic scoring with multiplier stacks, and comprehensive leaderboards.

## 📚 Documentation Structure

### 🚀 Getting Started
- **[Quick Start Guide](quick-start.md)** - Get up and running in 5 minutes
- **[🔧 Development Guide](development.md)** - Complete development setup and workflow
- **[🎨 Color Scheme Guide](color-scheme.md)** - UI design system and color palette

### 🏗️ System Architecture
- **[🏗️ Architecture & Technology](architecture.md)** - System design, tech stack, and infrastructure
- **[✨ Features Overview](features.md)** - Complete feature documentation with examples
- **[🔄 React Migration Plan](react-migration.md)** - Migration strategy and implementation

### 🔧 Development & Operations
- **[📋 Recent Changes](changelog.md)** - Latest updates and version history
- **[🧪 Testing Guide](tests.md)** - Testing strategies, automation, and quality assurance
- **[📝 Tasks & Roadmap](tasks.md)** - Current tasks and future development plans

## 🚀 Quick Navigation

### For Developers
```bash
# Clone and setup
git clone https://github.com/YOUR-USERNAME/learn2play.git
cd learn2play
npm run setup

# Start development
docker-compose up -d
```

### For System Administrators
```bash
# Production deployment
npm run prod

# Monitor system health
npm run status
npm run logs
```

### For QA/Testing
```bash
# Run test suite
npm run test

# Access testing interfaces
http://10.0.0.44/testing.html
http://10.0.0.44/analysis.html
```

## 🏗️ System Overview

### Architecture Components
- **Frontend**: React 18+ with TypeScript, Vite build system
- **Backend**: Node.js 18+ with Express.js and Socket.IO
- **Database**: PostgreSQL 15+ with connection pooling
- **Infrastructure**: Docker, Docker Compose, Traefik v3.0 with Let's Encrypt SSL
- **Real-time**: WebSocket communication for multiplayer synchronization

### Key Features
- 🎯 **Real-Time Multiplayer**: Up to 8 players with synchronized gameplay
- 🏆 **Advanced Scoring**: Time-based scoring with multiplier stacks (1x-5x)
- 🎵 **Audio System**: 33+ sound effects and background music
- 🏅 **Leaderboards**: Hall of Fame with top 10 scores per question set
- 🌐 **Localization**: Complete German/English dual-language support
- 🎨 **Modern UI/UX**: Dark/light themes with responsive design

## 🔧 Development Workflow

### Daily Development
1. **Start Services**: `npm run rebuild`
2. **Check Status**: `npm run status`
3. **View Logs**: `npm run logs`
4. **Test Changes**: Access http://10.0.0.44

### Common Tasks
- **Frontend Changes**: Edit files in `react-frontend/src/` → Auto-reload
- **Backend Changes**: Edit files in `backend/` → Run `npm run rebuild`
- **Database Changes**: Use `db-manager.js` scripts for schema updates
- **Configuration**: Update `.env` file and restart services

## 🧪 Testing & Quality Assurance

### Testing Levels
- **Unit Tests**: Component and service-level testing
- **Integration Tests**: API endpoint and database testing
- **End-to-End Tests**: Full gameplay scenario testing
- **Load Tests**: Multiplayer performance and scalability

### Quality Gates
- **Code Quality**: ESLint, TypeScript strict mode
- **Security**: SQL injection protection, rate limiting, CORS
- **Performance**: Health checks, monitoring, metrics
- **Accessibility**: WCAG compliance, keyboard navigation

## 📊 Monitoring & Metrics

### Health Endpoints
- **API Health**: `GET /api/health` - Service status and metrics
- **Database Health**: Connection pool status and performance
- **WebSocket Health**: Real-time connection monitoring

### Production Monitoring
- **Traefik Dashboard**: https://traefik.yourdomain.com
- **Application Logs**: `docker-compose logs -f`
- **Database Metrics**: Connection pool, query performance
- **SSL Certificate**: Automatic Let's Encrypt renewal

## 🚀 Deployment Guide

### Development Environment
```bash
# Local development with hot reload
npm run dev

# Access development server
http://10.0.0.44:3002  # React dev server
http://10.0.0.44/api   # API backend
```

### Production Environment
```bash
# Production deployment
npm run prod

# Access production services
https://game.yourdomain.com     # Production app
https://traefik.yourdomain.com  # Traefik dashboard
```

## 🔐 Security Considerations

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Rate limiting on API endpoints
- SQL injection protection middleware
- CORS configuration for cross-origin requests

### Infrastructure Security
- Traefik reverse proxy with SSL termination
- Let's Encrypt automatic certificate management
- Docker container security best practices
- Environment variable protection

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection Issues**: Check PostgreSQL container health
2. **WebSocket Disconnections**: Verify Traefik WebSocket configuration
3. **SSL Certificate Problems**: Check Let's Encrypt rate limits
4. **Performance Issues**: Monitor database connection pool metrics

### Debug Commands
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs -f [service-name]

# Database health check
docker-compose exec l2p-api node backend/scripts/db-manager.js status

# Test API endpoints
curl http://10.0.0.44/api/health
```

## 🤝 Contributing

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting consistency
- **Git Hooks**: Pre-commit quality checks

### Documentation Standards
- **README Files**: Each major component has documentation
- **Code Comments**: Inline documentation for complex logic
- **API Documentation**: Endpoint specifications and examples
- **Architecture Diagrams**: Visual system representations

## 📞 Support

### Development Support
- **Issue Tracking**: GitHub Issues for bug reports and feature requests
- **Code Review**: Pull request process for all changes
- **Documentation**: Comprehensive guides for all major components

### Production Support
- **Monitoring**: Real-time health checks and alerting
- **Logging**: Centralized log aggregation and analysis
- **Backup**: Automated database backup and recovery procedures

---

## 📋 Quick Reference

| Purpose | URL | Description |
|---------|-----|-------------|
| **Production App** | https://game.yourdomain.com | Main production application |
| **Development App** | http://10.0.0.44:3002 | Development server with hot reload |
| **API Backend** | http://10.0.0.44/api | REST API and WebSocket endpoints |
| **Traefik Dashboard** | https://traefik.yourdomain.com | Reverse proxy management |
| **Testing Interface** | http://10.0.0.44/testing.html | QA testing dashboard |
| **UI Analysis** | http://10.0.0.44/analysis.html | UI component analysis |

---

*This documentation is maintained alongside the codebase. Please keep it updated as you make changes to the system.*
