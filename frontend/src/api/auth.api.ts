import apiClient from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse['data']> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },
  
  register: async (data: RegisterRequest): Promise<AuthResponse['data']> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },
  
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthResponse['data']> => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
  
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};