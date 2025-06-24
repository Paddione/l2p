# 🔧 Development Guide

Complete guide for setting up and developing Learn2Play.

## Prerequisites

- **Docker & Docker Compose**: Container orchestration
- **Node.js 18+**: For local development and npm scripts
- **Git**: Version control
- **Text Editor**: VS Code, Vim, or your preferred editor

## Environment Setup

### Automated Setup (Recommended)

The automated setup script configures everything for you:

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

#### Setup Script Features
- Generates secure JWT secrets
- Creates Traefik dashboard authentication
- Configures SSL certificates
- Sets up database credentials
- Configures CORS origins
- Creates production-ready `.env` file

### Manual Setup

If you prefer manual configuration:

```bash
# Copy environment template
cp env.example .env

# Edit with your preferred editor
nano .env  # or vim .env, code .env, etc.
```

#### Key Environment Variables

```bash
# Application
NODE_ENV=production
DEVELOPMENT_MODE=false

# Database
DB_HOST=l2p-db
DB_PORT=5432
DB_NAME=learn2play
DB_USER=l2p_user
DB_PASSWORD=your_secure_password

# JWT Authentication
JWT_SECRET=your_jwt_secret_here

# Traefik Configuration
TRAEFIK_DOMAIN=traefik.yourdomain.com
TRAEFIK_USER=admin
TRAEFIK_PASSWORD_HASH=hashed_password

# Domain Configuration
PRODUCTION_DOMAIN=game.yourdomain.com
LOCAL_IP=192.168.1.100
```

## Available Commands

### Development Commands

```bash
# Start all services
npm run start

# Quick rebuild (recommended for updates)
npm run rebuild

# Clean rebuild (removes all containers and volumes)
npm run rebuild:clean

# View service status
npm run status

# Stop all services
npm run stop

# Stop and remove all containers
npm run down
```

### Logging Commands

```bash
# View all service logs
npm run logs

# View backend API logs only
npm run logs:api

# View frontend app logs only
npm run logs:app

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs -f l2p-api
docker-compose logs -f l2p-app
docker-compose logs -f l2p-db
```

### Development Mode Commands

```bash
# Enable development mode (shows cache clearing screen)
npm run dev-mode:enable

# Disable development mode (normal operation)
npm run dev-mode:disable
```

## Database Management

The `db-manager.js` script provides comprehensive database operations:

### Database Commands

```bash
# Check database status
docker-compose exec l2p-api node backend/scripts/db-manager.js status

# Initialize database (safe, preserves data)
docker-compose exec l2p-api node backend/scripts/db-manager.js init

# Force reinitialize database (destructive)
docker-compose exec l2p-api node backend/scripts/db-manager.js init --force

# Complete database reset (destructive)
docker-compose exec l2p-api node backend/scripts/db-manager.js reset --force
```

### Database Schema

The application uses these tables:
- **`users`**: User accounts and authentication
- **`hall_of_fame`**: Leaderboard entries with scores and statistics  
- **`lobbies`**: Active game lobbies with question counts and replay settings
- **`lobby_players`**: Player-lobby relationships and game state
- **`lobby_questions`**: Question assignments and answers for each lobby
- **`question_sets`**: Question set metadata and content

## Development Workflow

### Making Changes

#### Frontend Development
1. **Edit files** in `public/` directory
2. **Refresh browser** to see changes (no rebuild needed)
3. **Check browser console** for JavaScript errors
4. **Test responsive design** across different screen sizes

#### Backend Development
1. **Edit files** in `backend/` directory
2. **Rebuild containers**: `npm run rebuild`
3. **Check logs**: `npm run logs:api`
4. **Test API endpoints** using browser dev tools or Postman

#### Database Changes
1. **Edit schema files** in `backend/database/`
2. **Run database reset**: `docker-compose exec l2p-api node backend/scripts/db-manager.js reset --force`
3. **Initialize database**: `docker-compose exec l2p-api node backend/scripts/db-manager.js init`

### Testing

#### Manual Testing
- **Main Interface**: http://10.0.0.44
- **Testing Dashboard**: http://10.0.0.44/testing.html
- **UI Analysis**: http://10.0.0.44/analysis.html
- **Simplified Interface**: http://10.0.0.44/simplified.html

#### Automated Testing
```bash
# Run frontend tests (if implemented)
cd public && npm test

# Run backend tests (if implemented)
cd backend && npm test
```

### Debugging

#### Common Issues

**Services won't start:**
```bash
# Check Docker status
docker ps -a
docker-compose ps

# Check for port conflicts
sudo netstat -tlnp | grep :8080
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5432

# Check logs for errors
docker-compose logs
```

**Database connection issues:**
```bash
# Check database container
docker-compose exec l2p-db psql -U l2p_user -d learn2play -c "SELECT version();"

# Reset database
docker-compose exec l2p-api node backend/scripts/db-manager.js reset --force
docker-compose exec l2p-api node backend/scripts/db-manager.js init
```

**Frontend not loading:**
```bash
# Check frontend container
docker-compose logs l2p-app

# Check if files are properly mounted
docker-compose exec l2p-app ls -la /usr/share/nginx/html/
```

**API errors:**
```bash
# Check backend logs
docker-compose logs l2p-api

# Check if backend is responding
curl http://localhost:3000/api/health
```

#### Development Tools

**Browser Developer Tools:**
- **Console**: Check for JavaScript errors
- **Network**: Monitor API calls and responses
- **Application**: Inspect localStorage and session data
- **Responsive Design**: Test different screen sizes

**Docker Tools:**
```bash
# Enter container shell
docker-compose exec l2p-api bash
docker-compose exec l2p-app bash
docker-compose exec l2p-db bash

# Check container resources
docker stats

# Inspect container configuration
docker-compose config
```

## Code Organization

### Frontend Structure
```
public/
├── js/
│   ├── api/          # API communication
│   ├── auth/         # Authentication
│   ├── audio/        # Sound management
│   ├── data/         # Data storage
│   ├── game/         # Game logic
│   ├── lobby/        # Lobby management
│   ├── ui/           # User interface
│   └── utils/        # Utilities
├── css/              # Stylesheets
├── assets/           # Static assets
└── *.html            # HTML pages
```

### Backend Structure
```
backend/
├── routes/           # API endpoints
├── models/           # Data models
├── database/         # Database layer
├── middleware/       # Express middleware
├── scripts/          # Utility scripts
└── server.js         # Main server
```

### Coding Standards

#### JavaScript
- Use ES6+ features (const/let, arrow functions, async/await)
- Follow camelCase naming convention
- Add JSDoc comments for functions
- Use meaningful variable names
- Handle errors properly with try/catch

#### CSS
- Use CSS custom properties for theming
- Follow BEM methodology for class names
- Use mobile-first responsive design
- Optimize for performance (avoid deep nesting)

#### HTML
- Use semantic HTML5 elements
- Include proper accessibility attributes
- Validate markup
- Optimize for SEO

## Performance Optimization

### Frontend Optimization
- **Minimize HTTP requests**: Combine CSS/JS files where possible
- **Optimize images**: Use appropriate formats and sizes
- **Lazy loading**: Load content as needed
- **Caching**: Implement proper browser caching
- **60 FPS limiting**: Ensure smooth animations

### Backend Optimization
- **Database queries**: Use indexes and optimize queries
- **Connection pooling**: Reuse database connections
- **Caching**: Implement response caching
- **Error handling**: Proper error responses
- **Rate limiting**: Prevent API abuse

## Deployment

### Local Development
```bash
# Standard development setup
docker-compose up -d
```

### Production Deployment
```bash
# Production setup with SSL
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment-Specific Configurations
- **Development**: Enable debug logging, development mode
- **Staging**: Production-like environment for testing
- **Production**: Optimized for performance and security

## Contributing

### Pull Request Process
1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Make changes** and test thoroughly
4. **Commit changes**: `git commit -m "Add new feature"`
5. **Push to branch**: `git push origin feature/new-feature`
6. **Create pull request** with detailed description

### Code Review Guidelines
- **Test all functionality** before submitting
- **Follow coding standards** and conventions
- **Include documentation** for new features
- **Update tests** if applicable
- **Ensure backwards compatibility**

### Issue Reporting
When reporting issues, include:
- **Environment details** (OS, browser, Docker version)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots or logs** if applicable
- **Proposed solution** if known 