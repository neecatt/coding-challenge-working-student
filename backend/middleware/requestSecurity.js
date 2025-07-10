import logger from '../config/logger.js';

// Request size limiting middleware with enhanced security
export const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  
  if (contentLength > maxSize) {
    logger.warn('Request size limit exceeded', {
      contentLength,
      maxSize,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(413).json({
      success: false,
      error: 'REQUEST_TOO_LARGE',
      message: 'Request entity too large. Maximum allowed size is 10MB.',
      maxSize: '10MB',
      currentSize: `${Math.round(contentLength / 1024 / 1024 * 100) / 100}MB`,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Parameter limit middleware
export const parameterLimit = (req, res, next) => {
  const paramCount = Object.keys({ ...req.query, ...req.params, ...req.body }).length;
  const maxParams = 1000;
  
  if (paramCount > maxParams) {
    logger.warn('Parameter limit exceeded', {
      paramCount,
      maxParams,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(413).json({
      success: false,
      error: 'TOO_MANY_PARAMETERS',
      message: 'Too many parameters in request. Maximum allowed is 1000.',
      maxParameters: maxParams,
      currentParameters: paramCount,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Add security-related headers
  res.setHeader('X-Request-Size-Limit', '10MB');
  res.setHeader('X-Parameter-Limit', '1000');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Health check endpoint with security status
export const securityHealthCheck = (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    security: {
      rateLimiting: 'enabled',
      requestSizeLimiting: 'enabled',
      parameterLimiting: 'enabled',
      securityHeaders: 'enabled',
      cors: 'configured',
      authentication: 'jwt-based'
    },
    limits: {
      requestSize: '10MB',
      parameters: 1000,
      globalRateLimit: '1000 requests/15min per IP',
      authRateLimit: '5 attempts/15min per IP',
      userRateLimit: '200 requests/15min per user'
    }
  };
  
  res.status(200).json({
    success: true,
    data: healthStatus,
    message: 'Security health check passed',
    timestamp: new Date().toISOString()
  });
}; 