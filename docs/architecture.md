# 🏗️ Architecture & Technology Stack

Complete technical architecture documentation for Learn2Play multiplayer quiz game.

## 🎯 System Overview

Learn2Play follows a modern microservices architecture pattern with containerized deployment, implementing real-time communication for multiplayer gaming experiences.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Users/Clients │    │  Traefik Proxy  │    │  Let's Encrypt  │
│                 │    │   (SSL/Routing) │    │   (SSL Certs)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
         ┌─────────────────────────────────────────────┐
         │            Docker Network (l2p-network)     │
         │                                             │
         │  ┌─────────────────┐  ┌─────────────────┐   │
         │  │  React Frontend │  │  Node.js Backend│   │
         │  │  (l2p-app)      │  │  (l2p-api)      │   │
         │  │  - Static Build │  │  - Express.js   │   │
         │  │  - Nginx Serve  │  │  - Socket.IO    │   │
         │  └─────────────────┘  └─────────┬───────┘   │
         │                                 │           │
         │  ┌─────────────────┐            │           │
         │  │  PostgreSQL DB  │◄───────────┘           │
         │  │  (postgres)     │                        │
         │  │  - Data Storage │                        │
         │  │  - Connection Pool                       │
         │  └─────────────────┘                        │
         └─────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend Technologies
- **React 18+**: Modern UI framework with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Fast build tool and development server
- **CSS Modules**: Scoped styling with modern CSS features
- **WebSocket Client**: Real-time communication with Socket.IO client
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing and navigation

### Backend Technologies
- **Node.js 18+**: JavaScript runtime with ES modules support
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional event-based communication
- **PostgreSQL**: Relational database with JSONB support
- **JWT**: JSON Web Tokens for authentication
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Express rate limiter for API protection

### Infrastructure & DevOps
- **Docker**: Containerization platform
- **Docker Compose**: Multi-container application orchestration
- **Traefik v3.0**: Modern reverse proxy with automatic HTTPS
- **Let's Encrypt**: Automatic SSL certificate management
- **Nginx**: Static file serving and reverse proxy
- **Git**: Version control system

## 🏛️ System Architecture

### Container Architecture

#### 1. Frontend Container (l2p-app)
```dockerfile
# Multi-stage build for optimized production
FROM node:18-alpine as builder
WORKDIR /app
COPY react-frontend/ .
RUN npm ci --only=production
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
```

**Responsibilities:**
- Serve optimized React production build
- Handle static assets (images, audio, fonts)
- Provide health check endpoint
- Implement proper caching headers

#### 2. Backend Container (l2p-api)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/ .
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "server.js"]
```

**Responsibilities:**
- REST API endpoints for game logic
- WebSocket server for real-time communication
- Database operations and connection pooling
- Authentication and authorization
- Rate limiting and security middleware

#### 3. Database Container (postgres)
```dockerfile
FROM postgres:15-alpine
COPY backend/database/schema.sql /docker-entrypoint-initdb.d/
```

**Responsibilities:**
- Data persistence for users, games, scores
- ACID transaction support
- Connection pooling and performance optimization
- Automated backups and recovery

#### 4. Proxy Container (traefik)
**Configuration-based container with:**
- Automatic service discovery
- SSL certificate management
- Load balancing and health checks
- Request routing and middleware

### Network Architecture

#### Internal Network (l2p-network)
```yaml
networks:
  l2p-network:
    external: true
    driver: bridge
```

**Network Segmentation:**
- All containers communicate through internal network
- Only Traefik exposes ports to host
- Database access restricted to backend container
- Secure inter-service communication

#### Port Mapping
```yaml
# External → Internal
80:80     # HTTP (redirects to HTTPS)
443:443   # HTTPS (Traefik)
5432:5432 # PostgreSQL (development only)
3002:3000 # React dev server (development only)
```

## 📊 Data Architecture

### Database Schema

#### Core Tables

**users**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

**lobbies**
```sql
CREATE TABLE lobbies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    host_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'waiting',
    question_count INTEGER DEFAULT 10,
    current_question INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    settings JSONB DEFAULT '{}'
);
```

**hall_of_fame**
```sql
CREATE TABLE hall_of_fame (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    character_name VARCHAR(50),
    score INTEGER NOT NULL,
    accuracy DECIMAL(5,2),
    max_multiplier INTEGER,
    question_set_name VARCHAR(100) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Data Flow Patterns

#### Real-time Game Flow
```
Player Action → WebSocket → Backend → Database → Broadcast → All Players
```

#### Score Calculation Flow
```
Answer Submission → Time Calculation → Multiplier Application → Score Update → Leaderboard Update
```

## 🔄 Communication Patterns

### REST API Endpoints

#### Authentication
```
POST /api/auth/login     - User authentication
POST /api/auth/register  - User registration
POST /api/auth/refresh   - Token refresh
POST /api/auth/logout    - User logout
```

#### Game Management
```
GET  /api/lobbies        - List active lobbies
POST /api/lobbies        - Create new lobby
GET  /api/lobbies/:code  - Get lobby details
POST /api/lobbies/:code/join - Join lobby
```

#### Leaderboards
```
GET  /api/hall-of-fame              - Get all leaderboards
GET  /api/hall-of-fame/:questionSet - Get specific leaderboard
POST /api/hall-of-fame              - Submit new score
```

### WebSocket Events

#### Client → Server
```javascript
'join-lobby'        // Join game lobby
'player-ready'      // Mark player as ready
'submit-answer'     // Submit question answer
'start-game'        // Host starts game
'leave-lobby'       // Leave current lobby
```

#### Server → Client
```javascript
'lobby-updated'     // Lobby state changed
'game-started'      // Game has begun
'question-data'     // New question data
'answer-result'     // Answer feedback
'game-ended'        // Game completion
'player-joined'     // Player joined lobby
'player-left'       // Player left lobby
```

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login → JWT Token Generation
2. Token Storage → HTTP-only Cookies
3. Request Authentication → Token Validation
4. Token Refresh → Sliding Session
5. User Logout → Token Invalidation
```

### Security Layers

#### Application Security
- **JWT Authentication**: Stateless token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Per-IP request throttling
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **CSRF Protection**: SameSite cookies

#### Infrastructure Security
- **SSL/TLS Termination**: Traefik with Let's Encrypt
- **Container Isolation**: Docker network segmentation
- **Secrets Management**: Environment variables
- **Health Checks**: Container health monitoring
- **Log Security**: Structured logging without sensitive data

### Environment Configuration
```bash
# Security Environment Variables
JWT_SECRET=<256-bit-secret>
JWT_REFRESH_SECRET=<different-256-bit-secret>
SESSION_SECRET=<session-signing-secret>
DB_PASSWORD=<strong-database-password>
TRAEFIK_DASHBOARD_PASSWORD_HASH=<htpasswd-hash>
```

## 🚀 Deployment Architecture

### Development Environment
```yaml
# docker-compose.yml (development profile)
services:
  l2p-app-dev:
    build:
      target: development
    ports:
      - "3002:3000"
    volumes:
      - ./react-frontend:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      VITE_API_BASE_URL: http://10.0.0.44/api
```

### Production Environment
```yaml
# docker-compose.yml (production)
services:
  l2p-app:
    build:
      dockerfile: docker/Dockerfile.frontend
    environment:
      NODE_ENV: production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web-secure.rule=Host(`game.yourdomain.com`)"
```

### SSL/HTTPS Configuration
```yaml
traefik:
  command:
    - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
    - "--certificatesresolvers.letsencrypt.acme.email=${LETSENCRYPT_EMAIL}"
  volumes:
    - "./letsencrypt:/letsencrypt"
```

## 📊 Performance Architecture

### Database Optimization
- **Connection Pooling**: PostgreSQL connection pool (2-20 connections)
- **Query Optimization**: Indexed queries for frequent operations
- **Data Types**: Appropriate PostgreSQL data types (JSONB for settings)
- **Transaction Management**: ACID compliance for critical operations

### Caching Strategy
- **Static Assets**: Nginx caching with appropriate headers
- **API Responses**: In-memory caching for frequently accessed data
- **Database Connections**: Connection pool reuse
- **WebSocket Connections**: Efficient socket management

### Load Balancing
```yaml
# Traefik load balancing configuration
labels:
  - "traefik.http.services.api-backend.loadbalancer.sticky.cookie=true"
  - "traefik.http.services.api-backend.loadbalancer.healthcheck.path=/api/health"
```

## 🔧 Build & Deployment Process

### Build Pipeline
```bash
# Frontend Build
npm run react:build → Vite optimizes → Static files generated

# Backend Build
Docker multi-stage → Node.js app → Production image

# Database Setup
Schema migration → Initial data → Connection pooling
```

### Container Orchestration
```bash
# Service Dependencies
traefik → nginx (frontend) → express (backend) → postgresql
        ↓
   SSL Termination → Static Serving → API Processing → Data Storage
```

### Health Monitoring
```javascript
// Health check implementation
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: await testConnection() ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version
  };
  res.json(health);
});
```

## 🔄 Scaling Considerations

### Horizontal Scaling
- **Stateless Backend**: No server-side session storage
- **Database Connection Pooling**: Efficient connection management
- **Load Balancer Ready**: Traefik supports multiple backend instances
- **WebSocket Clustering**: Socket.IO supports Redis adapter for scaling

### Vertical Scaling
- **Resource Limits**: Docker container resource constraints
- **Database Performance**: PostgreSQL tuning for concurrent connections
- **Memory Management**: Node.js heap optimization
- **CPU Optimization**: Event loop performance monitoring

### Future Architecture Considerations
- **Redis Integration**: For session storage and WebSocket scaling
- **CDN Integration**: For static asset delivery
- **Monitoring Integration**: Prometheus/Grafana metrics
- **Log Aggregation**: ELK stack or similar logging solution

---

*This architecture documentation should be updated as the system evolves. Major architectural changes should be reflected here to maintain accuracy.*
