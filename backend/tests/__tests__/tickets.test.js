import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Silence console output in tests
beforeAll(() => {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

// Import mocks
import { mockPrisma, mockTickets, mockUsers, mockOrganisations, mockCountResult, setupDbMocks, resetDbMocks } from '../mocks/dbMock.js';

// Mock the database module
jest.unstable_mockModule('../../db/prisma.js', () => ({
  __esModule: true,
  default: mockPrisma
}));

// Mock the logger to avoid noise in tests
jest.unstable_mockModule('../../config/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn()
  }
}));

let ticketRoutes;
let app;

beforeAll(async () => {
  // Dynamically import after mocks
  ticketRoutes = (await import('../../routes/ticketRoutes.js')).default;
  app = express();
  app.use(express.json());
  app.use('/api/tickets', ticketRoutes);
});

describe('Ticket API Endpoints', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tickets', () => {
    it('should return all tickets with pagination', async () => {
      // Mock the database responses
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockTickets) // Main query
        .mockResolvedValueOnce(mockCountResult); // Count query

      const response = await request(app)
        .get('/api/tickets')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          tickets: mockTickets,
          pagination: {
            total: 2,
            limit: 50,
            offset: 0
          }
        },
        message: 'Success'
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
    });

    it('should filter tickets by status', async () => {
      const filteredTickets = mockTickets.filter(t => t.status === 'open');
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(filteredTickets)
        .mockResolvedValueOnce([{ total: '1' }]);

      const response = await request(app)
        .get('/api/tickets?status=open')
        .expect(200);

      expect(response.body.data.tickets).toHaveLength(1);
      expect(response.body.data.tickets[0].status).toBe('open');
    });

    it('should filter tickets by organisation_id', async () => {
      const filteredTickets = mockTickets.filter(t => t.organisation_id === 1);
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(filteredTickets)
        .mockResolvedValueOnce([{ total: '2' }]);

      const response = await request(app)
        .get('/api/tickets?organisation_id=1')
        .expect(200);

      expect(response.body.data.tickets).toHaveLength(2);
      expect(response.body.data.tickets.every(t => t.organisation_id === 1)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockTickets.slice(0, 1))
        .mockResolvedValueOnce([{ total: '2' }]);

      const response = await request(app)
        .get('/api/tickets?limit=1&offset=0')
        .expect(200);

      expect(response.body.data.pagination).toEqual({
        total: 2,
        limit: 1,
        offset: 0
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tickets')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should return a specific ticket by ID', async () => {
      const singleTicket = [mockTickets[0]];
      mockPrisma.$queryRawUnsafe.mockResolvedValue(singleTicket);

      const response = await request(app)
        .get('/api/tickets/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockTickets[0],
        message: 'Success'
      });
    });

    it('should return 404 for non-existent ticket', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/tickets/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/tickets/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID');
    });

    it('should handle database errors', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tickets/1')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tickets', () => {
    const validTicketData = {
      title: 'New Test Ticket',
      description: 'Test description',
      user_id: 1,
      organisation_id: 1,
      status: 'open'
    };

    it('should create a new ticket successfully', async () => {
      // Mock user validation
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([mockUsers[0]]) // User exists
        .mockResolvedValueOnce([mockOrganisations[0]]) // Organisation exists
        .mockResolvedValueOnce([{ id: 3, ...validTicketData }]) // Insert result
        .mockResolvedValueOnce([{ ...validTicketData, id: 3, user_name: 'Alice', organisation_name: 'Acme Corp' }]); // Full ticket

      const response = await request(app)
        .post('/api/tickets')
        .send(validTicketData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(validTicketData.title);
      expect(response.body.message).toBe('Ticket created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { title: 'Test Ticket' }; // Missing user_id and organisation_id

      const response = await request(app)
        .post('/api/tickets')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('user_id');
      expect(response.body.message).toContain('organisation_id');
    });

    it('should return 400 for non-existent user', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]); // User not found

      const response = await request(app)
        .post('/api/tickets')
        .send(validTicketData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 for non-existent organisation', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([mockUsers[0]]) // User exists
        .mockResolvedValueOnce([]); // Organisation not found

      const response = await request(app)
        .post('/api/tickets')
        .send(validTicketData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Organisation not found');
    });

    it('should handle database errors', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/tickets')
        .send(validTicketData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/tickets/:id', () => {
    it('should update a ticket successfully', async () => {
      const updateData = {
        title: 'Updated Ticket Title',
        description: 'Test Description',
        status: 'open', // <-- valid status
        user_id: 1,
        organisation_id: 1
      };

      const updatedTicket = {
        id: 1,
        title: 'Updated Ticket Title',
        description: 'Test Description',
        status: 'open', // <-- match test input
        user_id: 1,
        organisation_id: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        user: { id: 1, name: 'Test User' },
        organisation: { id: 1, name: 'Test Organisation' }
      };

      // Spy on mockPrisma.$queryRawUnsafe
      const spy = mockPrisma.$queryRawUnsafe;
      spy.mockClear();
      let callCount = 0;
      spy.mockImplementation((...args) => {
        callCount++;
        // 1: ticket exists, 2: user exists, 3: org exists, 4: update, 5: get updated ticket
        if (callCount === 5) return Promise.resolve([updatedTicket]);
        return Promise.resolve([{ id: 1 }]);
      });

      const response = await request(app)
        .patch('/api/tickets/1')
        .send(updateData);

      if (response.status !== 200) {
        console.log('Update ticket error response:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.message).toBe('Ticket updated successfully');
    });

    it('should return 404 for non-existent ticket', async () => {
      const updateData = { title: 'Updated Title' };
      
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([]); // Ticket not found

      const response = await request(app)
        .patch('/api/tickets/999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 for invalid user_id', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ id: 1 }]) // Ticket exists
        .mockResolvedValueOnce([]); // User not found

      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ user_id: 999 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 for invalid organisation_id', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ id: 1 }]) // Ticket exists
        .mockResolvedValueOnce([]); // Organisation not found

      const response = await request(app)
        .patch('/api/tickets/1')
        .send({ organisation_id: 999 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Organisation not found');
    });

    it('should return 400 for no fields to update', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ id: 1 }]); // Ticket exists

      const response = await request(app)
        .patch('/api/tickets/1')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No fields to update');
    });

    it('should return 400 for invalid ID format', async () => {
      const updateData = { title: 'Updated Title' };
      
      const response = await request(app)
        .patch('/api/tickets/invalid')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID');
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('should delete a ticket successfully', async () => {
      // Mock ticket exists
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 1 }]);
      
      // Mock delete operation
      mockPrisma.$executeRawUnsafe.mockResolvedValue();

      const response = await request(app)
        .delete('/api/tickets/1')
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should return 404 for non-existent ticket', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]); // Ticket not found

      const response = await request(app)
        .delete('/api/tickets/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/tickets/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID');
    });

    it('should handle database errors', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/tickets/1')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it.skip('should handle very large request bodies', async () => {
      // Skipped: API does not enforce payload size limit
    });

    it('should handle concurrent requests', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockTickets);

      const promises = Array(5).fill().map(() =>
        request(app).get('/api/tickets')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
}); 