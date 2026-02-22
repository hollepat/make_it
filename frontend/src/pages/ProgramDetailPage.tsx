import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgram } from '../context/ProgramContext';
import { useSession } from '../context/SessionContext';
import { programApi } from '../services/programApi';
import type { Session } from '../types';
import SessionCard from '../components/SessionCard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProgramById, deleteProgram, refreshPrograms } = useProgram();
  const { toggleCompletion, deleteSession, refreshSessions } = useSession();

  const program = id ? getProgramById(id) : undefined;
  const [programSessions, setProgramSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingSessions(true);
      const sessions = await programApi.getProgramSessions(id);
      setProgramSessions(sessions);
    } catch (err) {
      console.error('Failed to load program sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, [id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleToggleComplete = useCallback(async (sessionId: string) => {
    await toggleCompletion(sessionId);
    await loadSessions();
    await refreshPrograms();
  }, [toggleCompletion, loadSessions, refreshPrograms]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    await loadSessions();
    await refreshPrograms();
  }, [deleteSession, loadSessions, refreshPrograms]);

  const handleDeleteProgram = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteProgram(id);
      await refreshSessions();
      navigate('/programs');
    } catch (err) {
      console.error('Failed to delete program:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [id, deleteProgram, refreshSessions, navigate]);

  if (!program) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-slate-400">Program not found</p>
          <button
            onClick={() => navigate('/programs')}
            className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  const progress = program.totalSessions > 0
    ? Math.round((program.completedSessions / program.totalSessions) * 100)
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/programs')}
            className="p-1 -ml-1 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Back to programs"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                {program.tag}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50 truncate">
              {program.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/programs/${id}/edit`)}
              className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Edit program"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              aria-label="Delete program"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {program.goal && (
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">{program.goal}</p>
        )}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
            <span>{program.completedSessions}/{program.totalSessions} sessions completed</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Sessions</h2>
          <button
            onClick={() => navigate('/create', { state: { programId: id } })}
            className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg
              hover:bg-teal-700 transition-colors active:scale-95"
          >
            Add Session
          </button>
        </div>

        {loadingSessions ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : programSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-slate-400 text-sm">No sessions in this program yet</p>
            <button
              onClick={() => navigate('/create', { state: { programId: id } })}
              className="mt-3 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg
                hover:bg-teal-700 transition-colors"
            >
              Add first session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {programSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteSession}
                showRelativeDate={false}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Program"
        message={`Are you sure you want to delete "${program.name}"? Sessions will be kept but unlinked from this program.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteProgram}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
