import { API_CONFIG } from '../config.js';

// Retry Strategy - Single Responsibility: Retry logic
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
        
        await this.delay(attempt);
      }
    }
    
    throw lastError;
  }
  
  static shouldNotRetry(error) {
    return (error.status >= 400 && error.status < 500) || 
           error.name === 'AbortError';
  }
  
  static async delay(attempt) {
    const delay = API_CONFIG.retryDelay * attempt;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
} 