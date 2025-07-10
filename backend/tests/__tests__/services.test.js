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

import { mockPrisma, mockTickets, mockUsers, mockOrganisations, mockCountResult, resetDbMocks, setMockTickets } from '../mocks/dbMock.js';

// Mock the database module
jest.unstable_mockModule('../../db/prisma.js', () => ({
  __esModule: true,
  default: mockPrisma
}));

// Mock the logger
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

// Mock the logHelper
jest.unstable_mockModule('../../utils/logHelper.js', () => ({
  logBusinessEvent: jest.fn(),
  logDbOperation: jest.fn(),
  logError: jest.fn()
}));

let TicketService;

beforeAll(async () => {
  TicketService = (await import('../../services/ticketService.js')).TicketService;
});

describe('TicketService', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTickets', () => {
    it('should return tickets with pagination', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockTickets)
        .mockResolvedValueOnce(mockCountResult);

      const result = await TicketService.getTickets({}, 50, 0);

      expect(result).toEqual({
        tickets: mockTickets,
        pagination: {
          total: 2,
          limit: 50,
          offset: 0
        }
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
    });

    it('should apply filters correctly', async () => {
      const filters = { status: 'open', organisation_id: 1 };
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockTickets.filter(t => t.status === 'open'))
        .mockResolvedValueOnce([{ total: '1' }]);

      const result = await TicketService.getTickets(filters, 10, 0);

      expect(result.tickets).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should handle database errors', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      await expect(TicketService.getTickets({}, 50, 0))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getTicketById', () => {
    it('should return a ticket by ID', async () => {
      const singleTicket = [mockTickets[0]];
      mockPrisma.$queryRawUnsafe.mockResolvedValue(singleTicket);

      const result = await TicketService.getTicketById(1);

      expect(result).toEqual(mockTickets[0]);
    });

    it('should throw error for non-existent ticket', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await expect(TicketService.getTicketById(999))
        .rejects
        .toThrow('Ticket not found');
    });

    it('should handle database errors', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      await expect(TicketService.getTicketById(1))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('createTicket', () => {
    const validTicketData = {
      title: 'New Test Ticket',
      description: 'Test description',
      user_id: 1,
      organisation_id: 1,
      status: 'open'
    };

    it('should create a ticket successfully', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([mockUsers[0]]) // User exists
        .mockResolvedValueOnce([mockOrganisations[0]]) // Organisation exists
        .mockResolvedValueOnce([{ id: 3, ...validTicketData }]) // Insert result
        .mockResolvedValueOnce([{ ...validTicketData, id: 3, user_name: 'Alice', organisation_name: 'Acme Corp' }]); // Full ticket

      const result = await TicketService.createTicket(validTicketData);

      expect(result.title).toBe(validTicketData.title);
      expect(result.user_name).toBe('Alice');
      expect(result.organisation_name).toBe('Acme Corp');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]); // User not found

      await expect(TicketService.createTicket(validTicketData))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error for non-existent organisation', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([mockUsers[0]]) // User exists
        .mockResolvedValueOnce([]); // Organisation not found

      await expect(TicketService.createTicket(validTicketData))
        .rejects
        .toThrow('Organisation not found');
    });

    it('should handle database errors', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Database error'));

      await expect(TicketService.createTicket(validTicketData))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('updateTicket', () => {
    it('should update a ticket successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        status: 'in_progress'
      };

      const updatedTicket = {
        ...mockTickets[0],
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Mock the complete update flow
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ id: 1 }]) // Ticket exists check
        .mockResolvedValueOnce([]) // UPDATE operation (returns empty array)
        .mockResolvedValueOnce([updatedTicket]); // Get updated ticket after update

      const result = await TicketService.updateTicket(1, updateData);
      expect(result.title).toBe(updateData.title);
      expect(result.status).toBe(updateData.status);
    });

    it('should throw error for non-existent ticket', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([]); // Ticket not found

      await expect(TicketService.updateTicket(999, { title: 'Updated' }))
        .rejects
        .toThrow('Ticket not found');
    });

    it('should throw error for invalid update data', async () => {
      const invalidData = { invalid_field: 'value' };

      await expect(TicketService.updateTicket(1, invalidData))
        .rejects
        .toThrow('No fields to update');
    });
  });

  describe('deleteTicket', () => {
    it('should delete a ticket successfully', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ id: 1 }]) // Ticket exists
        .mockResolvedValueOnce([]); // DELETE operation (returns empty array)
      
      const result = await TicketService.deleteTicket(1);
      expect(result).toBe(true);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should throw error for non-existent ticket', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([]); // Ticket not found

      await expect(TicketService.deleteTicket(999))
        .rejects
        .toThrow('Ticket not found');
    });
  });
}); 