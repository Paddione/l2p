# 🧪 Testing Guide

Comprehensive testing strategy and implementation guide for Learn2Play multiplayer quiz game.

## 🎯 Testing Philosophy

Learn2Play follows a multi-layered testing approach ensuring reliability, performance, and user experience across all system components.

### Testing Pyramid

```
                    ▲
                   /|\
                  / | \
                 /  |  \
                /   |   \
               /    |    \
              /  E2E/UI   \     ← Fewer, high-value tests
             /   Testing   \
            /_______________ \
           /                 \
          /   Integration     \   ← API, Database, WebSocket
         /     Testing        \
        /_____________________ \
       /                       \
      /      Unit Testing       \  ← Many, fast, isolated tests
     /_________________________\
```

## 🔬 Testing Levels

### 1. Unit Testing

**Scope**: Individual functions, components, services
**Tools**: Jest, React Testing Library, Vitest
**Coverage Target**: 80%+

#### Frontend Unit Tests
```typescript
// Example: Component Testing
import { render, screen, fireEvent } from '@testing-library/react';
import { GameButton } from '../components/GameButton';

describe('GameButton', () => {
  test('renders with correct text', () => {
    render(<GameButton text="Start Game" onClick={() => {}} />);
    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const mockClick = jest.fn();
    render(<GameButton text="Test" onClick={mockClick} />);
    fireEvent.click(screen.getByText('Test'));
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Backend Unit Tests
```javascript
// Example: Service Testing
const { calculateScore } = require('../services/gameService');

describe('Game Service', () => {
  test('calculates score correctly with multiplier', () => {
    const timeElapsed = 10; // seconds
    const multiplier = 3;
    const expectedScore = (60 - 10) * 3; // 150
    
    expect(calculateScore(timeElapsed, multiplier)).toBe(expectedScore);
  });

  test('handles maximum time correctly', () => {
    const timeElapsed = 60;
    const multiplier = 1;
    expect(calculateScore(timeElapsed, multiplier)).toBe(0);
  });
});
```

### 2. Integration Testing

**Scope**: Component interactions, API endpoints, database operations
**Tools**: Supertest, Jest, Docker containers
**Coverage Target**: Key user flows and API contracts

#### API Integration Tests
```javascript
// Example: API Endpoint Testing
const request = require('supertest');
const app = require('../server');

describe('Lobby API', () => {
  test('POST /api/lobbies creates new lobby', async () => {
    const response = await request(app)
      .post('/api/lobbies')
      .send({
        hostUsername: 'testUser',
        questionCount: 10
      })
      .expect(201);

    expect(response.body).toHaveProperty('code');
    expect(response.body.code).toMatch(/^[A-Z0-9]{6}$/);
  });

  test('GET /api/lobbies/:code returns lobby details', async () => {
    // First create a lobby
    const createResponse = await request(app)
      .post('/api/lobbies')
      .send({ hostUsername: 'testUser', questionCount: 5 });

    const lobbyCode = createResponse.body.code;

    // Then fetch it
    const response = await request(app)
      .get(`/api/lobbies/${lobbyCode}`)
      .expect(200);

    expect(response.body.code).toBe(lobbyCode);
    expect(response.body.questionCount).toBe(5);
  });
});
```

#### Database Integration Tests
```javascript
// Example: Database Testing
const { Pool } = require('pg');
const { initializeDatabase } = require('../database/init');

describe('Database Operations', () => {
  let pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    });
    await initializeDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('creates user successfully', async () => {
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      ['testuser', 'test@example.com', 'hashedpassword']
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBeTruthy();
  });
});
```

### 3. End-to-End Testing

**Scope**: Complete user workflows, browser automation
**Tools**: Playwright, Puppeteer, Cypress
**Coverage Target**: Critical user journeys

#### E2E Test Examples
```javascript
// Example: Playwright E2E Test
const { test, expect } = require('@playwright/test');

test.describe('Multiplayer Game Flow', () => {
  test('complete game session with two players', async ({ browser }) => {
    // Create two browser contexts (players)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    // Player 1 creates lobby
    await player1.goto('http://10.0.0.44');
    await player1.click('[data-testid="create-lobby"]');
    await player1.fill('[data-testid="username"]', 'Player1');
    await player1.click('[data-testid="confirm"]');
    
    // Get lobby code
    const lobbyCode = await player1.textContent('[data-testid="lobby-code"]');

    // Player 2 joins lobby
    await player2.goto('http://10.0.0.44');
    await player2.click('[data-testid="join-lobby"]');
    await player2.fill('[data-testid="lobby-code"]', lobbyCode);
    await player2.fill('[data-testid="username"]', 'Player2');
    await player2.click('[data-testid="join"]');

    // Both players should see each other
    await expect(player1.locator('[data-testid="player-list"]')).toContainText('Player2');
    await expect(player2.locator('[data-testid="player-list"]')).toContainText('Player1');

    // Start game and play through
    await player1.click('[data-testid="start-game"]');
    
    // Wait for first question
    await expect(player1.locator('[data-testid="question"]')).toBeVisible();
    await expect(player2.locator('[data-testid="question"]')).toBeVisible();

    // Both players answer
    await player1.click('[data-testid="answer-0"]');
    await player2.click('[data-testid="answer-1"]');

    // Check results
    await expect(player1.locator('[data-testid="score"]')).toBeVisible();
    await expect(player2.locator('[data-testid="score"]')).toBeVisible();

    await context1.close();
    await context2.close();
  });
});
```

### 4. Performance Testing

**Scope**: Load testing, stress testing, performance benchmarks
**Tools**: Artillery, k6, Apache Bench
**Metrics**: Response time, throughput, concurrent users

#### Load Testing Configuration
```yaml
# artillery-config.yml
config:
  target: 'http://10.0.0.44'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  socketio:
    timeout: 30000

scenarios:
  - name: "Lobby Creation Load Test"
    weight: 30
    flow:
      - post:
          url: "/api/lobbies"
          json:
            hostUsername: "LoadTestUser{{ $randomString(5) }}"
            questionCount: 10

  - name: "WebSocket Connection Test"
    weight: 70
    flow:
      - socketio:
          emit:
            channel: "join-lobby"
            data:
              code: "TEST01"
              username: "User{{ $randomString(3) }}"
```

## 🛠️ Testing Infrastructure

### Test Environment Setup

#### Docker Test Environment
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: l2p_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
    ports:
      - "5433:5432"

  test-api:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test_user:test_pass@test-db:5432/l2p_test
    depends_on:
      - test-db
    ports:
      - "3001:3000"
```

#### Test Database Management
```javascript
// test/setup/database.js
const { Pool } = require('pg');

class TestDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    });
  }

  async setup() {
    // Create test schema
    await this.pool.query('DROP SCHEMA IF EXISTS test CASCADE');
    await this.pool.query('CREATE SCHEMA test');
    await this.pool.query('SET search_path TO test');
    
    // Initialize tables
    await this.initializeTables();
  }

  async cleanup() {
    // Clear all data between tests
    await this.pool.query('TRUNCATE TABLE users, lobbies, hall_of_fame RESTART IDENTITY CASCADE');
  }

  async teardown() {
    await this.pool.end();
  }
}

module.exports = TestDatabase;
```

### Test Data Management

#### Test Fixtures
```javascript
// test/fixtures/gameData.js
const testUsers = [
  {
    username: 'testuser1',
    email: 'user1@test.com',
    password_hash: '$2b$10$...' // bcrypt hash for 'password123'
  },
  {
    username: 'testuser2',
    email: 'user2@test.com',
    password_hash: '$2b$10$...'
  }
];

const testQuestions = [
  {
    question: 'What is 2 + 2?',
    answers: ['3', '4', '5', '6'],
    correct_answer: 1,
    category: 'Math'
  },
  {
    question: 'What is the capital of France?',
    answers: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct_answer: 2,
    category: 'Geography'
  }
];

module.exports = { testUsers, testQuestions };
```

#### Mock Services
```javascript
// test/mocks/websocketMock.js
class WebSocketMock {
  constructor() {
    this.events = {};
    this.emittedEvents = [];
  }

  on(event, callback) {
    this.events[event] = callback;
  }

  emit(event, data) {
    this.emittedEvents.push({ event, data });
    if (this.events[event]) {
      this.events[event](data);
    }
  }

  getEmittedEvents() {
    return this.emittedEvents;
  }

  clearEmittedEvents() {
    this.emittedEvents = [];
  }
}

module.exports = WebSocketMock;
```

## 🤖 Test Automation

### Continuous Integration Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: l2p_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/l2p_test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Docker
        run: docker-compose -f docker-compose.test.yml up -d
        
      - name: Wait for services
        run: ./scripts/wait-for-services.sh
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-videos
          path: test-results/
```

### Test Scripts and Commands

#### Package.json Test Scripts
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:load": "artillery run test/load/game-load-test.yml",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

#### Test Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'backend/**/*.js',
    'react-frontend/src/**/*.{js,jsx,ts,tsx}',
    '!**/*.config.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};
```

## 📊 Quality Metrics

### Code Coverage Targets

| Component | Coverage Target | Current Status |
|-----------|-----------------|----------------|
| Backend Services | 85% | ✅ Implemented |
| API Routes | 90% | 🚧 In Progress |
| Frontend Components | 80% | 📋 Planned |
| Database Operations | 95% | ✅ Implemented |
| WebSocket Events | 85% | 🚧 In Progress |

### Performance Benchmarks

| Metric | Target | Monitoring |
|--------|--------|------------|
| API Response Time | < 200ms | ✅ Automated |
| WebSocket Latency | < 50ms | 🚧 Manual |
| Concurrent Users | 100+ | 📋 Planned |
| Database Queries | < 100ms | ✅ Automated |
| Memory Usage | < 512MB | 🚧 Manual |

## 🔍 Testing Best Practices

### Test Organization
```
test/
├── unit/
│   ├── backend/
│   │   ├── services/
│   │   ├── routes/
│   │   └── utils/
│   └── frontend/
│       ├── components/
│       ├── hooks/
│       └── utils/
├── integration/
│   ├── api/
│   ├── database/
│   └── websocket/
├── e2e/
│   ├── game-flow/
│   ├── user-management/
│   └── admin-features/
├── load/
│   ├── artillery-configs/
│   └── k6-scripts/
├── fixtures/
│   ├── users.json
│   ├── questions.json
│   └── lobbies.json
└── utils/
    ├── test-helpers.js
    ├── database-setup.js
    └── mock-factory.js
```

### Test Naming Conventions
```javascript
// Good: Descriptive test names
describe('Game Score Calculation', () => {
  test('should calculate correct score with time bonus and multiplier', () => {});
  test('should reset multiplier when answer is incorrect', () => {});
  test('should handle edge case when time expires', () => {});
});

// Bad: Vague test names
describe('Game', () => {
  test('test1', () => {});
  test('score works', () => {});
});
```

### Assertion Patterns
```javascript
// Good: Specific assertions
expect(response.status).toBe(201);
expect(response.body).toHaveProperty('code');
expect(response.body.code).toMatch(/^[A-Z0-9]{6}$/);

// Bad: Generic assertions
expect(response).toBeTruthy();
expect(response.body).toBeDefined();
```

## 🚨 Testing Anti-Patterns to Avoid

### Common Mistakes
1. **Testing Implementation Details**: Focus on behavior, not internal structure
2. **Interdependent Tests**: Each test should be independent and isolated
3. **Excessive Mocking**: Mock external dependencies, not your own code
4. **Slow Test Suites**: Keep unit tests fast (< 1s each)
5. **Brittle E2E Tests**: Use stable selectors and realistic user flows

### Database Testing Guidelines
```javascript
// Good: Isolated database tests
beforeEach(async () => {
  await testDb.cleanup(); // Clear data before each test
});

// Bad: Tests that depend on previous test state
test('should update user', () => {
  // Assumes user exists from previous test
});
```

## 📋 Testing Checklist

### Before Deployment
- [ ] All unit tests pass (> 80% coverage)
- [ ] Integration tests verify API contracts
- [ ] E2E tests cover critical user journeys
- [ ] Load tests validate performance targets
- [ ] Security tests check for vulnerabilities
- [ ] Accessibility tests ensure WCAG compliance
- [ ] Browser compatibility tests pass
- [ ] Mobile responsive tests complete

### Continuous Monitoring
- [ ] Performance regression detection
- [ ] Error rate monitoring
- [ ] User experience metrics
- [ ] System health checks
- [ ] Security vulnerability scanning

---

*This testing guide should be updated as new testing strategies are implemented and the system evolves. Regular review ensures testing practices remain effective and current.*
