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
  const { sessions, loading, error, toggleCompletion, setSelectedDate } = useSession();

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Failed to load sessions
          </h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
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
      />
    </div>
  );
}
