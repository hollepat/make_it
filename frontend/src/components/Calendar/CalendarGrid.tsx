import { useMemo } from 'react';
import type { Session } from '../../types';
import CalendarDay from './CalendarDay';
import {
  getCalendarDays,
  isCurrentMonth,
  isSameDayCheck,
  getDayNumber,
} from '../../utils/dateUtils';
import { groupSessionsByDate } from '../../utils/sessionUtils';
import { format } from 'date-fns';

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  sessions: Session[];
  onDateClick: (date: Date) => void;
  onSessionClick: (session: Session) => void;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarGrid({
  currentMonth,
  selectedDate,
  sessions,
  onDateClick,
  onSessionClick,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(), []);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  );

  const sessionsByDate = useMemo(
    () => groupSessionsByDate(sessions),
    [sessions]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 px-2 pt-2 pb-1">
        {WEEKDAY_LABELS.map((day, i) => (
          <div
            key={day}
            className={`
              py-1.5 text-center text-xs font-semibold tracking-wider uppercase
              ${i === 5 || i === 6 ? 'text-gray-400 dark:text-slate-500' : 'text-gray-500 dark:text-slate-400'}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-100/50 dark:bg-slate-800/50 overflow-y-auto px-2 pb-2">
        {calendarDays.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const daySessions = sessionsByDate.get(dateKey) || [];

          return (
            <CalendarDay
              key={dateKey}
              date={date}
              dayNumber={getDayNumber(date)}
              isCurrentMonth={isCurrentMonth(date, currentMonth)}
              isToday={isSameDayCheck(date, today)}
              isSelected={selectedDate ? isSameDayCheck(date, selectedDate) : false}
              sessions={daySessions}
              onClick={onDateClick}
              onSessionClick={onSessionClick}
            />
          );
        })}
      </div>
    </div>
  );
}
