import { BaseApiService } from './BaseApiService.js';

export class AuthService extends BaseApiService {
  constructor(client) {
    super(client);
    this.baseUrl = '/auth';
  }

  async register(userData) {
    const { name, email, password, organisationId } = userData;
    
    return this.post(`${this.baseUrl}/register`, {
      name,
      email,
      password,
      organisationId
    });
  }

  async login(credentials) {
    const { email, password } = credentials;
    
    const response = await this.post(`${this.baseUrl}/login`, {
      email,
      password
    });

    const { accessToken, refreshToken, user } = response;
    
    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      try {
        await this.post(`${this.baseUrl}/logout`, {
          refreshToken
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post(`${this.baseUrl}/refresh`, {
      refreshToken
    });

    const { accessToken, refreshToken: newRefreshToken } = response;
    
    // Update tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return response;
  }

  async getCurrentUser() {
    return this.get(`${this.baseUrl}/me`);
  }

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }

  getCurrentUserFromStorage() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }
} 