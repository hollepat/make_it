import { memo } from 'react';
import type { Session } from '../types';
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
      className="w-6 h-6 text-gray-300"
    >
      <circle cx="12" cy="12" r="9.5" />
    </svg>
  );
}

const SessionCard = memo(function SessionCard({
  session,
  onToggleComplete,
  showRelativeDate = true,
}: SessionCardProps) {
  const time = formatTime(session.scheduledDate);
  const relativeDate = getRelativeDate(session.scheduledDate);
  const formattedDate = formatSessionDate(session.scheduledDate);
  const duration = formatDuration(session.durationMinutes);
  const notesPreview = truncateNotes(session.notes);

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-100 p-4
        transition-all duration-200 hover:shadow-md
        ${session.completed ? 'opacity-75' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Complete Button */}
        <button
          onClick={() => onToggleComplete(session.id)}
          className="flex-shrink-0 mt-0.5 p-1 -m-1 rounded-full
            hover:bg-gray-100 transition-colors active:scale-95"
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
              className={`font-semibold text-gray-900 ${
                session.completed ? 'line-through' : ''
              }`}
            >
              {getSessionLabel(session.type)}
            </h3>
          </div>

          {/* Date & Time Row */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            {showRelativeDate ? (
              <span className="font-medium text-teal-600">{relativeDate}</span>
            ) : (
              <span>{formattedDate}</span>
            )}
            {showRelativeDate && relativeDate !== formattedDate && (
              <>
                <span className="text-gray-300">|</span>
                <span>{formattedDate}</span>
              </>
            )}
          </div>

          {/* Time & Duration Row */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{time || 'All day'}</span>
            {duration && (
              <>
                <span className="text-gray-300">|</span>
                <span>{duration}</span>
              </>
            )}
          </div>

          {/* Notes Preview */}
          {notesPreview && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {notesPreview}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export default SessionCard;
