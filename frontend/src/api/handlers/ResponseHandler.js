import { ApiError } from '../errors.js';

//Response processing
export class ResponseHandler {
  static async handle(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      return this.handleError(response, isJson);
    }
    
    return this.handleSuccess(response, isJson);
  }
  
  static async handleError(response, isJson) {
    let errorData = {};
    
    try {
      if (isJson) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch (e) {
      errorData = { message: 'Failed to parse error response' };
    }
    
    // Handle new standardized error format
    const message = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
    const errorCode = errorData.error || 'UNKNOWN_ERROR';
    
    throw new ApiError(
      message,
      response.status,
      {
        ...errorData,
        errorCode,
        timestamp: errorData.timestamp || new Date().toISOString()
      }
    );
  }
  
  static async handleSuccess(response, isJson) {
    if (response.status === 204) {
      return null;
    }
    
    try {
      const data = isJson ? await response.json() : await response.text();
      
      // Handle new standardized success format
      if (isJson && data && typeof data === 'object') {
        if (data.success !== undefined) {
          return data.data !== undefined ? data.data : data;
        }
        return data;
      }
      
      return data;
    } catch (error) {
      throw new ApiError('Invalid response format', response.status);
    }
  }
} 