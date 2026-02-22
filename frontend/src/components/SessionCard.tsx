import { memo } from 'react';
import type { Session } from '../types';
import { useProgram } from '../context/ProgramContext';
import {
  getSessionEmoji,
  getSessionLabel,
  truncateNotes,
} from '../utils/sessionUtils';
import {
  getRelativeDate,
  formatSessionDate,
  formatTime,
  formatDuration,
} from '../utils/dateUtils';

interface SessionCardProps {
  session: Session;
  onToggleComplete: (id: string) => void;
  onDelete?: (id: string) => void;
  showRelativeDate?: boolean;
}

function CheckCircleIcon({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6 text-green-500"
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-6 h-6 text-gray-300 dark:text-slate-600"
    >
      <circle cx="12" cy="12" r="9.5" />
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
      className="w-4 h-4"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

const SessionCard = memo(function SessionCard({
  session,
  onToggleComplete,
  onDelete,
  showRelativeDate = true,
}: SessionCardProps) {
  const { getProgramById } = useProgram();
  const program = session.programId ? getProgramById(session.programId) : undefined;

  const time = formatTime(session.scheduledDate);
  const relativeDate = getRelativeDate(session.scheduledDate);
  const formattedDate = formatSessionDate(session.scheduledDate);
  const duration = formatDuration(session.durationMinutes);
  const notesPreview = truncateNotes(session.notes);

  return (
    <div
      className={`
        bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4
        transition-all duration-200 hover:shadow-md
        ${session.completed ? 'opacity-75' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Complete Button */}
        <button
          onClick={() => onToggleComplete(session.id)}
          className="flex-shrink-0 mt-0.5 p-1 -m-1 rounded-full
            hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          aria-label={
            session.completed ? 'Mark as incomplete' : 'Mark as complete'
          }
        >
          <CheckCircleIcon completed={session.completed} />
        </button>

        {/* Session Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{getSessionEmoji(session.type)}</span>
            <h3
              className={`font-semibold text-gray-900 dark:text-slate-50 ${
                session.completed ? 'line-through' : ''
              }`}
            >
              {getSessionLabel(session.type)}
            </h3>
            {program && (
              <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                {program.tag}
              </span>
            )}
          </div>

          {/* Date & Time Row */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 mb-1">
            {showRelativeDate ? (
              <span className="font-medium text-teal-600 dark:text-teal-400">{relativeDate}</span>
            ) : (
              <span>{formattedDate}</span>
            )}
            {showRelativeDate && relativeDate !== formattedDate && (
              <>
                <span className="text-gray-300 dark:text-slate-600">|</span>
                <span>{formattedDate}</span>
              </>
            )}
          </div>

          {/* Time & Duration Row */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <span>{time || 'All day'}</span>
            {duration && (
              <>
                <span className="text-gray-300 dark:text-slate-600">|</span>
                <span>{duration}</span>
              </>
            )}
          </div>

          {/* Notes Preview */}
          {notesPreview && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 line-clamp-2">
              {notesPreview}
            </p>
          )}
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={() => onDelete(session.id)}
            className="flex-shrink-0 p-2 -m-1 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400
              hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            aria-label={`Delete ${getSessionLabel(session.type)} session`}
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
});

export default SessionCard;
