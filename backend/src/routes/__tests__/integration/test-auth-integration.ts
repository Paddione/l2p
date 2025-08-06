import request from 'supertest';
import { app } from '../../server.js';
import { DatabaseService } from '../../services/DatabaseService.js';
import { AuthService } from '../../services/AuthService.js';
import { EmailService } from '../../services/EmailService.js';
import { CharacterService } from '../../services/CharacterService.js';

describe('Authentication System - API Integration Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthService;
  let emailService: EmailService;
  let characterService: CharacterService;

  beforeAll(async () => {
    dbService = new DatabaseService();
    await dbService.initialize();
    
    authService = new AuthService();
    emailService = new EmailService();
    characterService = new CharacterService();
  });

  afterAll(async () => {
    await dbService.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await dbService.query('DELETE FROM password_reset_tokens');
    await dbService.query('DELETE FROM email_verification_tokens');
    await dbService.query('DELETE FROM users');
  });

  describe('Complete Authentication Flow Integration', () => {
    it('should handle complete user registration and verification flow', async () => {
      // Step 1: Register user
      const userData = {
        username: 'integrationtest',
        email: 'integration@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('userId');
      expect(registerResponse.body).toHaveProperty('message');

      // Verify user was created in database
      const user = await dbService.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(user.rows[0]).toBeDefined();
      expect(user.rows[0].email_verified).toBe(false);
      expect(user.rows[0].character_id).toBe(userData.characterId);

      // Verify verification token was created
      const token = await dbService.query(
        'SELECT * FROM email_verification_tokens WHERE email = $1',
        [userData.email]
      );
      expect(token.rows[0]).toBeDefined();

      // Step 2: Verify email
      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: token.rows[0].token })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('token');
      expect(verifyResponse.body).toHaveProperty('message');

      // Verify user is now verified
      const verifiedUser = await dbService.query(
        'SELECT email_verified FROM users WHERE email = $1',
        [userData.email]
      );
      expect(verifiedUser.rows[0].email_verified).toBe(true);

      // Step 3: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user.email_verified).toBe(true);

      // Step 4: Access protected endpoint
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('user');
      expect(profileResponse.body.user.username).toBe(userData.username);
    });

    it('should handle password reset flow integration', async () => {
      // Create a verified user first
      const userData = {
        username: 'resetuser',
        email: 'reset@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = await dbService.query(
        'SELECT token FROM email_verification_tokens WHERE email = $1',
        [userData.email]
      );
      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: token.rows[0].token })
        .expect(200);

      // Step 1: Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: userData.email })
        .expect(200);

      expect(resetRequestResponse.body).toHaveProperty('message');

      // Verify reset token was created
      const resetToken = await dbService.query(
        'SELECT * FROM password_reset_tokens WHERE email = $1',
        [userData.email]
      );
      expect(resetToken.rows[0]).toBeDefined();

      // Step 2: Reset password
      const newPassword = 'NewPassword123!';
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken.rows[0].token,
          newPassword
        })
        .expect(200);

      expect(resetResponse.body).toHaveProperty('message');

      // Step 3: Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });
  });

  describe('Character System Integration', () => {
    it('should handle character selection and progression integration', async () => {
      // Create and verify user
      const userData = {
        username: 'characteruser',
        email: 'character@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = await dbService.query(
        'SELECT token FROM email_verification_tokens WHERE email = $1',
        [userData.email]
      );
      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: token.rows[0].token })
        .expect(200);

      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200);

      const authToken = loginResponse.body.token;

      // Get available characters
      const charactersResponse = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(charactersResponse.body).toHaveProperty('characters');
      expect(Array.isArray(charactersResponse.body.characters)).toBe(true);
      expect(charactersResponse.body.characters.length).toBeGreaterThan(0);

      // Update character
      const updateResponse = await request(app)
        .put('/api/characters/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ characterId: 2 })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('message');

      // Verify character was updated in database
      const updatedUser = await dbService.query(
        'SELECT character_id FROM users WHERE username = $1',
        [userData.username]
      );
      expect(updatedUser.rows[0].character_id).toBe(2);

      // Simulate experience gain
      const experienceGain = 100;
      await dbService.query(
        'UPDATE users SET experience_points = experience_points + $1 WHERE username = $2',
        [experienceGain, userData.username]
      );

      // Get updated profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.user).toHaveProperty('experience_points');
      expect(profileResponse.body.user).toHaveProperty('character_level');
      expect(profileResponse.body.user.experience_points).toBeGreaterThan(0);
    });
  });

  describe('Service Integration Tests', () => {
    it('should integrate AuthService with EmailService', async () => {
      const userData = {
        username: 'serviceuser',
        email: 'service@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      // Test registration with service integration
      const result = await authService.registerUser(userData);
      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();

      // Verify email service was called (verification token created)
      const token = await dbService.query(
        'SELECT * FROM email_verification_tokens WHERE email = $1',
        [userData.email]
      );
      expect(token.rows[0]).toBeDefined();

      // Test email verification with service integration
      const verifyResult = await authService.verifyEmail(token.rows[0].token);
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.token).toBeDefined();

      // Test login with service integration
      const loginResult = await authService.loginUser(userData.username, userData.password);
      expect(loginResult.success).toBe(true);
      expect(loginResult.token).toBeDefined();
    });

    it('should integrate CharacterService with AuthService', async () => {
      // Create user
      const userData = {
        username: 'characterserviceuser',
        email: 'characterservice@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      await authService.registerUser(userData);

      // Get verification token and verify email
      const token = await dbService.query(
        'SELECT token FROM email_verification_tokens WHERE email = $1',
        [userData.email]
      );
      await authService.verifyEmail(token.rows[0].token);

      // Test character service integration
      const characters = await characterService.getAvailableCharacters();
      expect(characters.length).toBeGreaterThan(0);

      // Update character
      const updateResult = await characterService.updateUserCharacter(userData.username, 2);
      expect(updateResult.success).toBe(true);

      // Verify character was updated
      const user = await dbService.query(
        'SELECT character_id FROM users WHERE username = $1',
        [userData.username]
      );
      expect(user.rows[0].character_id).toBe(2);
    });
  });

  describe('Database Transaction Integration', () => {
    it('should handle database transactions properly during registration', async () => {
      const userData = {
        username: 'transactionuser',
        email: 'transaction@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      // Start transaction
      const client = await dbService.getClient();
      await client.query('BEGIN');

      try {
        // Register user within transaction
        const result = await authService.registerUser(userData, client);
        expect(result.success).toBe(true);

        // Verify user exists within transaction
        const user = await client.query(
          'SELECT * FROM users WHERE email = $1',
          [userData.email]
        );
        expect(user.rows[0]).toBeDefined();

        // Verify verification token exists within transaction
        const token = await client.query(
          'SELECT * FROM email_verification_tokens WHERE email = $1',
          [userData.email]
        );
        expect(token.rows[0]).toBeDefined();

        // Commit transaction
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Verify data persists after transaction
      const user = await dbService.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(user.rows[0]).toBeDefined();
    });

    it('should rollback transaction on error', async () => {
      const userData = {
        username: 'rollbackuser',
        email: 'rollback@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      const client = await dbService.getClient();
      await client.query('BEGIN');

      try {
        // Register user
        await authService.registerUser(userData, client);

        // Intentionally cause an error
        await client.query('INSERT INTO non_existent_table (id) VALUES (1)');
      } catch (error) {
        await client.query('ROLLBACK');
        // Expected error, continue
      } finally {
        client.release();
      }

      // Verify data was rolled back
      const user = await dbService.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(user.rows.length).toBe(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle concurrent registration attempts', async () => {
      const userData = {
        username: 'concurrentuser',
        email: 'concurrent@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      // Attempt concurrent registrations
      const promises = [
        request(app).post('/api/auth/register').send(userData),
        request(app).post('/api/auth/register').send(userData),
        request(app).post('/api/auth/register').send(userData)
      ];

      const responses = await Promise.allSettled(promises);

      // One should succeed, others should fail with conflict
      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const conflicts = responses.filter(r => r.status === 'fulfilled' && r.value.status === 409);

      expect(successful.length).toBe(1);
      expect(conflicts.length).toBe(2);

      // Verify only one user was created
      const users = await dbService.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(users.rows.length).toBe(1);
    });

    it('should handle database connection failures gracefully', async () => {
      // Simulate database connection failure
      const originalQuery = dbService.query.bind(dbService);
      dbService.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const userData = {
        username: 'dbuser',
        email: 'db@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('error');

      // Restore original method
      dbService.query = originalQuery;
    });

    it('should handle email service failures gracefully', async () => {
      // Mock email service to fail
      const originalSendVerificationEmail = emailService.sendVerificationEmail.bind(emailService);
      emailService.sendVerificationEmail = jest.fn().mockRejectedValue(new Error('Email service failed'));

      const userData = {
        username: 'emailuser',
        email: 'email@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('error');

      // Restore original method
      emailService.sendVerificationEmail = originalSendVerificationEmail;
    });
  });

  describe('Security Integration Tests', () => {
    it('should prevent SQL injection attacks', async () => {
      const maliciousData = {
        username: "'; DROP TABLE users; --",
        email: "'; DROP TABLE users; --",
        password: 'TestPass123!',
        characterId: 1
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(400);

      expect(response.body).toHaveProperty('error');

      // Verify users table still exists
      const users = await dbService.query('SELECT COUNT(*) FROM users');
      expect(users.rows[0].count).toBeDefined();
    });

    it('should prevent XSS attacks in user input', async () => {
      const maliciousData = {
        username: '<script>alert("xss")</script>user',
        email: 'xss@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(201);

      // Verify input was sanitized
      const user = await dbService.query(
        'SELECT username FROM users WHERE email = $1',
        [maliciousData.email]
      );
      expect(user.rows[0].username).not.toContain('<script>');
    });

    it('should enforce rate limiting on authentication endpoints', async () => {
      const userData = {
        username: 'ratelimituser',
        email: 'ratelimit@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () =>
        request(app).post('/api/auth/register').send(userData)
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle authentication requests within performance limits', async () => {
      const startTime = Date.now();

      const userData = {
        username: 'perfuser',
        email: 'perf@example.com',
        password: 'TestPass123!',
        characterId: 1
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent authentication requests efficiently', async () => {
      const userCount = 5;
      const startTime = Date.now();

      const promises = Array.from({ length: userCount }, (_, i) => {
        const userData = {
          username: `concurrentperf${i}`,
          email: `concurrentperf${i}@example.com`,
          password: 'TestPass123!',
          characterId: 1
        };

        return request(app)
          .post('/api/auth/register')
          .send(userData);
      });

      const responses = await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle 5 concurrent registrations within 5 seconds
      expect(duration).toBeLessThan(5000);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });
}); 