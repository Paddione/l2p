# 🎮 Learn2Play - Visual Component Architecture

This document provides a visual representation of all Learn2Play application components and their interactions.

## 🏗️ High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LEARN2PLAY SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

    Internet Users
         │
         ▼
┌─────────────────────┐
│   Traefik Proxy     │ ← SSL Termination & Load Balancing
│   (Port 80/443)     │
└─────────┬───────────┘
          │
          ├─────────────────────────────────────────────────────────┐
          │                                                         │
          ▼                                                         ▼
┌─────────────────────┐                                   ┌─────────────────────┐
│   Frontend Service  │                                   │   Backend API       │
│   (Port 8080)       │ ◄──── HTTP/HTTPS Requests ────── │   (Port 3000)       │
│                     │                                   │                     │
│   • Static Files    │                                   │   • REST API        │
│   • HTML/CSS/JS     │                                   │   • Authentication  │
│   • Game UI         │                                   │   • Game Logic      │
│   • Audio Assets    │                                   │   • Real-time Poll  │
└─────────────────────┘                                   └─────────┬───────────┘
                                                                    │
                                                                    ▼
                                                          ┌─────────────────────┐
                                                          │   PostgreSQL DB     │
                                                          │   (Port 5432)       │
                                                          │                     │
                                                          │   • User Data       │
                                                          │   • Game Sessions   │
                                                          │   • Question Sets   │
                                                          │   • Hall of Fame    │
                                                          └─────────────────────┘
```

## 🎯 Frontend Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND COMPONENT STRUCTURE                          │
└─────────────────────────────────────────────────────────────────────────────────┘

                                 app.js (Main Controller)
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │   Core Modules  │ │   Game Modules  │ │   UI Modules    │
          └─────────────────┘ └─────────────────┘ └─────────────────┘
                    │                 │                 │
                    │                 │                 │
        ┌───────────┼───────────┐     │     ┌───────────┼───────────┐
        │           │           │     │     │           │           │
        ▼           ▼           ▼     ▼     ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │  Auth   │ │ Storage │ │  API    │ │  Game   │ │ Screen  │ │  UI     │
   │ Manager │ │ Manager │ │ Client  │ │ Engine  │ │ Manager │ │ Components│
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 📱 Screen Management Flow

```
Screen Manager (screenManager.js)
│
├── 🏠 Main Menu Screen
│   ├── User Authentication
│   ├── Create/Join Game
│   ├── Question Set Management
│   └── Hall of Fame
│
├── 🎮 Unified Game Screen
│   ├── Lobby Management
│   │   ├── Player List
│   │   ├── Question Set Selection
│   │   ├── Ready System
│   │   └── Game Start
│   │
│   ├── Active Game
│   │   ├── Question Display
│   │   ├── Answer Options
│   │   ├── Timer System
│   │   ├── Score Display
│   │   ├── Player Status
│   │   └── Progress Indicator
│   │
│   └── Results Screen
│       ├── Final Scores
│       ├── Hall of Fame Entry
│       ├── Game Statistics
│       └── Return to Menu
│
└── 🔧 Utility Screens
    ├── Loading Screen
    ├── Error Screen
    ├── Help System
    └── Settings/Preferences
```

## 🎯 Game Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GAME ENGINE FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

    Game Controller (gameController.js)
              │
              ▼
    ┌─────────────────────┐
    │   Game State        │ ◄─── Real-time Updates ───► Backend API
    │   Management        │
    └─────────┬───────────┘
              │
              ├─────────────────────────────────────────────────────────┐
              │                                                         │
              ▼                                                         ▼
    ┌─────────────────────┐                                   ┌─────────────────────┐
    │   Game Engine       │                                   │   Score System      │
    │   (gameEngine.js)   │                                   │   (scoreSystem.js)  │
    │                     │                                   │                     │
    │   • Question Flow   │ ◄──── Score Updates ──────────── │   • Time Bonus      │
    │   • Answer Logic    │                                   │   • Multipliers     │
    │   • State Updates   │                                   │   • Streak Bonus    │
    │   • Progress Track  │                                   │   • Final Calc      │
    └─────────┬───────────┘                                   └─────────────────────┘
              │
              ├─────────────────────────────────────────────────────────┐
              │                                                         │
              ▼                                                         ▼
    ┌─────────────────────┐                                   ┌─────────────────────┐
    │   Timer System      │                                   │   Question Manager  │
    │   (timer.js)        │                                   │   (questionManager.js)│
    │                     │                                   │                     │
    │   • Countdown       │ ◄──── Question Events ────────── │   • Question Load   │
    │   • Time Warnings   │                                   │   • Answer Valid    │
    │   • Auto Submit     │                                   │   • Progress Track  │
    │   • Visual Updates  │                                   │   • Set Management  │
    └─────────────────────┘                                   └─────────────────────┘
```

## 🎵 Audio System Architecture

```
Audio Manager (audioManager.js)
│
├── 🎵 Background Music
│   ├── Main Menu Theme
│   ├── Game Music
│   └── Results Music
│
├── 🔊 Sound Effects (33 total)
│   ├── UI Interactions
│   │   ├── Button Clicks
│   │   ├── Menu Navigation
│   │   ├── Notifications
│   │   └── Error Sounds
│   │
│   ├── Game Events
│   │   ├── Question Start
│   │   ├── Answer Submit
│   │   ├── Correct Answer
│   │   ├── Wrong Answer
│   │   ├── Time Warning
│   │   └── Game Complete
│   │
│   └── Achievement Sounds
│       ├── Score Milestones
│       ├── Streak Bonuses
│       ├── Hall of Fame
│       └── Victory Fanfare
│
└── 🎛️ Volume Controls
    ├── Master Volume
    ├── Music Volume
    ├── SFX Volume
    └── Mute Toggle
```

## 🌐 API Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API COMMUNICATION                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

Frontend API Client (apiClient.js)
              │
              ├─── Authentication ───► /api/auth/*
              │    ├── POST /register
              │    ├── POST /login
              │    ├── POST /logout
              │    └── GET  /verify
              │
              ├─── Lobby Management ───► /api/lobbies/*
              │    ├── POST /create
              │    ├── POST /join
              │    ├── GET  /active
              │    ├── GET  /:id
              │    ├── POST /:id/ready
              │    ├── POST /:id/start
              │    └── POST /:id/leave
              │
              ├─── Question Sets ───► /api/question-sets/*
              │    ├── GET  /
              │    ├── POST /upload
              │    ├── GET  /:id
              │    └── DELETE /:id
              │
              └─── Hall of Fame ───► /api/hall-of-fame/*
                   ├── GET  /
                   ├── POST /
                   └── GET  /:questionSetId

Real-time Updates (Polling System)
├── Lobby Status Updates (Every 2s)
├── Game State Updates (Every 1s)
├── Player Status Updates (Every 2s)
└── Score Updates (Real-time)
```

## 🗄️ Database Schema Visualization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
    │     USERS       │         │    LOBBIES      │         │ QUESTION_SETS   │
    ├─────────────────┤         ├─────────────────┤         ├─────────────────┤
    │ id (PK)         │◄────────┤ host_id (FK)    │         │ id (PK)         │
    │ username        │         │ id (PK)         │         │ name            │
    │ email           │         │ code            │         │ description     │
    │ password_hash   │         │ status          │         │ questions       │
    │ character_id    │         │ question_count  │         │ created_by (FK) │
    │ created_at      │         │ current_question│         │ is_public       │
    │ updated_at      │         │ question_set_id │◄────────┤ created_at      │
    └─────────────────┘         │ created_at      │         │ updated_at      │
            │                   │ updated_at      │         └─────────────────┘
            │                   └─────────────────┘
            │
            │                   ┌─────────────────┐
            │                   │ LOBBY_PLAYERS   │
            │                   ├─────────────────┤
            │                   │ lobby_id (FK)   │
            └───────────────────┤ user_id (FK)    │
                                │ is_ready        │
                                │ score           │
                                │ answers         │
                                │ joined_at       │
                                └─────────────────┘
                                        │
                                        │
                                ┌─────────────────┐
                                │ HALL_OF_FAME    │
                                ├─────────────────┤
                                │ id (PK)         │
                                │ user_id (FK)    │◄──────┘
                                │ question_set_id │
                                │ score           │
                                │ time_taken      │
                                │ questions_count │
                                │ created_at      │
                                └─────────────────┘
```

## 🔄 Component Interaction Patterns

### Authentication Flow
```
User Input → Auth UI → Auth Manager → API Client → Backend → Database
     ↓                     ↓              ↓           ↓         ↓
Storage ← Screen Manager ← Auth Response ← API Response ← Query Result
```

### Game Session Flow
```
Lobby Creation → Player Join → Ready System → Game Start → Question Flow
       ↓              ↓            ↓            ↓            ↓
   Database ←── API Polling ←── State Sync ←── Timer ←── Score Calculation
```

### Real-time Updates
```
Frontend Polling → API Request → Database Query → Response → State Update → UI Refresh
      ↑                                                                          ↓
      └─────────────────── Continuous Loop (1-2s intervals) ──────────────────────┘
```

## 📱 Mobile Responsiveness Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RESPONSIVE DESIGN SYSTEM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

CSS Architecture:
├── main.css (Base styles)
├── components.css (UI components)
├── game.css (Game-specific styles)
├── mobile-enhancements.css (Mobile optimizations)
└── animations.css (Animation definitions)

Breakpoint System:
├── Mobile: < 768px
│   ├── Single column layout
│   ├── Touch-optimized buttons
│   ├── Simplified navigation
│   └── Reduced animations
│
├── Tablet: 768px - 1024px
│   ├── Two-column layout
│   ├── Medium-sized touch targets
│   ├── Sidebar navigation
│   └── Optimized animations
│
└── Desktop: > 1024px
    ├── Multi-column layout
    ├── Hover interactions
    ├── Full navigation
    └── Rich animations
```

## 🔧 Development & Testing Architecture

```
Development Tools:
├── 📄 testing.html (Comprehensive test dashboard)
│   ├── System Health Tests
│   ├── Authentication Tests
│   ├── UI Component Tests
│   ├── Game Flow Tests
│   ├── API Tests
│   └── Performance Tests
│
├── 📄 test.html (Documentation structure test)
│   ├── Documentation Links
│   ├── Navigation Tests
│   ├── Structure Validation
│   └── Content Organization
│
├── 📄 analysis.html (UI analysis tools)
├── 📄 clear-cache.html (Cache management)
└── 🔧 Development Mode Toggle
    ├── Cache clearing
    ├── Debug logging
    ├── Hot reloading
    └── Test data
```

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DEPLOYMENT PIPELINE                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Docker Compose Orchestration:
├── 🌐 Traefik (Reverse Proxy)
│   ├── SSL Certificate Management
│   ├── Load Balancing
│   ├── Service Discovery
│   └── Health Checks
│
├── 📱 Frontend Container
│   ├── Static File Server
│   ├── Gzip Compression
│   ├── Cache Headers
│   └── Asset Optimization
│
├── ⚙️ Backend Container
│   ├── Node.js API Server
│   ├── Environment Configuration
│   ├── Database Connection Pool
│   └── Error Handling
│
└── 🗄️ PostgreSQL Container
    ├── Persistent Data Volume
    ├── Backup Strategy
    ├── Connection Limits
    └── Performance Tuning

Management Scripts:
├── rebuild.sh (Quick rebuild)
├── setup-env.sh (Environment setup)
├── enable-dev-mode.sh (Development mode)
└── disable-dev-mode.sh (Production mode)
```

## 🔍 Component Dependencies

```
Core Dependencies:
app.js
├── screenManager.js
├── storage.js
├── auth.js
│   ├── apiClient.js
│   └── storage.js
├── lobbyManager.js
│   ├── apiClient.js
│   ├── playerManager.js
│   └── storage.js
├── gameController.js
│   ├── gameEngine.js
│   ├── scoreSystem.js
│   ├── timer.js
│   ├── questionManager.js
│   └── apiClient.js
├── audioManager.js
├── themeManager.js
├── languageSwitcher.js
├── helpSystem.js
└── UI Components
    ├── notifications.js
    ├── animations.js
    ├── hallOfFame.js
    ├── questionSetManager.js
    ├── questionSetSelector.js
    ├── questionSetUploader.js
    └── volumeControls.js
```

This visual architecture document provides a comprehensive overview of how all Learn2Play components interact and depend on each other, making it easier for developers to understand the system structure and modify components safely.