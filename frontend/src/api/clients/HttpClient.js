import { RequestConfigBuilder } from '../builders/RequestConfigBuilder.js';
import { ResponseHandler } from '../handlers/ResponseHandler.js';
import { RetryStrategy } from '../strategies/RetryStrategy.js';
import { TimeoutManager } from '../managers/TimeoutManager.js';

// HTTP Client - Single Responsibility: HTTP communication
export class HttpClient {
  static async request(endpoint, options = {}) {
    const { url, config } = RequestConfigBuilder.build(endpoint, options);
    const { controller, timeoutId } = TimeoutManager.createTimeout();
    
    config.signal = controller.signal;
    
    try {
      const response = await fetch(url, config);
      TimeoutManager.clearTimeout(timeoutId);
      return await ResponseHandler.handle(response);
    } catch (error) {
      TimeoutManager.clearTimeout(timeoutId);
      throw error;
    }
  }
  
  static async requestWithRetry(endpoint, options = {}) {
    return RetryStrategy.execute(() => this.request(endpoint, options));
  }
} 