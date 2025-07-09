import { logError } from './logHelper.js';

// Utility functions for consistent API responses

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

export const sendError = (res, error, message = 'Error occurred', statusCode = 500) => {
  logError(message, error);
  return res.status(statusCode).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

export const sendNotFound = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `${resource} not found`
  });
};

export const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: 'Validation Error',
    message: Array.isArray(errors) ? errors.join(', ') : errors
  });
};

export const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res) => {
  return res.status(204).send();
}; 