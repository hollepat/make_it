import api from './api';

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export const assistantApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/assistant/chat', request);
    return response.data;
  },

  clearHistory: async (): Promise<void> => {
    await api.delete('/assistant/chat');
  },
};
