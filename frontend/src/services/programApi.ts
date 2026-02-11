import api from './api';
import type { Program, CreateProgramRequest, UpdateProgramRequest, Session } from '../types';

export const programApi = {
  createProgram: async (request: CreateProgramRequest): Promise<Program> => {
    const response = await api.post<Program>('/programs', request);
    return response.data;
  },

  listPrograms: async (): Promise<Program[]> => {
    const response = await api.get<Program[]>('/programs');
    return response.data;
  },

  getProgram: async (id: string): Promise<Program> => {
    const response = await api.get<Program>(`/programs/${id}`);
    return response.data;
  },

  updateProgram: async (id: string, request: UpdateProgramRequest): Promise<Program> => {
    const response = await api.put<Program>(`/programs/${id}`, request);
    return response.data;
  },

  deleteProgram: async (id: string): Promise<void> => {
    await api.delete(`/programs/${id}`);
  },

  getProgramSessions: async (id: string): Promise<Session[]> => {
    const response = await api.get<Session[]>(`/programs/${id}/sessions`);
    return response.data;
  },
};
