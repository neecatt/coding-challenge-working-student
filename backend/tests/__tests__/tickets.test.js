import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

let app;

let org1, org2;

beforeAll(async () => {
  // Import the app
  const { default: expressApp } = await import('../../index.js');
  app = expressApp;
  
  // Clean up database before tests
  await prisma.refreshToken.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organisation.deleteMany();

  // Create test organizations (no explicit IDs)
  await prisma.organisation.createMany({
    data: [
      { name: 'Test Org 1' },
      { name: 'Test Org 2' }
    ]
  });
  // Fetch organizations to get their IDs
  const orgs = await prisma.organisation.findMany({ orderBy: { name: 'asc' } });
  org1 = orgs[0];
  org2 = orgs[1];
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Ticket Endpoints with Organization-Based Access Control', () => {
  let user1Token, user2Token, user3Token;
  let user1, user2, user3;
  let ticket1, ticket2, ticket3;

  beforeEach(async () => {
    // Clean up tickets and users before each test
    await prisma.refreshToken.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await bcrypt.hash('SecurePass123!', 12);
    
    user1 = await prisma.user.create({
      data: {
        name: 'User 1',
        email: 'user1@org1.com',
        password: hashedPassword,
        role: 'USER',
        organisationId: org1.id
      }
    });

    user2 = await prisma.user.create({
      data: {
        name: 'User 2',
        email: 'user2@org1.com',
        password: hashedPassword,
        role: 'USER',
        organisationId: org1.id
      }
    });

    user3 = await prisma.user.create({
      data: {
        name: 'User 3',
        email: 'user3@org2.com',
        password: hashedPassword,
        role: 'USER',
        organisationId: org2.id
      }
    });

    // Create test tickets
    ticket1 = await prisma.ticket.create({
      data: {
        title: 'Ticket 1 - Org 1',
        description: 'First ticket in organization 1',
        status: 'open',
        userId: user1.id,
        organisationId: org1.id
      }
    });

    ticket2 = await prisma.ticket.create({
      data: {
        title: 'Ticket 2 - Org 1',
        description: 'Second ticket in organization 1',
        status: 'pending',
        userId: user2.id,
        organisationId: org1.id
      }
    });

    ticket3 = await prisma.ticket.create({
      data: {
        title: 'Ticket 3 - Org 2',
        description: 'Ticket in organization 2',
        status: 'open',
        userId: user3.id,
        organisationId: org2.id
      }
    });

    // Login users to get tokens
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user1@org1.com',
        password: 'SecurePass123!'
      });
    user1Token = login1.body.accessToken;

    const login2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2@org1.com',
        password: 'SecurePass123!'
      });
    user2Token = login2.body.accessToken;

    const login3 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user3@org2.com',
        password: 'SecurePass123!'
      });
    user3Token = login3.body.accessToken;
  });

  describe('GET /api/tickets', () => {
    it('should return all tickets from user\'s organization', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(2); // Should see 2 tickets from org 1
      expect(response.body.data.tickets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: ticket1.id,
            title: 'Ticket 1 - Org 1',
            organisation_id: org1.id
          }),
          expect.objectContaining({
            id: ticket2.id,
            title: 'Ticket 2 - Org 1',
            organisation_id: org1.id
          })
        ])
      );
    });

    it('should not return tickets from other organizations', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Should not see ticket3 (from org 2)
      const org2Tickets = response.body.data.tickets.filter(ticket => ticket.organisation_id === org2.id);
      expect(org2Tickets).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/tickets?status=open')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data.tickets).toHaveLength(1);
      expect(response.body.data.tickets[0].status).toBe('open');
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should return ticket from user\'s organization', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket1.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', ticket1.id);
      expect(response.body.data).toHaveProperty('organisation_id', org1.id);
    });

    it('should allow user to access other user\'s ticket in same organization', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket2.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', ticket2.id);
    });

    it('should deny access to ticket from other organization', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket3.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. You can only view tickets from your organization.');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket1.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('POST /api/tickets', () => {
    it('should create ticket in user\'s organization', async () => {
      const ticketData = {
        title: 'New Test Ticket',
        description: 'A new test ticket',
        status: 'open'
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(ticketData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', ticketData.title);
      expect(response.body.data).toHaveProperty('organisation_id', org1.id);
      expect(response.body.data).toHaveProperty('user_id', user1.id);
    });

    it('should require authentication', async () => {
      const ticketData = {
        title: 'New Test Ticket',
        description: 'A new test ticket'
      };

      const response = await request(app)
        .post('/api/tickets')
        .send(ticketData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should require title field', async () => {
      const ticketData = {
        description: 'A new test ticket without title'
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(ticketData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields: title');
    });
  });

  describe('PATCH /api/tickets/:id', () => {
    it('should update ticket in user\'s organization', async () => {
      const updateData = {
        title: 'Updated Ticket Title',
        status: 'closed'
      };

      const response = await request(app)
        .patch(`/api/tickets/${ticket1.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('status', updateData.status);
    });

    it('should allow user to update other user\'s ticket in same organization', async () => {
      const updateData = {
        status: 'in_progress'
      };

      const response = await request(app)
        .patch(`/api/tickets/${ticket2.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status', updateData.status);
    });

    it('should deny update to ticket from other organization', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .patch(`/api/tickets/${ticket3.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. You can only update tickets from your organization.');
    });

    it('should require authentication', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .patch(`/api/tickets/${ticket1.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('should delete ticket in user\'s organization', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket1.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      // Verify ticket is deleted
      const deletedTicket = await prisma.ticket.findUnique({
        where: { id: ticket1.id }
      });
      expect(deletedTicket).toBeNull();
    });

    it('should allow user to delete other user\'s ticket in same organization', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket2.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);

      // Verify ticket is deleted
      const deletedTicket = await prisma.ticket.findUnique({
        where: { id: ticket2.id }
      });
      expect(deletedTicket).toBeNull();
    });

    it('should deny delete to ticket from other organization', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket3.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. You can only delete tickets from your organization.');

      // Verify ticket still exists
      const existingTicket = await prisma.ticket.findUnique({
        where: { id: ticket3.id }
      });
      expect(existingTicket).not.toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticket1.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('Cross-Organization Access Tests', () => {
    it('should isolate organizations completely', async () => {
      // User 3 (org 2) should only see their own ticket
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(200);

      expect(response.body.data.tickets).toHaveLength(1);
      expect(response.body.data.tickets[0].id).toBe(ticket3.id);
      expect(response.body.data.tickets[0].organisation_id).toBe(org2.id);
    });

    it('should prevent cross-organization ticket access', async () => {
      // User 3 trying to access User 1's ticket
      const response = await request(app)
        .get(`/api/tickets/${ticket1.id}`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied. You can only view tickets from your organization.');
    });
  });
}); 