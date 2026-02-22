import { memo } from 'react';
import type { Session } from '../../types';
import { getSessionEmoji } from '../../utils/sessionUtils';
import { formatTime } from '../../utils/dateUtils';
import { useProgram } from '../../context/ProgramContext';

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
  const { getProgramById } = useProgram();

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
        min-h-[80px] md:min-h-[100px] p-1.5 rounded-xl
        cursor-pointer transition-all duration-200 ease-out
        ${isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-transparent'}
        ${isSelected
          ? 'glass-teal ring-1 ring-teal-300/50 dark:ring-teal-700/50 shadow-sm shadow-teal-200/50'
          : ''
        }
        ${!isSelected && isCurrentMonth ? 'hover:bg-gray-50/80 dark:hover:bg-slate-800/80 active:bg-gray-100/60 dark:active:bg-slate-700/60' : ''}
        ${!isCurrentMonth ? 'opacity-40' : ''}
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
      <div className="flex justify-center mb-1" data-day-cell="true">
        <span
          data-day-cell="true"
          className={`
            w-7 h-7 flex items-center justify-center text-sm rounded-full
            transition-all duration-200
            ${isToday
              ? 'gradient-teal text-white font-bold shadow-md shadow-teal-600/30 animate-today-glow'
              : ''
            }
            ${!isToday && isCurrentMonth ? 'text-gray-800 dark:text-slate-200 font-medium' : ''}
            ${!isToday && !isCurrentMonth ? 'text-gray-400 dark:text-slate-500 font-normal' : ''}
          `}
        >
          {dayNumber}
        </span>
      </div>

      {/* Session indicators */}
      <div className="space-y-0.5 overflow-hidden" data-day-cell="true">
        {visibleSessions.map((session) => {
          const program = session.programId ? getProgramById(session.programId) : undefined;
          return (
            <button
              key={session.id}
              onClick={(e) => handleSessionClick(e, session)}
              className={`
                w-full text-left px-1.5 py-0.5 rounded-md text-xs truncate
                transition-all duration-200 active:scale-[0.97]
                ${session.completed
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 line-through'
                  : 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 shadow-sm shadow-teal-100/50'
                }
                ${program ? 'border-l-2 border-l-teal-500' : ''}
              `}
              aria-label={`${session.type} session${session.completed ? ', completed' : ''}`}
            >
              <span className="mr-0.5">{getSessionEmoji(session.type)}</span>
              <span className="hidden sm:inline text-[11px]">
                {formatTime(session.scheduledDate) || 'All day'}
              </span>
            </button>
          );
        })}

        {/* Session dot indicators for mobile (when sessions exist but no room for pills) */}
        {sessions.length > 0 && visibleSessions.length === 0 && (
          <div className="flex justify-center gap-0.5 pt-0.5" data-day-cell="true">
            {sessions.slice(0, 3).map((s) => (
              <span
                key={s.id}
                className={`w-1.5 h-1.5 rounded-full ${
                  s.completed ? 'bg-emerald-400' : 'bg-teal-500'
                }`}
              />
            ))}
          </div>
        )}

        {hasMoreSessions && (
          <div
            data-day-cell="true"
            className="text-[10px] text-teal-600 dark:text-teal-400 px-1 font-semibold text-center"
          >
            +{sessions.length - 3}
          </div>
        )}
      </div>
    </div>
  );
});

export default CalendarDay;
