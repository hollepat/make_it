import { formatMonthYear } from '../../utils/dateUtils';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

function ChevronLeftIcon() {
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function CalendarHeader({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <h1 className="text-xl font-semibold text-gray-900">
        {formatMonthYear(currentMonth)}
      </h1>

      <div className="flex items-center gap-1">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
          aria-label="Go to today"
        >
          Today
        </button>

        <button
          onClick={onPreviousMonth}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>

        <button
          onClick={onNextMonth}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
