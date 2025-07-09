import logger from '../config/logger.js';

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  logger.error('Global error handler caught error:', err);

  // Default error
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      success: false,
      error: 'Validation Error',
      message: err.message
    };
    return res.status(400).json(error);
  }

  if (err.name === 'CastError') {
    error = {
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    };
    return res.status(400).json(error);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    error = {
      success: false,
      error: 'Duplicate Entry',
      message: 'A record with this information already exists'
    };
    return res.status(409).json(error);
  }

  if (err.code === 'P2025') {
    error = {
      success: false,
      error: 'Record Not Found',
      message: 'The requested record was not found'
    };
    return res.status(404).json(error);
  }

  res.status(err.status || 500).json(error);
};

// 404 handler for undefined routes
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
}; 