# Design Document

## Overview

Learn2Play is architected as a modern, scalable multiplayer quiz platform using a microservices approach with real-time communication. The system employs a React frontend with TypeScript, Node.js backend with Express, PostgreSQL database, and WebSocket-based real-time synchronization. The architecture supports containerized deployment with Docker, automatic SSL via Traefik, and comprehensive testing infrastructure.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Traefik       │    │   Frontend      │    │   Backend       │
│   (SSL/Proxy)   │◄──►│   (React App)   │◄──►│   (Node.js)     │
│   Port 80/443   │    │   Port 3000     │    │   Port 3001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │   Port 5432     │
                                               └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Zustand for state management
- React Router for navigation
- Socket.IO client for real-time communication
- Vite for build tooling
- CSS Modules for styling

**Backend:**
- Node.js with Express framework
- TypeScript for type safety
- Socket.IO for WebSocket communication
- JWT for authentication
- Helmet for security headers
- Rate limiting for API protection

**Database:**
- PostgreSQL with connection pooling
- JSONB for flexible data storage
- Migration system for schema versioning
- Comprehensive indexing strategy

**Infrastructure:**
- Docker containers for all services
- Traefik for reverse proxy and SSL
- Let's Encrypt for automatic SSL certificates
- Docker Compose for orchestration

**AI & External Services:**
- Google Gemini Pro API for question generation (configured with project: gen-lang-client-0899352753)
- Chroma Vector Database for RAG knowledge base
- Azure Communication Services for email delivery

## Components and Interfaces

### Frontend Components

#### Core Components
- **App**: Main application router and theme provider
- **Header**: Navigation and user controls
- **HomePage**: Landing page with lobby creation/joining
- **LobbyPage**: Pre-game lobby with player management
- **GamePage**: Main game interface with questions and timer
- **ResultsPage**: Post-game results and Hall of Fame

#### UI Components
- **LobbyView**: Player list and ready status management
- **GameInterface**: Question display and answer selection
- **Timer**: Countdown timer with visual feedback
- **ScoreDisplay**: Real-time score and multiplier tracking
- **PlayerGrid**: Multi-player status visualization
- **ConnectionStatus**: Network connectivity indicator

#### Settings Components
- **SettingsModal**: Game configuration interface
- **LanguageSelector**: Language switching (EN/DE)
- **ThemeSelector**: Dark/light theme toggle
- **AudioSettings**: Volume controls for music and effects

### Backend Services

#### Core Services
- **DatabaseService**: PostgreSQL connection and query management
- **AuthService**: JWT-based authentication
- **EmailService**: Azure Communication Services integration
- **LobbyService**: Lobby creation and management
- **GameService**: Game session orchestration
- **QuestionService**: Question retrieval and localization
- **QuestionSetService**: Question set management and CRUD operations
- **ScoringService**: Score calculation and multiplier logic
- **ExperienceService**: Character leveling and experience calculation
- **GeminiService**: AI-powered question generation with RAG
- **ChromaService**: Vector database for RAG knowledge base
- **SocketService**: WebSocket event handling

#### Repository Layer
- **UserRepository**: User account management
- **LobbyRepository**: Lobby data persistence
- **QuestionRepository**: Question and answer data
- **GameSessionRepository**: Game state tracking
- **HallOfFameRepository**: Leaderboard management

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration with email verification
- `POST /api/auth/login` - User authentication (username/password)
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/profile` - User profile retrieval
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset with token
- `POST /api/auth/verify-email` - Email verification

#### Lobby Management
- `POST /api/lobbies` - Create new lobby
- `GET /api/lobbies/:code` - Join lobby by code
- `PUT /api/lobbies/:id/settings` - Update lobby settings
- `DELETE /api/lobbies/:id` - Delete lobby

#### Game Operations
- `GET /api/questions/sets` - Available question sets
- `GET /api/questions/:setId` - Questions for set
- `POST /api/scoring/submit` - Submit answer
- `GET /api/hall-of-fame/:setId` - Leaderboard data

#### Question Set Management
- `GET /api/question-sets` - List all available question sets
- `POST /api/question-sets` - Create new question set
- `GET /api/question-sets/:id` - Get specific question set
- `PUT /api/question-sets/:id` - Update question set
- `DELETE /api/question-sets/:id` - Delete question set
- `POST /api/question-sets/import` - Import question set from JSON
- `POST /api/question-sets/generate` - Generate question set with Gemini AI
- `PUT /api/question-sets/:id/questions/:questionId` - Update specific question
- `DELETE /api/question-sets/:id/questions/:questionId` - Delete specific question

#### Character & Experience
- `GET /api/characters` - Available character types
- `PUT /api/users/character` - Update user's selected character
- `POST /api/experience/award` - Award experience points
- `GET /api/users/:id/level` - Get user's current level and experience

#### System
- `GET /api/health` - Health check endpoint
- `GET /api/status` - System status

### WebSocket Events

#### Lobby Events
- `lobby:join` - Player joins lobby
- `lobby:leave` - Player leaves lobby
- `lobby:ready` - Player ready status change
- `lobby:settings` - Settings update
- `lobby:start` - Game start signal

#### Game Events
- `game:question` - New question broadcast
- `game:answer` - Player answer submission
- `game:results` - Question results
- `game:end` - Game completion
- `game:sync` - State synchronization

#### System Events
- `connection:status` - Connection state changes
- `error:game` - Game error notifications
- `player:update` - Player status updates

## Data Models

### User Model
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  selected_character: string;
  character_level: number;
  experience_points: number;
  created_at: Date;
  last_login?: Date;
  is_active: boolean;
  preferences: {
    language: 'en' | 'de';
    theme: 'light' | 'dark';
    audio: {
      musicVolume: number;
      effectsVolume: number;
    };
  };
}
```

### Lobby Model
```typescript
interface Lobby {
  id: number;
  code: string;
  host_id: number;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  question_count: number;
  current_question: number;
  created_at: Date;
  started_at?: Date;
  ended_at?: Date;
  settings: {
    questionSetIds: number[];
    timeLimit: number;
    allowReplay: boolean;
  };
  players: Player[];
}
```

### Question Model
```typescript
interface Question {
  id: number;
  question_set_id: number;
  question_text: LocalizedText;
  answers: Answer[];
  explanation?: LocalizedText;
  difficulty: number;
}

interface LocalizedText {
  en: string;
  de: string;
}

interface Answer {
  text: LocalizedText;
  correct: boolean;
}
```

### Game Session Model
```typescript
interface GameSession {
  id: number;
  lobby_id: number;
  question_set_id: number;
  started_at: Date;
  ended_at?: Date;
  total_questions: number;
  session_data: {
    questions: Question[];
    currentQuestionIndex: number;
    playerAnswers: PlayerAnswer[];
  };
}
```

### Player Result Model
```typescript
interface PlayerResult {
  id: number;
  session_id: number;
  user_id?: number;
  username: string;
  character_name: string;
  character_level: number;
  final_score: number;
  correct_answers: number;
  total_questions: number;
  max_multiplier: number;
  completion_time: number;
  experience_gained: number;
  answer_details: AnswerDetail[];
}
```

### Question Set Model
```typescript
interface QuestionSet {
  id: number;
  name: string;
  description?: string;
  category: string;
  created_by: number; // user_id
  created_at: Date;
  updated_at: Date;
  is_public: boolean; // Default: true, private sets playable but not editable
  question_count: number;
  difficulty_average: number;
  questions: Question[];
}
```

### Character Model
```typescript
interface Character {
  id: string;
  name: string;
  avatar_url: string;
  description: string;
  unlock_level: number;
}
```

### Experience Level Model
```typescript
interface ExperienceLevel {
  level: number;
  experience_required: number;
  experience_total: number; // Cumulative experience needed
}

// Experience scaling: level_exp = base_exp * (level ^ 1.5)
// Base experience: 100 points
// Level 1: 100 XP, Level 10: ~316 XP, Level 50: ~3536 XP, Level 100: ~10000 XP
```

## Error Handling

### Frontend Error Handling

#### Error Boundary
- React Error Boundary for component crash recovery
- Graceful fallback UI for broken components
- Error reporting to console and user feedback

#### Network Error Handling
- Automatic retry logic for failed API calls
- Connection status monitoring and user notification
- Offline mode detection and appropriate messaging

#### WebSocket Error Handling
- Automatic reconnection with exponential backoff
- Connection state management and user feedback
- Event queue for offline message handling

### Backend Error Handling

#### API Error Responses
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  timestamp: string;
  details?: any;
}
```

#### Database Error Handling
- Connection pool monitoring and recovery
- Transaction rollback on failures
- Specific error codes for different failure types
- Query timeout handling

#### WebSocket Error Handling
- Client disconnection management
- Room cleanup on connection loss
- Error event broadcasting to clients

### Error Categories

#### Client Errors (4xx)
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate lobby code)
- `429 Too Many Requests` - Rate limit exceeded

#### Server Errors (5xx)
- `500 Internal Server Error` - General server error
- `502 Bad Gateway` - Database connection failure
- `503 Service Unavailable` - System maintenance
- `504 Gateway Timeout` - Request timeout

## Testing Infrastructure

### Current Status (Updated: ${new Date().toISOString().split('T')[0]})

**Testing Environment Health:**
- ✅ **Frontend Unit Tests:** 76.3% success rate (251/329 tests passing)
- ⚠️ **Backend Unit Tests:** Configuration issues preventing execution
- ❌ **Integration Tests:** Service startup failures blocking execution
- ⚠️ **E2E Tests:** Environment setup incomplete

**Recent Improvements:**
- Fixed FileUpload component test suite (test IDs, text matching)
- Resolved Timer component CSS class assertion issues
- Enhanced LoadingSpinner CSS module testing
- Improved Jest configuration with better module mapping
- Added comprehensive browser API mocking

### Comprehensive Testing Architecture

The Learn2Play platform implements a comprehensive testing strategy with distributed test directories that separate different types of tests and provide clear organization for maintainability and scalability.

### Test Directory Structure

The testing infrastructure has been successfully migrated to a co-located structure for better maintainability and developer experience. All tests are now located alongside their source code.

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── __tests__/                 # Co-located frontend tests
│   │   │   ├── unit/                  # Unit tests for components, hooks, services
│   │   │   ├── integration/           # Integration tests for component interactions
│   │   │   └── README.md              # Frontend testing documentation
│   │   ├── components/                # React components
│   │   ├── hooks/                     # Custom hooks
│   │   ├── services/                  # Service layer
│   │   └── stores/                    # State management
│   ├── e2e/                          # E2E tests and Playwright configuration
│   │   ├── tests/                     # End-to-end tests (Playwright)
│   │   │   ├── smoke/                 # Basic functionality tests
│   │   │   ├── integration/           # Full workflow tests
│   │   │   ├── performance/           # Performance and load tests
│   │   │   ├── accessibility/         # Accessibility compliance tests
│   │   │   ├── error-handling/        # Error scenario tests
│   │   │   └── examples/              # Example and enhanced tests
│   │   ├── playwright.config.ts       # Playwright configuration
│   │   └── package.json               # E2E test dependencies
│   ├── jest.config.js                 # Frontend Jest configuration
│   └── package.json                   # Frontend dependencies and test scripts
├── backend/
│   ├── src/
│   │   ├── __tests__/                 # Co-located backend tests
│   │   │   ├── unit/                  # Unit tests for services, repositories, middleware
│   │   │   ├── integration/           # Integration tests for API endpoints, WebSocket
│   │   │   ├── e2e/                   # Backend E2E tests
│   │   │   ├── cli/                   # CLI tool tests
│   │   │   ├── performance/           # Performance tests
│   │   │   │   ├── load/              # Load testing
│   │   │   │   ├── stress/            # Stress testing
│   │   │   │   ├── memory/            # Memory testing
│   │   │   │   ├── database/          # Database performance tests
│   │   │   │   └── websocket/         # WebSocket performance tests
│   │   │   └── README.md              # Backend testing documentation
│   │   ├── services/                  # Service layer
│   │   ├── repositories/              # Data access layer
│   │   ├── middleware/                # Express middleware
│   │   └── routes/                    # API routes
│   ├── jest.config.js                 # Backend Jest configuration
│   └── package.json                   # Backend dependencies and test scripts
├── test-runner.sh                     # Main test runner script
└── docs/
    └── design.md                      # Updated design documentation
```

**Migration Status:**
- ✅ **Frontend Tests**: Successfully migrated to `frontend/src/__tests__/`
- ✅ **Backend Tests**: Successfully migrated to `backend/src/__tests__/`
- ✅ **E2E Tests**: Successfully consolidated to `frontend/e2e/tests/`
- ✅ **Performance Tests**: Successfully migrated to `backend/src/__tests__/performance/`
- ✅ **CLI Tests**: Successfully migrated to `backend/src/__tests__/cli/`
- ✅ **Configuration Files**: Updated to support co-located structure
- 🔄 **Legacy Directory**: `testing/` directory ready for removal

### Test Types and Coverage

#### Unit Testing
- **Frontend**: React components, hooks, services, and utilities
- **Backend**: Services, repositories, middleware, and utilities
- **Coverage**: 85%+ code coverage across all modules
- **Tools**: Jest, Testing Library, Supertest

#### Integration Testing
- **API Integration**: Full request/response cycle testing
- **WebSocket Integration**: Real-time communication testing
- **Database Integration**: Transaction handling and data consistency
- **Service Integration**: Cross-service communication validation

#### End-to-End Testing
- **Smoke Tests**: Basic functionality validation
- **Integration Tests**: Complete user workflows
- **Performance Tests**: Load and stress testing
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **Error Handling Tests**: Failure scenario validation

#### Performance Testing
- **Load Testing**: Multiple concurrent users (100+ simultaneous players)
- **Stress Testing**: System limits and failure points
- **Benchmarks**: Performance regression detection
- **Memory Testing**: Memory leak detection and optimization

#### Accessibility Testing
- **WCAG 2.1 Compliance**: AA level accessibility standards
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA attributes and semantic HTML
- **Color Contrast**: Automated contrast validation

#### Error Handling Testing
- **Network Failures**: API downtime and connection issues
- **Input Validation**: XSS, SQL injection, and malformed data protection
- **Edge Cases**: Boundary conditions and unusual user behavior
- **Graceful Degradation**: Fallback mechanisms and error recovery

### Test Environment Configuration

#### Docker-based Test Environment
```yaml
# testing/docker-compose.test.yml
version: '3.8'
services:
  frontend-test:
    build: ../frontend
    ports: ["3000:80"]
    environment:
      - NODE_ENV=test
      - VITE_API_URL=http://localhost:3001/api
      - VITE_SOCKET_URL=http://localhost:3001
    depends_on: [backend-test]

  backend-test:
    build: ../backend
    ports: ["3001:3001"]
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://l2p_user:l2p_password@postgres-test:5432/l2p_test
      - JWT_SECRET=test-jwt-secret-for-testing-only
    depends_on: [postgres-test]

  postgres-test:
    image: postgres:15
    environment:
      - POSTGRES_DB=l2p_test
      - POSTGRES_USER=l2p_user
      - POSTGRES_PASSWORD=l2p_password
    ports: ["5433:5432"]
    volumes:
      - ../database/init.sql:/docker-entrypoint-initdb.d/init.sql
```

#### Test Database Management
- **Isolated Database**: Separate PostgreSQL instance for testing
- **Automated Setup**: Database initialization and schema migration
- **Test Data Seeding**: Automated test data population
- **Cleanup Procedures**: Automatic test data removal

#### Test Utilities and Helpers
- **Database Helpers**: Setup and cleanup utilities
- **Mock Implementations**: External service simulation
- **Custom Matchers**: Jest matchers for specific assertions
- **Test Fixtures**: Reusable test data and configurations

### Test Execution and Automation

#### Command-line Interface
```bash
# Quick test execution
./test-runner.sh              # Run all tests
./test-runner.sh smoke        # Basic functionality
./test-runner.sh unit         # Unit tests only
./test-runner.sh e2e          # End-to-end tests
./test-runner.sh performance  # Load and performance
./test-runner.sh accessibility # A11y compliance
./test-runner.sh error-handling # Error scenarios

# Manual test execution
npm run test:unit:frontend    # Frontend unit tests
npm run test:unit:backend     # Backend unit tests
npm run test:integration:api  # API integration tests
npm run test:e2e:smoke        # E2E smoke tests
npm run test:performance:load # Performance load tests
```

#### Continuous Integration
- **GitHub Actions**: Automated testing on PRs and main branch
- **Multi-browser Testing**: Parallel execution across browsers
- **Test Reports**: Comprehensive HTML reports with screenshots/videos
- **Performance Regression**: Automated performance monitoring

#### Test Reporting and Monitoring
- **Coverage Reports**: HTML coverage reports with detailed metrics
- **Performance Reports**: Performance benchmark results and trends
- **Accessibility Reports**: WCAG compliance results and recommendations
- **Error Reports**: Error handling test results and failure analysis

### Testing Best Practices

#### Test Organization
1. **Clear Structure**: Logical organization by test type and component
2. **Consistent Naming**: Descriptive test names that explain the scenario
3. **Shared Utilities**: Reusable helper functions and fixtures
4. **Isolation**: Independent tests that don't rely on external state

#### Test Quality Standards
1. **High Coverage**: Maintain 85%+ code coverage across all modules
2. **Fast Execution**: Optimize test execution time for rapid feedback
3. **Reliable Results**: Minimize flaky tests through proper setup/teardown
4. **Clear Assertions**: Make test expectations explicit and understandable

#### Performance Testing Strategy
1. **Baseline Establishment**: Establish performance baselines for key metrics
2. **Regression Detection**: Monitor for performance regressions in CI/CD
3. **Load Testing**: Validate system behavior under expected load
4. **Stress Testing**: Identify system breaking points and limits

#### Accessibility Testing Approach
1. **WCAG Compliance**: Follow WCAG 2.1 AA guidelines consistently
2. **Keyboard Navigation**: Ensure full keyboard accessibility
3. **Screen Reader Support**: Test with actual screen readers
4. **Color Contrast**: Validate color contrast ratios automatically

## External Service Integration

### Azure Communication Services Email Setup

#### Configuration Requirements
```typescript
interface AzureEmailConfig {
  connectionString: string; // Azure Communication Services connection string
  senderEmail: 'info@korczewski.de';
  senderName: 'Learn2Play Platform';
}
```

#### Email Templates
- **Welcome Email**: Account creation confirmation with username
- **Password Reset**: Temporary password with mandatory change requirement
- **Email Verification**: Account activation link

#### Azure Setup Steps
1. Create Azure Communication Services resource
2. Configure custom domain (korczewski.de)
3. Set up sender authentication (SPF, DKIM, DMARC)
4. Configure shared mailbox info@korczewski.de
5. Generate connection string for application

### Gemini AI Integration

#### Question Generation Workflow
1. User provides topic prompt in Question Set Manager
2. System queries Chroma Vector DB for relevant context (RAG)
3. Enhanced prompt sent to Gemini Pro API
4. AI generates 20 questions with 4 answer options each
5. Generated questions validated and imported to database

#### Gemini API Configuration
```typescript
interface GeminiConfig {
  apiKey: string;
  model: 'gemini-1.5-flash';
  maxTokens: 4096;
  temperature: 0.7;
  projectId?: string;
  serviceAccountEmail?: string;
}
```

#### RAG Implementation with Chroma
- Vector embeddings for university course content PDFs
- Semantic search for relevant academic context
- Context injection into Gemini prompts for educational accuracy
- Knowledge base: University course materials converted to vector database



## Question Set Management System

### JSON Import Format
```json
{
  "name": "Sample Question Set",
  "description": "Example questions for testing",
  "category": "general",
  "questions": [
    {
      "questionText": {
        "en": "What is the capital of Germany?",
        "de": "Was ist die Hauptstadt von Deutschland?"
      },
      "answers": [
        {
          "text": {
            "en": "Berlin",
            "de": "Berlin"
          },
          "correct": true
        },
        {
          "text": {
            "en": "Munich",
            "de": "München"
          },
          "correct": false
        },
        {
          "text": {
            "en": "Hamburg",
            "de": "Hamburg"
          },
          "correct": false
        },
        {
          "text": {
            "en": "Frankfurt",
            "de": "Frankfurt"
          },
          "correct": false
        }
      ],
      "explanation": {
        "en": "Berlin has been the capital of Germany since reunification.",
        "de": "Berlin ist seit der Wiedervereinigung die Hauptstadt Deutschlands."
      },
      "difficulty": 2
    }
  ]
}
```

### Question Set Manager Features
- **Import**: JSON paste and validation
- **Generate**: AI-powered creation with Gemini
- **Edit**: Individual question modification
- **Delete**: Question set or individual question removal
- **Preview**: Question set testing interface
- **Export**: JSON download functionality

## Character & Experience System

### Character Progression
- **Starting Level**: 1 for all characters
- **Maximum Level**: 100
- **Experience Sources**: 
  - Game score converted 1:1 to experience points
  - Target: Level 100 after ~500 games with 50% average score
  - Average game score: ~300 points (50% of 600 max for 20 questions)
  - Total experience needed for level 100: ~150,000 XP

### Experience Scaling Formula
```typescript
function calculateLevelExperience(level: number): number {
  // Progressive scaling: early levels easier, later levels harder
  const baseExperience = 500;
  const scalingFactor = 1.8;
  return Math.floor(baseExperience * Math.pow(level, scalingFactor));
}

function getTotalExperienceForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += calculateLevelExperience(i);
  }
  return total;
}

// Target: ~150,000 total XP for level 100
// Level 1: 500 XP, Level 10: ~5,657 XP, Level 50: ~88,388 XP, Level 100: ~500,000 XP
```

### Character Selection System
- **University-themed Characters**: 8 unique university-related avatars
  - Professor, Student, Librarian, Researcher, Dean, Graduate, Lab Assistant, Teaching Assistant
- **Character Display**: Avatar with level badge in lobby and game
- **Character Persistence**: Selection saved in user preferences
- **Level Progression**: All characters start at level 1, progress to level 100

This enhanced design provides a comprehensive foundation for implementing the Learn2Play multiplayer quiz platform with authentication, AI-powered question generation, character progression, and external service integrations.