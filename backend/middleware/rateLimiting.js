import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import logger from '../config/logger.js';

// Global rate limiter - applies to all requests
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Global rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  skipSuccessfulRequests: true, 
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      email: req.body?.email,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts from this IP, please try again after 15 minutes.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

// API rate limiter for general API endpoints
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 API requests per windowMs
  message: {
    success: false,
    error: 'API_RATE_LIMIT_EXCEEDED',
    message: 'Too many API requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      error: 'API_RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests from this IP, please try again later.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

// Slow down middleware - gradually increases response time (updated for v2)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per windowMs without delay
  delayMs: () => 500, // Fixed delay of 500ms per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: {
    delayMs: false 
  }
});

// Create rate limiter for specific user after authentication
export const createUserRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      // Use user ID if authenticated, fallback to IP
      return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    message: {
      success: false,
      error: 'USER_RATE_LIMIT_EXCEEDED',
      message: 'You have exceeded your request limit, please try again later.',
      retryAfter: Math.ceil(windowMs / (60 * 1000)) + ' minutes',
      timestamp: new Date().toISOString()
    },
    handler: (req, res) => {
      logger.warn('User rate limit exceeded', {
        userId: req.user?.id,
        email: req.user?.email,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      res.status(429).json({
        success: false,
        error: 'USER_RATE_LIMIT_EXCEEDED',
        message: 'You have exceeded your request limit, please try again later.',
        retryAfter: Math.ceil(windowMs / (60 * 1000)) + ' minutes',
        timestamp: new Date().toISOString()
      });
    }
  });
};

export const userApiRateLimit = createUserRateLimit(15 * 60 * 1000, 200); // 200 requests per 15 minutes per user
export const userTicketRateLimit = createUserRateLimit(60 * 1000, 10); // 10 ticket operations per minute per user 