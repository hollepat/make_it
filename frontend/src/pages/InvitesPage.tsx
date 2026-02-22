import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { inviteApi } from '../services/inviteApi';
import type { InviteCode } from '../types/auth';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInviteStatus(invite: InviteCode): 'used' | 'expired' | 'active' {
  if (invite.usedByEmail) {
    return 'used';
  }
  if (new Date(invite.expiresAt) < new Date()) {
    return 'expired';
  }
  return 'active';
}

function getStatusStyles(status: 'used' | 'expired' | 'active'): string {
  switch (status) {
    case 'used':
      return 'bg-blue-100 text-blue-700';
    case 'expired':
      return 'bg-gray-100 text-gray-600';
    case 'active':
      return 'bg-green-100 text-green-700';
  }
}

function getStatusLabel(status: 'used' | 'expired' | 'active'): string {
  switch (status) {
    case 'used':
      return 'Used';
    case 'expired':
      return 'Expired';
    case 'active':
      return 'Active';
  }
}

export default function InvitesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();

  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await inviteApi.listInvites();
      // Sort by created date, newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvites(data);
    } catch (err) {
      console.error('Failed to load invites:', err);
      setError('Failed to load invite codes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleCreateInvite = useCallback(async () => {
    setIsCreating(true);
    setError(null);

    try {
      const newInvite = await inviteApi.createInvite();
      setInvites((prev) => [newInvite, ...prev]);
    } catch (err) {
      console.error('Failed to create invite:', err);
      setError('Failed to create invite code. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, []);

  const handleCopyLink = useCallback(async (invite: InviteCode) => {
    const inviteUrl = `${window.location.origin}/register?code=${invite.code}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(invite.id);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {user?.displayName} ({user?.email})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300/90 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Appearance Section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Appearance</h2>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
              {(
                [
                  { value: 'light', label: 'Light', icon: '☀️' },
                  { value: 'dark', label: 'Dark', icon: '🌙' },
                  { value: 'system', label: 'System', icon: '⚙️' },
                ] as const
              ).map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`
                    flex items-center gap-1 px-3 py-1.5 text-xs font-medium
                    transition-all duration-150
                    ${mode === value
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Invite Codes Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Invite Codes</h2>
            <button
              onClick={handleCreateInvite}
              disabled={isCreating}
              className={`
                px-4 py-2 text-sm font-medium rounded-xl
                transition-all duration-200 active:scale-[0.98]
                flex items-center gap-2
                ${isCreating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/25'
                }
              `}
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Invite
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : invites.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-slate-300 mb-2">No invite codes yet</p>
              <p className="text-sm text-gray-500 dark:text-slate-500">
                Create an invite code to share with friends
              </p>
            </div>
          ) : (
            /* Invite List */
            <div className="space-y-3">
              {invites.map((invite) => {
                const status = getInviteStatus(invite);
                const isActive = status === 'active';

                return (
                  <div
                    key={invite.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Code */}
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm font-mono bg-gray-100 dark:bg-slate-800 dark:text-slate-200 px-2 py-1 rounded">
                            {invite.code}
                          </code>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusStyles(
                              status
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="text-xs text-gray-500 dark:text-slate-400 space-y-0.5">
                          <p>Created: {formatDate(invite.createdAt)}</p>
                          <p>Expires: {formatDate(invite.expiresAt)}</p>
                          {invite.usedByEmail && (
                            <p className="text-blue-600">
                              Used by: {invite.usedByEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Copy Button (only for active invites) */}
                      {isActive && (
                        <button
                          onClick={() => handleCopyLink(invite)}
                          className={`
                            px-3 py-2 text-sm font-medium rounded-lg
                            transition-all duration-200 active:scale-[0.98]
                            flex items-center gap-1.5
                            ${copiedId === invite.id
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {copiedId === invite.id ? (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Copy Link
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
