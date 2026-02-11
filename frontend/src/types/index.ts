export interface Session {
  id: string;
  programId: string | null;
  type: string;
  scheduledDate: string; // ISO date string
  completed: boolean;
  completedAt: string | null;
  notes: string | null;
  durationMinutes: number | null;
  createdAt: string;
}

export interface CreateSessionRequest {
  programId?: string | null;
  type: string;
  scheduledDate: string;
  notes?: string;
  durationMinutes?: number;
}

export interface UpdateSessionRequest {
  type?: string;
  scheduledDate?: string;
  notes?: string;
  durationMinutes?: number;
  programId?: string | null;
  clearProgramId?: boolean;
}

export interface Program {
  id: string;
  name: string;
  goal: string | null;
  tag: string;
  startDate: string;
  totalSessions: number;
  completedSessions: number;
  createdAt: string;
}

export interface CreateProgramRequest {
  name: string;
  goal?: string;
  tag: string;
  startDate: string;
}

export interface UpdateProgramRequest {
  name?: string;
  goal?: string;
  tag?: string;
  startDate?: string;
}
