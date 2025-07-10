//Logging
export class ApiLogger {
  static async log(method, endpoint, data = null, response = null) {
    if (!import.meta.env.DEV) return;
    
    try {
      // Send log to backend terminal
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/frontend-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'info',
          method,
          endpoint,
          data,
          response,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      // Fallback to console if backend logging fails
      console.group(`API ${method} ${endpoint}`);
      console.groupEnd();
      console.warn('Failed to send log to backend:', error.message);
    }
  }
  
  static async logError(method, endpoint, data = null, error = null) {
    if (!import.meta.env.DEV) return;
    
    try {
      // Send error log to backend terminal
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/frontend-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'error',
          method,
          endpoint,
          data,
          error: error ? {
            message: error.message,
            name: error.name,
            stack: error.stack
          } : null,
          timestamp: new Date().toISOString()
        })
      });
    } catch (fetchError) {
      // Fallback to console if backend logging fails
      console.group(`API ${method} ${endpoint} - ERROR`);
      console.groupEnd();
      console.warn('Failed to send error log to backend:', fetchError.message);
    }
  }
} 