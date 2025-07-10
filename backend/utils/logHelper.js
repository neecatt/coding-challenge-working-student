import logger from '../config/logger.js';

// Helper functions for consistent logging

export const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

export const logError = (message, error, meta = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    },
    ...meta,
  });
};

export const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

// Database operation logging
export const logDbOperation = (operation, table, duration, meta = {}) => {
  logger.info(`Database ${operation} on ${table}`, {
    operation,
    table,
    duration: `${duration}ms`,
    ...meta,
  });
};

// API operation logging
export const logApiOperation = (operation, endpoint, duration, statusCode, meta = {}) => {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level](`API ${operation} on ${endpoint}`, {
    operation,
    endpoint,
    duration: `${duration}ms`,
    statusCode,
    ...meta,
  });
};

// Security event logging
export const logSecurityEvent = (event, details, meta = {}) => {
  logger.warn(`Security event: ${event}`, {
    event,
    details,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Performance logging
export const logPerformance = (operation, duration, meta = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level](`Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...meta,
  });
};

// Business logic logging
export const logBusinessEvent = (event, entity, action, meta = {}) => {
  logger.info(`Business event: ${event}`, {
    event,
    entity,
    action,
    timestamp: new Date().toISOString(),
    ...meta,
  });
}; 