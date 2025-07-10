import { API_CONFIG } from '../config.js';

// Request Configuration Builder - Single Responsibility: Request configuration
export class RequestConfigBuilder {
  static build(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}/api${endpoint}`;
    
    // Get authorization token from localStorage
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return {
      url,
      config: {
        headers,
        ...options,
      }
    };
  }
} 