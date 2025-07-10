import { ApiLogger } from '../utils/ApiLogger.js';

//Base class for API operations
export class BaseApiService {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  
  async get(endpoint) {
    try {
      const response = await this.httpClient.get(endpoint);
      // Fire-and-forget logging (don't await to avoid blocking)
      ApiLogger.log('GET', endpoint, null, response).catch(err => {
        // Silent catch to prevent unhandled promise rejection
      });
      return response;
    } catch (error) {
      // Fire-and-forget error logging
      ApiLogger.logError('GET', endpoint, null, error).catch(err => {
        // Silent catch to prevent unhandled promise rejection
      });
      throw error;
    }
  }
  
  async post(endpoint, data) {
    try {
      const response = await this.httpClient.post(endpoint, data);
      // Fire-and-forget logging
      ApiLogger.log('POST', endpoint, data, response).catch(err => {
        // Silent catch to prevent unhandled promise rejection
      });
      return response;
    } catch (error) {
      // Fire-and-forget error logging
      ApiLogger.logError('POST', endpoint, data, error).catch(err => {
        // Silent catch to prevent unhandled promise rejection
      });
      throw error;
    }
  }
  
  async patch(endpoint, data) {
    try {
      const response = await this.httpClient.patch(endpoint, data);
      // Fire-and-forget logging
      ApiLogger.log('PATCH', endpoint, data, response).catch(err => {
        // Silent catch to prevent unhandled promise rejection
      });
      return response;
    } catch (error) {
      // Fire-and-forget error logging
      ApiLogger.logError('PATCH', endpoint, data, error).catch(err => {
        // Silent catch to prevent unhandled promise rejection
      });
      throw error;
    }
  }
  
  async delete(endpoint) {
    try {
      await this.httpClient.delete(endpoint);
      // Fire-and-forget logging
      ApiLogger.log('DELETE', endpoint, null, { success: true }).catch(err => {
        // Silent catch to prevent unhandled promise rejection
      });
      return true;
    } catch (error) {
      // Fire-and-forget error logging
      ApiLogger.logError('DELETE', endpoint, null, error).catch(err => {
        // Silent catch to prevent unhandled promise rejection
      });
      throw error;
    }
  }
} 