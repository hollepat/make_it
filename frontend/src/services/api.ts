import axios from 'axios';
import type { Session, CreateSessionRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
};
