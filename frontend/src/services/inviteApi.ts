import axios from 'axios';
import type { InviteCode } from '../types/auth';
import { getAccessToken } from '../utils/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance for invite API with auth header
const inviteAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header to requests
inviteAxios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ValidateInviteResponse {
  valid: boolean;
  expiresAt?: string;
  message?: string;
}

export const inviteApi = {
  createInvite: async (): Promise<InviteCode> => {
    const response = await inviteAxios.post<InviteCode>('/invites');
    return response.data;
  },

  listInvites: async (): Promise<InviteCode[]> => {
    const response = await inviteAxios.get<InviteCode[]>('/invites');
    return response.data;
  },

  validateInvite: async (code: string): Promise<ValidateInviteResponse> => {
    const response = await inviteAxios.get<ValidateInviteResponse>(
      `/invites/validate/${code}`
    );
    return response.data;
  },
};
