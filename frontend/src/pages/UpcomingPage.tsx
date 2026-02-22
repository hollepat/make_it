import { useMemo, useCallback, useState } from 'react';
import { useSession } from '../context/SessionContext';
import SessionCard from '../components/SessionCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { getUpcomingIncompleteSessions, getSessionLabel } from '../utils/sessionUtils';

export default function UpcomingPage() {
  const { sessions, loading, error, toggleCompletion, deleteSession, refreshSessions } =
    useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const upcomingSessions = useMemo(
    () => getUpcomingIncompleteSessions(sessions),
    [sessions]
  );

  const handleToggleComplete = useCallback(
    async (id: string) => {
      try {
        await toggleCompletion(id);
      } catch (err) {
        console.error('Failed to toggle completion:', err);
      }
    },
    [toggleCompletion]
  );

  const handleDeleteClick = useCallback((id: string) => {
    setSessionToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete);
      setSessionToDelete(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [sessionToDelete, deleteSession]);

  const handleDeleteCancel = useCallback(() => {
    setSessionToDelete(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshSessions();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSessions]);

  const deletingSession = sessionToDelete
    ? sessions.find((s) => s.id === sessionToDelete)
    : null;

  const deleteMessage = deletingSession
    ? 'Are you sure you want to delete this ' + getSessionLabel(deletingSession.type).toLowerCase() + ' session? This action cannot be undone.'
    : 'Are you sure you want to delete this session? This action cannot be undone.';

  if (loading && !isRefreshing) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6 text-red-600"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-1">
            Failed to load sessions
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50">Upcoming</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {upcomingSessions.length} session
            {upcomingSessions.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Refresh sessions"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {upcomingSessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-8 h-8 text-gray-400 dark:text-slate-500"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-1">
              No upcoming sessions
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-xs">
              You don't have any upcoming sessions scheduled. Tap the + button
              to create one.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3 pb-20">
            {upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteClick}
                showRelativeDate
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={sessionToDelete !== null}
        title="Delete Session"
        message={deleteMessage}
        confirmLabel="Delete"
        cancelLabel="Keep"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
