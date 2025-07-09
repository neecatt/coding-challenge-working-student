import { jest } from '@jest/globals';
// Database mocks for testing
export const mockPrisma = {
  $queryRawUnsafe: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock ticket data
export let mockTickets = [
  {
    id: 1,
    title: 'Test Ticket 1',
    description: 'Test description 1',
    status: 'open',
    created_at: '2024-01-15T10:00:00.000Z',
    user_id: 1,
    organisation_id: 1,
    user_name: 'Alice',
    organisation_name: 'Acme Corp'
  },
  {
    id: 2,
    title: 'Test Ticket 2',
    description: 'Test description 2',
    status: 'closed',
    created_at: '2024-01-15T11:00:00.000Z',
    user_id: 2,
    organisation_id: 1,
    user_name: 'Bob',
    organisation_name: 'Acme Corp'
  }
];

export function setMockTickets(tickets) {
  mockTickets = tickets;
}
// Mock users
export const mockUsers = [
  { id: 1, name: 'Alice', organisation_id: 1 },
  { id: 2, name: 'Bob', organisation_id: 1 },
  { id: 3, name: 'Carol', organisation_id: 2 }
];

// Mock organisations
export const mockOrganisations = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Globex Inc' }
];

// Mock count results
export const mockCountResult = [{ total: '2' }];

// Setup default mocks
export const setupDbMocks = () => {
  // Default query mock
  mockPrisma.$queryRawUnsafe.mockResolvedValue(mockTickets);
  
  // Default execute mock
  mockPrisma.$executeRawUnsafe.mockResolvedValue();
  
  // Default transaction mock
  mockPrisma.$transaction.mockImplementation(async (callback) => {
    return await callback(mockPrisma);
  });
};

// Reset all mocks
export const resetDbMocks = () => {
  jest.clearAllMocks();
  setupDbMocks();
}; 