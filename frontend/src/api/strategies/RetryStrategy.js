import { API_CONFIG } from '../config.js';

//Retry logic
export class RetryStrategy {
  static async execute(requestFn, maxRetries = API_CONFIG.retries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (this.shouldNotRetry(error) || attempt === maxRetries) {
          break;
        }
        
        await this.delay(attempt, error);
      }
    }
    
    throw lastError;
  }
  
  static shouldNotRetry(error) {
    // Don't retry client errors (4xx) except for specific cases
    if (error.status >= 400 && error.status < 500) {
      // Retry on rate limiting
      if (error.isRateLimitError && error.isRateLimitError()) {
        return false; // Do retry
      }
      
      // Retry on request timeout
      if (error.status === 408) {
        return false; // Do retry
      }
      
      // Don't retry other client errors
      return true;
    }
    
    // Don't retry on abort errors (user cancelled)
    if (error.name === 'AbortError') {
      return true;
    }
    
    // Retry on server errors (5xx) and network errors
    return false;
  }
  
  static async delay(attempt, error = null) {
    let delayMs = API_CONFIG.retryDelay * attempt;
    
    // If it's a rate limit error, use the retryAfter value if provided
    if (error && error.retryAfter) {
      if (typeof error.retryAfter === 'string') {
        // Parse "15 minutes" format
        const match = error.retryAfter.match(/(\d+)\s*(minute|second|hour)s?/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          
          switch (unit) {
            case 'second':
              delayMs = value * 1000;
              break;
            case 'minute':
              delayMs = value * 60 * 1000;
              break;
            case 'hour':
              delayMs = value * 60 * 60 * 1000;
              break;
          }
        }
      } else if (typeof error.retryAfter === 'number') {
        delayMs = error.retryAfter * 1000; // Assume seconds
      }
    }
    
    // Cap the delay at a reasonable maximum (5 minutes)
    delayMs = Math.min(delayMs, 5 * 60 * 1000);
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  // Enhanced execution with custom retry options
  static async executeWithOptions(requestFn, options = {}) {
    const {
      maxRetries = API_CONFIG.retries,
      baseDelay = API_CONFIG.retryDelay,
      maxDelay = 5 * 60 * 1000, // 5 minutes
      exponentialBackoff = true,
      jitter = true,
      retryCondition = null
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Use custom retry condition if provided, otherwise use default
        const shouldRetry = retryCondition 
          ? retryCondition(error, attempt) 
          : !this.shouldNotRetry(error);
        
        if (!shouldRetry || attempt === maxRetries) {
          break;
        }
        
        await this.customDelay(attempt, error, {
          baseDelay,
          maxDelay,
          exponentialBackoff,
          jitter
        });
      }
    }
    
    throw lastError;
  }
  
  static async customDelay(attempt, error, options) {
    const { baseDelay, maxDelay, exponentialBackoff, jitter } = options;
    
    let delayMs;
    
    // Check for rate limit retry-after first
    if (error && error.retryAfter) {
      delayMs = this.parseRetryAfter(error.retryAfter);
    } else {
      // Calculate delay based on attempt
      if (exponentialBackoff) {
        delayMs = baseDelay * Math.pow(2, attempt - 1);
      } else {
        delayMs = baseDelay * attempt;
      }
      
      // Add jitter to avoid thundering herd
      if (jitter) {
        delayMs = delayMs * (0.5 + Math.random() * 0.5);
      }
    }
    
    // Cap the delay
    delayMs = Math.min(delayMs, maxDelay);
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  static parseRetryAfter(retryAfter) {
    if (typeof retryAfter === 'number') {
      return retryAfter * 1000; // Assume seconds
    }
    
    if (typeof retryAfter === 'string') {
      // Try to parse "15 minutes" format
      const match = retryAfter.match(/(\d+)\s*(minute|second|hour)s?/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        switch (unit) {
          case 'second':
            return value * 1000;
          case 'minute':
            return value * 60 * 1000;
          case 'hour':
            return value * 60 * 60 * 1000;
        }
      }
      
      // Try to parse as number of seconds
      const seconds = parseInt(retryAfter);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    
    // Default fallback
    return 60 * 1000; // 1 minute
  }
} 