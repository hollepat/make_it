import axios from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Separate axios instance for auth endpoints (no interceptors to avoid circular dependencies)
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  register: async (request: RegisterRequest): Promise<AuthResponse> => {
    const response = await authAxios.post<AuthResponse>('/auth/register', request);
    return response.data;
  },

  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const response = await authAxios.post<AuthResponse>('/auth/login', request);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await authAxios.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await authAxios.post('/auth/logout', { refreshToken });
  },
};
