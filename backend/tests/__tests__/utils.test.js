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

import { mockPrisma, resetDbMocks } from '../mocks/dbMock.js';

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

let executeQuery, executeTransaction, sendSuccess, sendError, sendNotFound, asyncHandler;

beforeAll(async () => {
  const dbService = await import('../../utils/dbService.js');
  executeQuery = dbService.executeQuery;
  executeTransaction = dbService.executeTransaction;
  const responseHandler = await import('../../utils/responseHandler.js');
  sendSuccess = responseHandler.sendSuccess;
  sendError = responseHandler.sendError;
  sendNotFound = responseHandler.sendNotFound;
  asyncHandler = (await import('../../utils/controllerWrapper.js')).asyncHandler;
});

describe('Database Service', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('should execute a query successfully', async () => {
      const mockResult = [{ id: 1, name: 'test' }];
      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResult);

      const result = await executeQuery('SELECT * FROM test', [1, 'test']);

      expect(result).toEqual(mockResult);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT * FROM test', 1, 'test');
    });

    it('should handle query errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.$queryRawUnsafe.mockRejectedValue(dbError);

      await expect(executeQuery('SELECT * FROM test', []))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle empty parameters', async () => {
      const mockResult = [{ id: 1 }];
      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResult);

      const result = await executeQuery('SELECT * FROM test', []);

      expect(result).toEqual(mockResult);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT * FROM test');
    });
  });

  describe('executeTransaction', () => {
    it('should execute a transaction successfully', async () => {
      const operations = [
        {
          query: 'SELECT * FROM test1',
          params: [],
          operation: 'SELECT',
          table: 'test1'
        },
        {
          query: 'SELECT * FROM test2',
          params: [1],
          operation: 'SELECT',
          table: 'test2'
        }
      ];

      const mockResults = [[{ id: 1 }], [{ id: 2 }]];
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          $queryRawUnsafe: jest.fn()
            .mockResolvedValueOnce(mockResults[0])
            .mockResolvedValueOnce(mockResults[1])
        };
        return await callback(mockTx);
      });

      const result = await executeTransaction(operations);

      expect(result).toEqual(mockResults);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      const operations = [
        {
          query: 'SELECT * FROM test',
          params: [],
          operation: 'SELECT',
          table: 'test'
        }
      ];

      const transactionError = new Error('Transaction failed');
      mockPrisma.$transaction.mockRejectedValue(transactionError);

      await expect(executeTransaction(operations))
        .rejects
        .toThrow('Transaction failed');
    });
  });
});

describe('Response Handler', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('sendSuccess', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'test' };
      sendSuccess(res, data, 'Success message', 200);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Success message'
      });
    });

    it('should create a success response without message', () => {
      const data = { id: 1 };
      sendSuccess(res, data);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Success'
      });
    });

    it('should create a success response with custom status', () => {
      const data = { id: 1 };
      sendSuccess(res, data, 'Created', 201);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Created'
      });
    });
  });

  describe('sendError', () => {
    it('should create an error response', () => {
      const error = 'Something went wrong';
      sendError(res, error, 'Error occurred', 500);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error occurred',
        details: undefined
      });
    });

    it('should create an error response with default message', () => {
      const error = 'Bad request';
      sendError(res, error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error occurred',
        details: undefined
      });
    });
  });

  describe('sendNotFound', () => {
    it('should create a not found response', () => {
      sendNotFound(res, 'Resource not found');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not Found',
        message: 'Resource not found not found'
      });
    });

    it('should create a not found response with default message', () => {
      sendNotFound(res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not Found',
        message: 'Resource not found'
      });
    });
  });
});

describe('Controller Wrapper', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/tickets',
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful async operations', async () => {
    const mockController = jest.fn().mockResolvedValue({ data: 'test' });
    const wrappedController = asyncHandler(mockController);

    await wrappedController(mockReq, mockRes, mockNext);

    expect(mockController).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle controller errors', async () => {
    const error = new Error('Controller error');
    const mockController = jest.fn().mockRejectedValue(error);
    const wrappedController = asyncHandler(mockController);

    await wrappedController(mockReq, mockRes, mockNext);

    expect(mockController).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should handle synchronous errors', async () => {
    const error = new Error('Sync error');
    const mockController = jest.fn().mockRejectedValue(error);
    const wrappedController = asyncHandler(mockController);

    await wrappedController(mockReq, mockRes, mockNext);

    expect(mockController).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should handle non-Error objects', async () => {
    const error = 'String error';
    const mockController = jest.fn().mockRejectedValue(error);
    const wrappedController = asyncHandler(mockController);

    await wrappedController(mockReq, mockRes, mockNext);

    expect(mockController).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});

// Mock response object for testing
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis()
};

beforeEach(() => {
  res.status.mockClear();
  res.json.mockClear();
  res.send.mockClear();
}); 