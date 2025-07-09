//Logging
export class ApiLogger {
  static log(method, endpoint, data = null, response = null) {
    if (!import.meta.env.DEV) return;
    
    console.group(`API ${method} ${endpoint}`);
    if (data) console.log('Request:', data);
    if (response) console.log('Response:', response);
    console.groupEnd();
  }
  
  static logError(method, endpoint, data = null, error = null) {
    if (!import.meta.env.DEV) return;
    
    console.group(`API ${method} ${endpoint} - ERROR`);
    if (data) console.log('Request:', data);
    if (error) console.log('Error:', error.message);
    console.groupEnd();
  }
} 