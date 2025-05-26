# Operational Guidelines

## Coding Standards

- Adhere to standard JavaScript/Node.js style guides (e.g., Airbnb or Google, specify which one later).
- Use JSDoc for documenting functions, classes, and modules.
- Write clear, concise, and readable code.
- Avoid deeply nested callbacks; prefer async/await.

## Testing Strategy

- Implement unit tests for individual functions and modules.
- Implement integration tests for interactions between modules and services (e.g., API endpoints, Socket.IO handlers, database interactions).
- Aim for high test coverage.
- Tests should be automated and runnable via a single command.

## Error Handling

- Implement centralized error handling middleware for Express servers.
- Use structured logging for errors, including context (e.g., user ID, request details).
- Propagate errors appropriately from lower-level functions to handlers.
- Provide meaningful error responses to clients without exposing sensitive information.

## Security

- Sanitize and validate all user inputs.
- Use parameterized queries or ORMs for database interactions to prevent injection attacks.
- Implement appropriate authentication and authorization checks for all sensitive operations.
- Protect against common web vulnerabilities (CSRF, XSS, etc.) using middleware (e.g., Helmet, csurf).
- Store sensitive configuration information securely (e.g., using environment variables, not in code).
- Be mindful of potential security risks in real-time communication via Socket.IO. 