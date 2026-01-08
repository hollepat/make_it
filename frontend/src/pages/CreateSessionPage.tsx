import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import {
  SESSION_TYPES,
  DURATION_PRESETS,
  type SessionType,
} from '../utils/sessionUtils';
import {
  toInputDateString,
  toISOString,
  parseInputDate,
} from '../utils/dateUtils';

interface LocationState {
  selectedDate?: string;
}

export default function CreateSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createSession } = useSession();

  // Get selected date from navigation state or use today
  const initialDate = (location.state as LocationState)?.selectedDate
    ? new Date((location.state as LocationState).selectedDate!)
    : new Date();

  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [date, setDate] = useState(toInputDateString(initialDate));
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!sessionType) {
        setError('Please select a session type');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const scheduledDate = toISOString(parseInputDate(date), time || undefined);

        await createSession({
          type: sessionType,
          scheduledDate,
          notes: notes.trim() || undefined,
          durationMinutes: duration || undefined,
        });

        navigate('/');
      } catch (err) {
        console.error('Failed to create session:', err);
        setError('Failed to create session. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [sessionType, date, time, duration, notes, createSession, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const sessionTypeEntries = Object.entries(SESSION_TYPES) as [
    SessionType,
    (typeof SESSION_TYPES)[SessionType]
  ][];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">New Session</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Schedule a new training session
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-6">
          {/* Session Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Session Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sessionTypeEntries.map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSessionType(type)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-xl
                    border-2 transition-all duration-200 active:scale-95
                    ${sessionType === type
                      ? 'border-teal-500 bg-teal-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                  aria-pressed={sessionType === type}
                >
                  <span className="text-2xl mb-1">{config.emoji}</span>
                  <span
                    className={`text-sm font-medium ${
                      sessionType === type ? 'text-teal-700' : 'text-gray-700'
                    }`}
                  >
                    {config.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                bg-white transition-shadow"
              required
            />
          </div>

          {/* Time Picker (Optional) */}
          <div>
            <label
              htmlFor="time"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Time{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="time"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                bg-white transition-shadow"
              placeholder="All day"
            />
            {!time && (
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for all-day session
              </p>
            )}
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setDuration(duration === preset ? null : preset)
                  }
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 active:scale-95
                    ${duration === preset
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  aria-pressed={duration === preset}
                >
                  {preset >= 60
                    ? `${preset / 60}h${preset % 60 ? ` ${preset % 60}m` : ''}`
                    : `${preset}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notes{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                bg-white transition-shadow resize-none"
              placeholder="Add any notes about this session..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-16 bg-white border-t border-gray-200 p-4 safe-area-bottom">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold
                rounded-xl hover:bg-gray-200 transition-colors active:scale-[0.98]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !sessionType}
              className={`
                flex-1 py-3 px-4 font-semibold rounded-xl
                transition-all duration-200 active:scale-[0.98]
                flex items-center justify-center gap-2
                ${isSubmitting || !sessionType
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/25'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Session'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
