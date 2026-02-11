import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Program, CreateProgramRequest, UpdateProgramRequest } from '../types';
import { programApi } from '../services/programApi';

interface ProgramContextType {
  programs: Program[];
  loading: boolean;
  error: string | null;
  refreshPrograms: () => Promise<void>;
  createProgram: (request: CreateProgramRequest) => Promise<Program>;
  updateProgram: (id: string, request: UpdateProgramRequest) => Promise<Program>;
  deleteProgram: (id: string) => Promise<void>;
  getProgramById: (id: string) => Program | undefined;
}

const ProgramContext = createContext<ProgramContextType | null>(null);

interface ProgramProviderProps {
  children: ReactNode;
}

export function ProgramProvider({ children }: ProgramProviderProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await programApi.listPrograms();
      setPrograms(data);
    } catch (err) {
      setError('Failed to load programs. Please try again.');
      console.error('Error loading programs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPrograms();
  }, [refreshPrograms]);

  const createProgram = useCallback(
    async (request: CreateProgramRequest): Promise<Program> => {
      const newProgram = await programApi.createProgram(request);
      setPrograms((prev) => [newProgram, ...prev]);
      return newProgram;
    },
    []
  );

  const updateProgram = useCallback(
    async (id: string, request: UpdateProgramRequest): Promise<Program> => {
      const updated = await programApi.updateProgram(id, request);
      setPrograms((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
      return updated;
    },
    []
  );

  const deleteProgram = useCallback(async (id: string) => {
    await programApi.deleteProgram(id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getProgramById = useCallback(
    (id: string): Program | undefined => {
      return programs.find((p) => p.id === id);
    },
    [programs]
  );

  const value = useMemo(
    () => ({
      programs,
      loading,
      error,
      refreshPrograms,
      createProgram,
      updateProgram,
      deleteProgram,
      getProgramById,
    }),
    [
      programs,
      loading,
      error,
      refreshPrograms,
      createProgram,
      updateProgram,
      deleteProgram,
      getProgramById,
    ]
  );

  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
}

export function useProgram(): ProgramContextType {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('useProgram must be used within a ProgramProvider');
  }
  return context;
}
