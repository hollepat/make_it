import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '../types';
import { useSession } from '../context/SessionContext';
import CalendarHeader from '../components/Calendar/CalendarHeader';
import CalendarGrid from '../components/Calendar/CalendarGrid';
import SessionDetailModal from '../components/SessionDetailModal';
import { getNextMonth, getPreviousMonth } from '../utils/dateUtils';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { sessions, loading, error, toggleCompletion, deleteSession, setSelectedDate } = useSession();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => getPreviousMonth(prev));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => getNextMonth(prev));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDay(new Date());
  }, []);

  const handleDateClick = useCallback(
    (date: Date) => {
      setSelectedDay(date);
      setSelectedDate(date);
      // Navigate to create page with the selected date
      navigate('/create', { state: { selectedDate: date.toISOString() } });
    },
    [navigate, setSelectedDate]
  );

  const handleSessionClick = useCallback((session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSession(null);
  }, []);

  const handleToggleComplete = useCallback(
    async (id: string) => {
      await toggleCompletion(id);
      // Update the selected session to reflect the change
      setSelectedSession((prev) => {
        if (prev && prev.id === id) {
          return { ...prev, completed: !prev.completed };
        }
        return prev;
      });
    },
    [toggleCompletion]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSession(id);
    },
    [deleteSession]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-teal-50/50 to-white dark:from-slate-950 dark:to-slate-950">
        <div className="text-center animate-fade-in">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-teal-100 dark:bg-teal-900/30 animate-pulse-subtle" />
            <div className="absolute inset-1 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 p-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-7 h-7 text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-1">
            Failed to load sessions
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-slate-950 overflow-hidden">
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <CalendarGrid
        currentMonth={currentMonth}
        selectedDate={selectedDay}
        sessions={sessions}
        onDateClick={handleDateClick}
        onSessionClick={handleSessionClick}
      />

      <SessionDetailModal
        session={selectedSession}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDelete}
      />
    </div>
  );
}
