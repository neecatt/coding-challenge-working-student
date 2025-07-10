import { ApiLogger } from '../utils/ApiLogger.js';

//Base class for API operations
export class BaseApiService {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  
  async get(endpoint) {
    try {
      const response = await this.httpClient.get(endpoint);
      ApiLogger.log('GET', endpoint, null, response);
      return response;
    } catch (error) {
      ApiLogger.logError('GET', endpoint, null, error);
      throw error;
    }
  }
  
  async post(endpoint, data) {
    try {
      const response = await this.httpClient.post(endpoint, data);
      ApiLogger.log('POST', endpoint, data, response);
      return response;
    } catch (error) {
      ApiLogger.logError('POST', endpoint, data, error);
      throw error;
    }
  }
  
  async patch(endpoint, data) {
    try {
      const response = await this.httpClient.patch(endpoint, data);
      ApiLogger.log('PATCH', endpoint, data, response);
      return response;
    } catch (error) {
      ApiLogger.logError('PATCH', endpoint, data, error);
      throw error;
    }
  }
  
  async delete(endpoint) {
    try {
      await this.httpClient.delete(endpoint);
      ApiLogger.log('DELETE', endpoint, null, { success: true });
      return true;
    } catch (error) {
      ApiLogger.logError('DELETE', endpoint, null, error);
      throw error;
    }
  }
} 