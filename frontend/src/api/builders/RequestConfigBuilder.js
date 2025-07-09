import { API_CONFIG } from '../config.js';

// Request Configuration Builder - Single Responsibility: Request configuration
export class RequestConfigBuilder {
  static build(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}/api${endpoint}`;
    
    return {
      url,
      config: {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        ...options,
      }
    };
  }
} 