import request from 'supertest'
import { app } from '../../server'
import { DatabaseService } from '../../services/DatabaseService'

describe('Authentication API', () => {
  const db = DatabaseService.getInstance()

  beforeEach(async () => {
    // Clean up database before each test
    await db.query('DELETE FROM users')
  })

  afterAll(async () => {
    await db.close()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'User registered successfully')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('id')
      expect(response.body.user).toHaveProperty('username', userData.username)
      expect(response.body.user).toHaveProperty('email', userData.email)
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should return 400 for invalid user data', async () => {
      const invalidData = {
        username: '',
        email: 'invalid-email',
        password: '123' // Too short
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 409 for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body).toHaveProperty('error', 'Username already exists')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      await request(app)
        .post('/api/auth/register')
        .send(userData)
    })

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('username', 'testuser')
    })

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should return 404 for non-existent user', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404)

      expect(response.body).toHaveProperty('error', 'User not found')
    })
  })

  describe('GET /api/auth/me', () => {
    let authToken: string
    let userId: string

    beforeEach(async () => {
      // Create and login a test user
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      await request(app)
        .post('/api/auth/register')
        .send(userData)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })

      authToken = loginResponse.body.token
      userId = loginResponse.body.user.id
    })

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('id', userId)
      expect(response.body.user).toHaveProperty('username', 'testuser')
    })

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'No token provided')
    })

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid token')
    })
  })
}) 