// Custom Error Classes for standardized error handling

export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class RequestTooLargeError extends AppError {
  constructor(message = 'Request entity too large') {
    super(message, 413, 'REQUEST_TOO_LARGE');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service unavailable', service = null) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

// Helper function to check if error is operational
export const isOperationalError = (error) => {
  return error instanceof AppError && error.isOperational;
};

// Helper function to get error response format
export const getErrorResponse = (error) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.errorCode || error.name,
      message: error.message,
      statusCode: error.statusCode,
      ...(error.field && { field: error.field }),
      ...(error.resource && { resource: error.resource }),
      ...(error.retryAfter && { retryAfter: error.retryAfter }),
      ...(process.env.NODE_ENV === 'development' && error.stack && { stack: error.stack })
    };
  }

  return {
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && error.stack && { stack: error.stack })
  };
}; 