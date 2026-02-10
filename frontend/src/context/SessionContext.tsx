import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Session, CreateSessionRequest } from '../types';
import { sessionApi } from '../services/api';

interface SessionContextType {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refreshSessions: () => Promise<void>;
  createSession: (request: CreateSessionRequest) => Promise<Session>;
  toggleCompletion: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  getSessionById: (id: string) => Session | undefined;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionApi.listSessions();
      setSessions(data);
    } catch (err) {
      setError('Failed to load sessions. Please try again.');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const createSession = useCallback(
    async (request: CreateSessionRequest): Promise<Session> => {
      const newSession = await sessionApi.createSession(request);
      setSessions((prev) => [...prev, newSession]);
      return newSession;
    },
    []
  );

  const toggleCompletion = useCallback(async (id: string) => {
    try {
      const updated = await sessionApi.toggleCompletion(id);
      setSessions((prev) =>
        prev.map((session) => (session.id === id ? updated : session))
      );
    } catch (err) {
      console.error('Failed to toggle completion:', err);
      throw err;
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    try {
      await sessionApi.deleteSession(id);
      setSessions((prev) => prev.filter((session) => session.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
      throw err;
    }
  }, []);

  const getSessionById = useCallback(
    (id: string): Session | undefined => {
      return sessions.find((session) => session.id === id);
    },
    [sessions]
  );

  const value = useMemo(
    () => ({
      sessions,
      loading,
      error,
      refreshSessions,
      createSession,
      toggleCompletion,
      deleteSession,
      getSessionById,
      selectedDate,
      setSelectedDate,
    }),
    [
      sessions,
      loading,
      error,
      refreshSessions,
      createSession,
      toggleCompletion,
      deleteSession,
      getSessionById,
      selectedDate,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
