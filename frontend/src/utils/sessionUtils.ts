import type { Session } from '../types';

/**
 * Session types with their display properties
 */
export const SESSION_TYPES = {
  run: { emoji: '\u{1F3C3}', label: 'Run', color: 'bg-blue-500' },
  boulder: { emoji: '\u{1F9D7}', label: 'Boulder', color: 'bg-amber-500' },
  gym: { emoji: '\u{1F4AA}', label: 'Gym', color: 'bg-purple-500' },
  swim: { emoji: '\u{1F3CA}', label: 'Swim', color: 'bg-cyan-500' },
  bike: { emoji: '\u{1F6B4}', label: 'Bike', color: 'bg-green-500' },
  other: { emoji: '\u{1F3CB}\u{FE0F}', label: 'Other', color: 'bg-gray-500' },
} as const;

export type SessionType = keyof typeof SESSION_TYPES;

/**
 * Get emoji for a session type
 */
export function getSessionEmoji(type: string): string {
  const normalizedType = type.toLowerCase() as SessionType;
  return SESSION_TYPES[normalizedType]?.emoji || SESSION_TYPES.other.emoji;
}

/**
 * Get label for a session type
 */
export function getSessionLabel(type: string): string {
  const normalizedType = type.toLowerCase() as SessionType;
  return SESSION_TYPES[normalizedType]?.label || type;
}

/**
 * Get color class for a session type
 */
export function getSessionColor(type: string): string {
  const normalizedType = type.toLowerCase() as SessionType;
  return SESSION_TYPES[normalizedType]?.color || SESSION_TYPES.other.color;
}

/**
 * Default program ID for sessions (MVP: no multi-program support)
 */
export const DEFAULT_PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Duration presets in minutes
 */
export const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

/**
 * Group sessions by date (for calendar view)
 */
export function groupSessionsByDate(sessions: Session[]): Map<string, Session[]> {
  const grouped = new Map<string, Session[]>();

  sessions.forEach((session) => {
    // Extract just the date part (YYYY-MM-DD) from the scheduledDate
    const dateKey = session.scheduledDate.split('T')[0];

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }

    grouped.get(dateKey)!.push(session);
  });

  // Sort sessions within each day by time
  grouped.forEach((daySessions, key) => {
    grouped.set(
      key,
      daySessions.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    );
  });

  return grouped;
}

/**
 * Get sessions for a specific date
 */
export function getSessionsForDate(
  sessions: Session[],
  date: Date
): Session[] {
  const dateKey = date.toISOString().split('T')[0];
  const grouped = groupSessionsByDate(sessions);
  return grouped.get(dateKey) || [];
}

/**
 * Filter upcoming incomplete sessions
 */
export function getUpcomingIncompleteSessions(sessions: Session[]): Session[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return sessions
    .filter((session) => {
      const sessionDate = new Date(session.scheduledDate);
      sessionDate.setHours(0, 0, 0, 0);
      return !session.completed && sessionDate >= now;
    })
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

/**
 * Truncate notes for preview
 */
export function truncateNotes(notes: string | null, maxLength: number = 50): string | null {
  if (!notes) return null;
  if (notes.length <= maxLength) return notes;
  return notes.substring(0, maxLength).trim() + '...';
}
