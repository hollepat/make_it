import { useCallback, useState } from 'react';
import type { Session } from '../types';
import { getSessionEmoji, getSessionLabel } from '../utils/sessionUtils';
import { formatSessionDate, formatTime, formatDuration } from '../utils/dateUtils';
import ConfirmDialog from './ConfirmDialog';
import { useProgram } from '../context/ProgramContext';

interface SessionDetailModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function SessionDetailModal({
  session,
  isOpen,
  onClose,
  onToggleComplete,
  onDelete,
}: SessionDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { getProgramById } = useProgram();
  const program = session?.programId ? getProgramById(session.programId) : undefined;

  const handleToggleComplete = useCallback(async () => {
    if (session) {
      await onToggleComplete(session.id);
    }
  }, [session, onToggleComplete]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!session) return;
    setIsDeleting(true);
    try {
      await onDelete(session.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [session, onDelete, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  if (!isOpen || !session) return null;

  const time = formatTime(session.scheduledDate);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-title"
      >
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl animate-slide-up sm:animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2
              id="session-detail-title"
              className="text-lg font-semibold text-gray-900"
            >
              Session Details
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteClick}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Delete session"
              >
                <TrashIcon />
              </button>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Session Type */}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getSessionEmoji(session.type)}</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {getSessionLabel(session.type)}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatSessionDate(session.scheduledDate)}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Time */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Time
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {time || 'All day'}
                </p>
              </div>

              {/* Duration */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Duration
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDuration(session.durationMinutes) || 'Not set'}
                </p>
              </div>
            </div>

            {/* Program */}
            {program && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Program
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                    {program.tag}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{program.name}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {session.notes && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {session.notes}
                </p>
              </div>
            )}

            {/* Status */}
            {session.completed && session.completedAt && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3">
                <CheckIcon />
                <span className="text-sm font-medium">
                  Completed {formatSessionDate(session.completedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-2 space-y-3">
            <button
              onClick={handleToggleComplete}
              className={`
                w-full py-3 px-4 rounded-xl font-semibold text-base
                transition-all duration-200 active:scale-[0.98]
                flex items-center justify-center gap-2
                ${session.completed
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/25'
                }
              `}
            >
              {session.completed ? (
                <>Mark as Incomplete</>
              ) : (
                <>
                  <CheckIcon />
                  Mark as Complete
                </>
              )}
            </button>
          </div>

          {/* Safe area padding for iOS */}
          <div className="h-safe-area-bottom" />
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Session"
        message={`Are you sure you want to delete this ${getSessionLabel(session.type).toLowerCase()} session? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
