import { sendError } from './responseHandler.js';
import { logError } from './logHelper.js';

// Async handler wrapper to eliminate try-catch duplication
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Controller wrapper with automatic error handling
export const controllerWrapper = (controllerFn) => async (req, res, next) => {
  try {
    await controllerFn(req, res, next);
  } catch (error) {
    logError('Controller error', error, {
      endpoint: req.originalUrl,
      method: req.method,
      params: req.params,
      query: req.query,
      body: req.body
    });
    
    // If response hasn't been sent yet, send error response
    if (!res.headersSent) {
      sendError(res, error, 'Internal server error');
    }
  }
};

// Validation wrapper
export const withValidation = (validationFn, controllerFn) => async (req, res, next) => {
  try {
    // Run validation
    const validationResult = await validationFn(req, res);
    if (validationResult && validationResult.error) {
      return res.status(400).json(validationResult);
    }
    
    // Run controller
    await controllerFn(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Business logic wrapper with logging
export const withBusinessLogging = (event, entity, action) => (controllerFn) => async (req, res, next) => {
  try {
    await controllerFn(req, res, next);
    
    // Log successful business event
    const { logBusinessEvent } = await import('./logHelper.js');
    logBusinessEvent(event, entity, action, {
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user?.id, // If you have user context
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 