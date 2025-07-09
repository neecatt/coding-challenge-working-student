import { API_CONFIG } from '../config.js';

// Timeout Manager - Single Responsibility: Timeout handling
export class TimeoutManager {
  static createTimeout(timeoutMs = API_CONFIG.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    return { controller, timeoutId };
  }
  
  static clearTimeout(timeoutId) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
} 