import { useState, useEffect } from 'react';
import type { Session } from '../types';
import { sessionApi } from '../services/api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionApi.listSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const updated = await sessionApi.toggleCompletion(id);
      setSessions(sessions.map(s => s.id === id ? updated : s));
    } catch (err) {
      console.error('Failed to toggle completion', err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Training Sessions</h1>

        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-gray-500">No sessions yet</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getTypeEmoji(session.type)}
                    </span>
                    <div>
                      <h3 className="font-semibold capitalize">{session.type}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(session.scheduledDate).toLocaleDateString()}
                      </p>
                      {session.notes && (
                        <p className="text-sm text-gray-600 mt-1">{session.notes}</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleComplete(session.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    session.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {session.completed ? '✓ Done' : 'Mark Done'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    run: '🏃',
    boulder: '🧗',
    gym: '💪',
    swim: '🏊',
    bike: '🚴',
  };
  return emojis[type.toLowerCase()] || '🏋️';
}
