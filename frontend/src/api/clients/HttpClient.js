import { RequestConfigBuilder } from '../builders/RequestConfigBuilder.js';
import { ResponseHandler } from '../handlers/ResponseHandler.js';
import { RetryStrategy } from '../strategies/RetryStrategy.js';
import { TimeoutManager } from '../managers/TimeoutManager.js';

// HTTP Client - Single Responsibility: HTTP communication
export class HttpClient {
  async get(endpoint, options = {}) {
    return HttpClient.request(endpoint, { ...options, method: 'GET' });
  }
  async post(endpoint, data, options = {}) {
    return HttpClient.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) });
  }
  async patch(endpoint, data, options = {}) {
    return HttpClient.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) });
  }
  async delete(endpoint, options = {}) {
    return HttpClient.request(endpoint, { ...options, method: 'DELETE' });
  }
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