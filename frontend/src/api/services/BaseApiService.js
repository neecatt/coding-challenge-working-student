import { ApiLogger } from '../utils/ApiLogger.js';

// Base API Service - Open/Closed: Base class for API operations
export class BaseApiService {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  
  async get(endpoint) {
    try {
      const response = await this.httpClient.requestWithRetry(endpoint);
      ApiLogger.log('GET', endpoint, null, response);
      return response.data;
    } catch (error) {
      ApiLogger.logError('GET', endpoint, null, error);
      throw error;
    }
  }
  
  async post(endpoint, data) {
    try {
      const response = await this.httpClient.requestWithRetry(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      ApiLogger.log('POST', endpoint, data, response);
      return response.data;
    } catch (error) {
      ApiLogger.logError('POST', endpoint, data, error);
      throw error;
    }
  }
  
  async patch(endpoint, data) {
    try {
      const response = await this.httpClient.requestWithRetry(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      ApiLogger.log('PATCH', endpoint, data, response);
      return response.data;
    } catch (error) {
      ApiLogger.logError('PATCH', endpoint, data, error);
      throw error;
    }
  }
  
  async delete(endpoint) {
    try {
      await this.httpClient.requestWithRetry(endpoint, {
        method: 'DELETE',
      });
      ApiLogger.log('DELETE', endpoint, null, { success: true });
      return true;
    } catch (error) {
      ApiLogger.logError('DELETE', endpoint, null, error);
      throw error;
    }
  }
} 