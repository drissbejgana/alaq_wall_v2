import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  city: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  city?: string;
}

export const authService = {
  // Login
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/token/', credentials);
    const { access, refresh } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    return response.data;
  },

  // Register
  async register(data: RegisterData) {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  // Update profile
  async updateProfile(data: Partial<User>) {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Check if logged in
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('access_token');
  },
};