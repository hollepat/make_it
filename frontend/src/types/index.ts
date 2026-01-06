export interface Session {
  id: string;
  programId: string;
  type: string;
  scheduledDate: string; // ISO date string
  completed: boolean;
  completedAt: string | null;
  notes: string | null;
  durationMinutes: number | null;
  createdAt: string;
}

export interface CreateSessionRequest {
  programId: string;
  type: string;
  scheduledDate: string;
  notes?: string;
  durationMinutes?: number;
}
