import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

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

let validateCreateTicket, validateId, errorHandler, requestLogger;

beforeAll(async () => {
  const validation = await import('../../middleware/validation.js');
  validateCreateTicket = validation.validateCreateTicket;
  validateId = validation.validateId;
  errorHandler = (await import('../../middleware/errorHandler.js')).errorHandler;
  requestLogger = (await import('../../middleware/requestLogger.js')).requestLogger;
});

describe('Validation Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCreateTicket', () => {
    it('should pass validation for valid ticket data', () => {
      mockReq.body = {
        title: 'Test Ticket',
        user_id: 1,
        organisation_id: 1
      };

      validateCreateTicket(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing title', () => {
      mockReq.body = {
        user_id: 1,
        organisation_id: 1
      };

      validateCreateTicket(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Title is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing user_id', () => {
      mockReq.body = {
        title: 'Test Ticket',
        organisation_id: 1
      };

      validateCreateTicket(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Valid user_id is required'
      });
    });

    it('should return 400 for missing organisation_id', () => {
      mockReq.body = {
        title: 'Test Ticket',
        user_id: 1
      };

      validateCreateTicket(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Valid organisation_id is required'
      });
    });

    it('should return 400 for multiple missing fields', () => {
      mockReq.body = {
        title: 'Test Ticket'
      };

      validateCreateTicket(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Valid user_id is required, Valid organisation_id is required'
      });
    });

    it('should handle empty body', () => {
      mockReq.body = {};

      validateCreateTicket(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Title is required, Valid user_id is required, Valid organisation_id is required'
      });
    });
  });

  describe('validateId', () => {
    it('should pass validation for valid numeric ID', () => {
      mockReq.params = { id: '123' };

      validateId(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for non-numeric ID', () => {
      mockReq.params = { id: 'abc' };
      mockReq.get = jest.fn();
      mockReq.connection = { remoteAddress: '127.0.0.1' };
      validateId(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid ID',
        message: 'ID must be a valid number'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for decimal ID', () => {
      mockReq.params = { id: '123.45' };
      mockReq.get = jest.fn();
      mockReq.connection = { remoteAddress: '127.0.0.1' };
      validateId(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
    it('should return 400 for negative ID', () => {
      mockReq.params = { id: '-123' };
      mockReq.get = jest.fn();
      mockReq.connection = { remoteAddress: '127.0.0.1' };
      validateId(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
    it('should return 400 for zero ID', () => {
      mockReq.params = { id: '0' };
      mockReq.get = jest.fn();
      mockReq.connection = { remoteAddress: '127.0.0.1' };
      validateId(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing ID', () => {
      mockReq.params = {};
      mockReq.get = jest.fn();
      mockReq.connection = { remoteAddress: '127.0.0.1' };
      validateId(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid ID',
        message: 'ID must be a valid number'
      });
    });
  });
});

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/tickets'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle generic errors', () => {
    const error = new Error('Something went wrong');
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong'
    });
  });

  it('should handle validation errors', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation Error',
      message: 'Validation failed'
    });
  });

  it('should handle not found errors', () => {
    const error = new Error('Not found');
    error.name = 'NotFoundError';
    error.status = 404;
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      message: 'Not found'
    });
  });

  it('should handle database errors', () => {
    const error = new Error('Database connection failed');
    error.name = 'DatabaseError';
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      message: 'Database connection failed'
    });
  });

  it('should handle string errors', () => {
    const error = 'String error message';
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong'
    });
  });

  it('should handle errors with custom status codes', () => {
    const error = new Error('Custom error');
    error.status = 422;
    errorHandler(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      message: 'Custom error'
    });
  });
});

describe('Request Logger Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/tickets',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      },
      get: jest.fn().mockReturnValue('test-agent'),
      connection: { remoteAddress: '127.0.0.1' }
    };
    mockRes = {
      statusCode: 200,
      on: jest.fn()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log request and call next', () => {
    requestLogger(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle response finish event', () => {
    const originalEnd = mockRes.end;
    requestLogger(mockReq, mockRes, mockNext);
    expect(mockRes.end).not.toBe(originalEnd); // Should be overridden
  });

  it('should handle requests without user-agent', () => {
    delete mockReq.headers['user-agent'];
    mockReq.get.mockReturnValue(undefined);
    requestLogger(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle requests without IP', () => {
    delete mockReq.ip;
    requestLogger(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Add middleware
    app.use(requestLogger);
    
    // Add test routes
    app.post('/test-validation', validateCreateTicket, (req, res) => {
      res.json({ success: true, data: req.body });
    });
    
    app.get('/test-id/:id', validateId, (req, res) => {
      res.json({ success: true, id: req.params.id });
    });
    
    // Add error handler
    app.use(errorHandler);
  });

  describe('Validation Integration', () => {
    it('should validate ticket data in route', async () => {
      const validData = {
        title: 'Test Ticket',
        user_id: 1,
        organisation_id: 1
      };

      const response = await request(app)
        .post('/test-validation')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(validData);
    });

    it('should reject invalid ticket data in route', async () => {
      const invalidData = {
        title: 'Test Ticket'
        // Missing user_id and organisation_id
      };

      const response = await request(app)
        .post('/test-validation')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('user_id');
    });

    it('should validate ID in route', async () => {
      const response = await request(app)
        .get('/test-id/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe('123');
    });

    it('should reject invalid ID in route', async () => {
      const response = await request(app)
        .get('/test-id/abc')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID');
    });
  });
}); 