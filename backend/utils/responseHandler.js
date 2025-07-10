import { logError } from './logHelper.js';
import { getErrorResponse, AppError } from './errors.js';

// Utility functions for consistent API responses

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

export const sendError = (res, error, message = null, statusCode = null) => {
  // Log the error with context
  logError(message || error.message, error, {
    endpoint: res.req?.originalUrl,
    method: res.req?.method,
    ip: res.req?.ip,
    userAgent: res.req?.get('User-Agent'),
    userId: res.req?.user?.id
  });

  const errorResponse = getErrorResponse(error);
  const responseData = {
    ...errorResponse,
    message: message || errorResponse.message,
    timestamp: new Date().toISOString()
  };

  const status = statusCode || errorResponse.statusCode || 500;
  return res.status(status).json(responseData);
};

export const sendNotFound = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `${resource} not found`,
    resource,
    timestamp: new Date().toISOString()
  });
};

export const sendValidationError = (res, errors, field = null) => {
  const message = Array.isArray(errors) ? errors.join(', ') : errors;
  return res.status(400).json({
    success: false,
    error: 'VALIDATION_ERROR',
    message,
    ...(field && { field }),
    timestamp: new Date().toISOString()
  });
};

export const sendUnauthorized = (res, message = 'Authentication required') => {
  return res.status(401).json({
    success: false,
    error: 'UNAUTHORIZED',
    message,
    timestamp: new Date().toISOString()
  });
};

export const sendForbidden = (res, message = 'Access denied') => {
  return res.status(403).json({
    success: false,
    error: 'FORBIDDEN',
    message,
    timestamp: new Date().toISOString()
  });
};

export const sendConflict = (res, message = 'Resource already exists') => {
  return res.status(409).json({
    success: false,
    error: 'CONFLICT',
    message,
    timestamp: new Date().toISOString()
  });
};

export const sendRateLimit = (res, message = 'Too many requests', retryAfter = null) => {
  return res.status(429).json({
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message,
    ...(retryAfter && { retryAfter }),
    timestamp: new Date().toISOString()
  });
};

export const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res) => {
  return res.status(204).send();
};

// Helper function to handle any error and send appropriate response
export const handleError = (res, error, defaultMessage = 'An error occurred') => {
  if (error instanceof AppError) {
    return sendError(res, error);
  }

  // Handle known error types
  if (error.code === 'P2002') {
    return sendConflict(res, 'A record with this information already exists');
  }

  if (error.code === 'P2025') {
    return sendNotFound(res, 'Record');
  }

  if (error.name === 'ValidationError') {
    return sendValidationError(res, error.message);
  }

  if (error.name === 'CastError') {
    return sendValidationError(res, 'Invalid ID format');
  }

  // Default error handling
  return sendError(res, error, defaultMessage);
}; 