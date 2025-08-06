# Development Tasks

## Test Fixes - High Priority

### 1. Fix BaseRepository Mocking Issues
**Status:** 🔴 Critical
**Files:** 
- `backend/src/repositories/__tests__/QuestionRepository.test.ts`
- `backend/src/repositories/__tests__/UserRepository.test.ts`
- `backend/src/repositories/__tests__/LobbyRepository.test.ts`

**Issues:**
- TS2769: No overload matches this call for jest.spyOn(BaseRepository.prototype, 'create')
- TS2339: Property 'mockResolvedValue' does not exist on type 'never'
- TS2445: Property 'findById' is protected and only accessible within class 'BaseRepository'

**Action Required:**
- Create proper mock factory for BaseRepository
- Use dependency injection pattern
- Implement proper TypeScript interfaces for mocked methods

### 2. Resolve Missing Module Imports
**Status:** 🔴 Critical
**Files:**
- `backend/src/routes/__tests__/integration/AuthRoutesIntegration.test.ts`
- `backend/src/routes/__tests__/integration/FileUploadRoutesIntegration.test.ts`
- `backend/src/routes/__tests__/integration/GameRoutesIntegration.test.ts`
- `backend/src/routes/__tests__/integration/HealthRoutesIntegration.test.ts`
- `backend/src/routes/__tests__/integration/LobbyRoutesIntegration.test.ts`
- `backend/src/routes/__tests__/integration/QuestionRoutesIntegration.test.ts`

**Issues:**
- TS2307: Cannot find module '../../server' or its corresponding type declarations
- TS2307: Cannot find module '../../services/DatabaseService' or its corresponding type declarations

**Action Required:**
- Check module exports in server.ts and services
- Fix import paths
- Ensure proper TypeScript configuration

### 3. Fix Service Test Type Issues
**Status:** 🟡 High
**Files:**
- `backend/src/services/__tests__/AuthService.test.ts`
- `backend/src/services/__tests__/FileProcessingService.test.ts`
- `backend/src/services/__tests__/GameService.test.ts`
- `backend/src/services/__tests__/GeminiService.test.ts`
- `backend/src/services/__tests__/SocketService.test.ts`

**Issues:**
- TS2345: Argument type incompatibility in JWT mock implementations
- TS2532: Object is possibly 'undefined' in array access

**Action Required:**
- Fix JWT mock type signatures
- Add proper null checks
- Implement proper TypeScript interfaces

## Test Fixes - Medium Priority

### 4. Remove Console Logging from Tests
**Status:** 🟡 Medium
**Files:**
- `backend/src/__tests__/performance/simple-performance.test.ts`
- `backend/src/__tests__/database/test-connection.test.ts`
- `frontend/src/hooks/__tests__/usePerformanceOptimizedState.simple.test.ts`

**Action Required:**
- Remove all console.log/error statements
- Use proper test logging if needed
- Clean up test output pollution

### 5. Replace `any` Types with Proper Interfaces
**Status:** 🟡 Medium
**Files:** Multiple test files across backend and frontend

**Action Required:**
- Replace `any` types with proper TypeScript interfaces
- Add proper type annotations
- Improve type safety

### 6. Fix Frontend Component Test Issues
**Status:** 🟡 Medium
**Files:**
- `frontend/src/components/__tests__/Timer.test.tsx`
- `frontend/src/components/__tests__/AuthGuard.test.tsx`

**Issues:**
- Use of setTimeout in tests without proper async handling
- Missing proper cleanup in useEffect tests

**Action Required:**
- Implement proper async test patterns
- Add proper cleanup for useEffect tests
- Use proper test utilities

## Test Fixes - Low Priority

### 7. Standardize Import Patterns
**Status:** 🟢 Low
**Files:** Multiple test files

**Action Required:**
- Standardize relative vs absolute imports
- Fix inconsistent file extensions
- Implement consistent import patterns

### 8. Replace Magic Numbers with Constants
**Status:** 🟢 Low
**Files:** Multiple test files

**Action Required:**
- Create test constants file
- Replace hardcoded values with named constants
- Improve test maintainability

### 9. Add Missing Type Annotations
**Status:** 🟢 Low
**Files:** Multiple test files

**Action Required:**
- Add return type annotations to functions
- Add parameter types where missing
- Improve code clarity and type safety

## General Development Tasks

### 10. Update Documentation
**Status:** 🟡 Medium
**Action Required:**
- Update README.md with current project status
- Update design.md with latest architecture changes
- Ensure all documentation is current

### 11. Security Review
**Status:** 🟡 Medium
**Action Required:**
- Review .env file for exposed secrets
- Implement proper environment variable management
- Add security testing to CI/CD pipeline

### 12. Performance Optimization
**Status:** 🟢 Low
**Action Required:**
- Review and optimize database queries
- Implement caching strategies
- Add performance monitoring

## Completed Tasks

### ✅ Initial Project Setup
- Basic project structure created
- Docker configuration implemented
- Basic CI/CD pipeline setup

### ✅ Core Features Implementation
- User authentication system
- Game lobby functionality
- Real-time game mechanics
- Question management system

## Task Priority Legend

- 🔴 **Critical**: Must be fixed immediately, blocking development
- 🟡 **High**: Should be fixed soon, affects functionality
- 🟡 **Medium**: Important but not blocking
- 🟢 **Low**: Nice to have, can be done later

## Notes

- Total TypeScript errors found: 228 across 26 files
- Most critical issues are in backend repository tests
- Frontend tests have fewer critical issues but need cleanup
- Security review needed for exposed API keys in .env file 