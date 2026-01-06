import { memo } from 'react';
import type { Session } from '../../types';
import { getSessionEmoji } from '../../utils/sessionUtils';
import { formatTime } from '../../utils/dateUtils';

interface CalendarDayProps {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  sessions: Session[];
  onClick: (date: Date) => void;
  onSessionClick: (session: Session) => void;
}

const CalendarDay = memo(function CalendarDay({
  date,
  dayNumber,
  isCurrentMonth,
  isToday,
  isSelected,
  sessions,
  onClick,
  onSessionClick,
}: CalendarDayProps) {
  const handleClick = (e: React.MouseEvent) => {
    // If clicking directly on the day cell (not a session)
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.dayCell) {
      onClick(date);
    }
  };

  const handleSessionClick = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    onSessionClick(session);
  };

  // Limit visible sessions to avoid overflow
  const visibleSessions = sessions.slice(0, 3);
  const hasMoreSessions = sessions.length > 3;

  return (
    <div
      onClick={handleClick}
      data-day-cell="true"
      className={`
        min-h-[80px] md:min-h-[100px] p-1 border-b border-r border-gray-100
        cursor-pointer transition-colors duration-150
        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
        ${isSelected ? 'bg-teal-50 ring-1 ring-teal-300 ring-inset' : ''}
        ${!isSelected ? 'hover:bg-gray-50' : ''}
      `}
      role="button"
      aria-label={`${date.toLocaleDateString()}, ${sessions.length} sessions`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(date);
        }
      }}
    >
      {/* Day Number */}
      <div className="flex justify-end mb-1" data-day-cell="true">
        <span
          data-day-cell="true"
          className={`
            w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full
            ${isToday ? 'bg-teal-600 text-white' : ''}
            ${!isToday && isCurrentMonth ? 'text-gray-900' : ''}
            ${!isToday && !isCurrentMonth ? 'text-gray-400' : ''}
          `}
        >
          {dayNumber}
        </span>
      </div>

      {/* Sessions */}
      <div className="space-y-0.5 overflow-hidden" data-day-cell="true">
        {visibleSessions.map((session) => (
          <button
            key={session.id}
            onClick={(e) => handleSessionClick(e, session)}
            className={`
              w-full text-left px-1.5 py-0.5 rounded text-xs truncate
              transition-all duration-150 hover:scale-[1.02]
              ${session.completed
                ? 'bg-green-100 text-green-700 line-through opacity-75'
                : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
              }
            `}
            aria-label={`${session.type} session${session.completed ? ', completed' : ''}`}
          >
            <span className="mr-1">{getSessionEmoji(session.type)}</span>
            <span className="hidden sm:inline">
              {formatTime(session.scheduledDate) || 'All day'}
            </span>
          </button>
        ))}

        {hasMoreSessions && (
          <div
            data-day-cell="true"
            className="text-xs text-gray-500 px-1.5 font-medium"
          >
            +{sessions.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
});

export default CalendarDay;
