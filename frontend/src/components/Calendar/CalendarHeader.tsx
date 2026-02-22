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
      strokeWidth="2.5"
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
      strokeWidth="2.5"
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
    <div className="relative px-5 pt-4 pb-3 flex-shrink-0">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-teal-subtle" />
      {/* Soft bottom divider */}
      <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-teal-200/60 to-transparent" />

      <div className="relative flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-50 animate-month-enter"
          key={formatMonthYear(currentMonth)}
        >
          {formatMonthYear(currentMonth)}
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="px-3.5 py-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 active:bg-teal-200 dark:active:bg-teal-900/70 rounded-full transition-all duration-200 active:scale-95"
            aria-label="Go to today"
          >
            Today
          </button>

          <div className="flex items-center bg-gray-100/80 dark:bg-slate-800/80 rounded-full p-0.5">
            <button
              onClick={onPreviousMonth}
              className="p-2 text-gray-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90"
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={onNextMonth}
              className="p-2 text-gray-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all duration-200 active:scale-90"
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
