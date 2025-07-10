// Custom error class
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errorCode = data?.errorCode || data?.error || 'UNKNOWN_ERROR';
    this.field = data?.field;
    this.details = data?.details;
    this.timestamp = data?.timestamp || new Date().toISOString();
    
    // Additional properties from backend error response
    this.resource = data?.resource;
    this.retryAfter = data?.retryAfter;
    this.missingFields = data?.missingFields;
    this.requiredRoles = data?.requiredRoles;
    this.userRole = data?.userRole;
  }
  
  // Helper method to check if error is a specific type
  isErrorType(errorType) {
    return this.errorCode === errorType;
  }
  
  // Helper method to check if error is authentication related
  isAuthError() {
    return this.status === 401 || this.errorCode === 'UNAUTHORIZED';
  }
  
  // Helper method to check if error is authorization related
  isAuthorizationError() {
    return this.status === 403 || this.errorCode === 'FORBIDDEN';
  }
  
  // Helper method to check if error is validation related
  isValidationError() {
    return this.status === 400 || this.errorCode === 'VALIDATION_ERROR';
  }
  
  // Helper method to check if error is not found related
  isNotFoundError() {
    return this.status === 404 || this.errorCode === 'NOT_FOUND';
  }
  
  // Helper method to check if error is rate limiting related
  isRateLimitError() {
    return this.status === 429 || this.errorCode?.includes('RATE_LIMIT');
  }
  
  // Helper method to get user-friendly error message
  getUserFriendlyMessage() {
    // Map common error codes to user-friendly messages
    const errorMessages = {
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'UNAUTHORIZED': 'Please log in to continue.',
      'FORBIDDEN': 'You don\'t have permission to perform this action.',
      'NOT_FOUND': 'The requested resource was not found.',
      'CONFLICT': 'This information is already in use.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait before trying again.',
      'AUTH_RATE_LIMIT_EXCEEDED': 'Too many login attempts. Please wait before trying again.',
      'REQUEST_TOO_LARGE': 'The request is too large. Please reduce the size and try again.',
      'TOO_MANY_PARAMETERS': 'Too many parameters in the request.',
      'DATABASE_ERROR': 'A database error occurred. Please try again later.',
      'INTERNAL_SERVER_ERROR': 'An unexpected error occurred. Please try again later.'
    };
    
    return errorMessages[this.errorCode] || this.message || 'An error occurred. Please try again.';
  }
  
  // Helper method to get detailed error information for debugging
  getDebugInfo() {
    return {
      message: this.message,
      status: this.status,
      errorCode: this.errorCode,
      field: this.field,
      details: this.details,
      data: this.data,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
} 