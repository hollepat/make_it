import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { Session, CreateSessionRequest, UpdateSessionRequest } from '../types';
import {
  getAccessToken,
  getRefreshToken,
  setAuthData,
  clearAll,
} from '../utils/authStorage';
import { authApi } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queue for requests that need to wait for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: Add Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is not 401 or request already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      // No refresh token available, clear storage and redirect to login
      isRefreshing = false;
      clearAll();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const response = await authApi.refreshToken(refreshToken);
      setAuthData(response);

      const newAccessToken = response.accessToken;

      // Process queued requests with new token
      processQueue(null, newAccessToken);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed, clear storage and redirect to login
      processQueue(refreshError as Error, null);
      clearAll();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const sessionApi = {
  createSession: async (request: CreateSessionRequest): Promise<Session> => {
    const response = await api.post<Session>('/sessions', request);
    return response.data;
  },

  listSessions: async (): Promise<Session[]> => {
    const response = await api.get<Session[]>('/sessions');
    return response.data;
  },

  getUpcomingSessions: async (): Promise<Session[]> => {
    const response = await api.get<Session[]>('/sessions/upcoming');
    return response.data;
  },

  toggleCompletion: async (id: string): Promise<Session> => {
    const response = await api.patch<Session>(`/sessions/${id}/complete`);
    return response.data;
  },

  updateSession: async (id: string, request: UpdateSessionRequest): Promise<Session> => {
    const response = await api.put<Session>(`/sessions/${id}`, request);
    return response.data;
  },

  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },
};

export default api;
