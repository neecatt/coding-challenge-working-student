import request from 'supertest';
import bcrypt from 'bcryptjs';
import { prisma } from '../setup.js';

// Import your app (you'll need to export it from index.js)
let app;
let testOrg1, testOrg2;

beforeAll(async () => {
  // Import the app
  const { default: expressApp } = await import('../../index.js');
  app = expressApp;
  
  // Clean up database before tests
  await prisma.refreshToken.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organisation.deleteMany();
  
  // Create test organizations (let auto-increment handle IDs)
  const org1 = await prisma.organisation.create({
    data: { name: 'Test Org 1' }
  });
  const org2 = await prisma.organisation.create({
    data: { name: 'Test Org 2' }
  });

  // Set the organization references
  testOrg1 = org1;
  testOrg2 = org2;
});

afterAll(async () => {
  // Disconnect is handled in setup.js
});

describe('Authentication Endpoints', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
        organisationId: testOrg1.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully.');
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test2@example.com',
        password: 'weak',
        organisationId: testOrg1.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Password does not meet strength requirements.');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        name: 'Test User 2',
        email: 'test@example.com', // Same email as above
        password: 'SecurePass123!',
        organisationId: testOrg1.id
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('message', 'Email already in use.');
    });

    it('should reject registration with missing fields', async () => {
      const userData = {
        name: 'Test User',
        email: 'test3@example.com'
        // Missing password and organisationId
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'All fields are required.');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Clean up the test user and refresh tokens if they exist
      await prisma.refreshToken.deleteMany({ where: { user: { email: 'login@example.com' } } });
      await prisma.user.deleteMany({ where: { email: 'login@example.com' } });
      // Create a test user for login tests
      const hashedPassword = await bcrypt.hash('SecurePass123!', 12);
      testUser = await prisma.user.create({
        data: {
          name: 'Login Test User',
          email: 'login@example.com',
          password: hashedPassword,
          role: 'USER',
          organisationId: testOrg1.id
        }
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', loginData.email);
      expect(response.body.user).toHaveProperty('role', 'USER');

      // Store tokens for other tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials.');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials.');
    });

    it('should reject login with missing fields', async () => {
      const loginData = {
        email: 'login@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Email and password are required.');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Clean up any existing refresh tokens for this user
      await prisma.refreshToken.deleteMany({ where: { user: { email: 'login@example.com' } } });
      // Login to get a fresh access token for each test
      const loginData = {
        email: 'login@example.com',
        password: 'SecurePass123!'
      };
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      accessToken = response.body.accessToken;
    });
    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name', 'Login Test User');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
      expect(response.body.user).toHaveProperty('role', 'USER');
      expect(response.body.user).toHaveProperty('organisationId', testOrg1.id);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      // Clean up any existing refresh tokens for this user
      await prisma.refreshToken.deleteMany({ where: { user: { email: 'login@example.com' } } });
      // Login to get a fresh refresh token for each test
      const loginData = {
        email: 'login@example.com',
        password: 'SecurePass123!'
      };
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).not.toBe(accessToken); // Should be different
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid or expired refresh token.');
    });

    it('should reject refresh without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Refresh token required.');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully.');
    });

    it('should reject logout without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Refresh token required.');
    });
  });
}); 