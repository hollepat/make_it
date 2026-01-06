import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';

/**
 * Get all days to display in a calendar month view,
 * including padding days from previous/next months
 */
export function getCalendarDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * Navigate to next month
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

/**
 * Check if a date is in the current displayed month
 */
export function isCurrentMonth(date: Date, currentMonth: Date): boolean {
  return isSameMonth(date, currentMonth);
}

/**
 * Check if two dates are the same day
 */
export function isSameDayCheck(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

/**
 * Format a date for display in the calendar header
 */
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

/**
 * Format a date for the session card
 */
export function formatSessionDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'EEE, MMM d');
}

/**
 * Get relative date string (Today, Tomorrow, In X days, etc.)
 */
export function getRelativeDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Today';
  }

  if (isTomorrow(date)) {
    return 'Tomorrow';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  // For dates within the next week, show relative
  const now = new Date();
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays > 0 && diffInDays <= 7) {
    return `In ${diffInDays} days`;
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format time from ISO date string
 */
export function formatTime(dateString: string): string | null {
  const date = parseISO(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // If time is midnight (00:00), treat as "all day"
  if (hours === 0 && minutes === 0) {
    return null;
  }

  return format(date, 'h:mm a');
}

/**
 * Format duration in minutes to a readable string
 */
export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;

  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Get day number for calendar display
 */
export function getDayNumber(date: Date): number {
  return date.getDate();
}

/**
 * Convert a Date to ISO string (for API)
 */
export function toISOString(date: Date, time?: string): string {
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate.toISOString();
  }

  // Set to midnight for "all day" sessions
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate.toISOString();
}

/**
 * Format date for input[type="date"]
 */
export function toInputDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse input date string to Date
 */
export function parseInputDate(dateString: string): Date {
  return parseISO(dateString);
}
