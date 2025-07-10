export const API_CONFIG = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
}; 