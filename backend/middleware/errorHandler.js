import logger from '../config/logger.js';
import { handleError } from '../utils/responseHandler.js';
import { isOperationalError, getErrorResponse } from '../utils/errors.js';

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Log error with detailed context
  logger.error('Global error handler caught error:', {
    error: {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      isOperational: isOperationalError(err)
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query,
      params: req.params
    },
    timestamp: new Date().toISOString()
  });

  // Use standardized error handling
  return handleError(res, err);
};

// 404 handler for undefined routes
export const notFound = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    error: 'ROUTE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
};

// Unhandled rejection handler
export const handleUnhandledRejection = (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? {
      message: reason.message,
      name: reason.name,
      stack: reason.stack
    } : reason,
    promise: promise,
    timestamp: new Date().toISOString()
  });

  if (process.env.NODE_ENV === 'production') {
    logger.error('Shutting down server due to unhandled promise rejection');
    process.exit(1);
  }
};

// Uncaught exception handler
export const handleUncaughtException = (error) => {
  logger.error('Uncaught Exception:', {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  });

  // Always exit on uncaught exceptions
  logger.error('Shutting down server due to uncaught exception');
  process.exit(1);
}; 