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
    
    throw new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }
  
  static async handleSuccess(response, isJson) {
    if (response.status === 204) {
      return null;
    }
    
    try {
      return isJson ? await response.json() : await response.text();
    } catch (error) {
      throw new ApiError('Invalid response format', response.status);
    }
  }
} 