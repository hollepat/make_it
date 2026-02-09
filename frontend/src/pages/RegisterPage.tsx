import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inviteApi } from '../services/inviteApi';
import { AxiosError } from 'axios';

const inviteCodeRequired = import.meta.env.VITE_INVITE_CODE_REQUIRED !== 'false';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  // Get invite code from URL query param
  const codeFromUrl = inviteCodeRequired ? searchParams.get('code') || '' : '';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(codeFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invite code validation state
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Validate invite code when it changes (with debounce)
  useEffect(() => {
    if (!inviteCodeRequired) return;

    if (!inviteCode.trim()) {
      setCodeValidation(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidatingCode(true);
      setCodeValidation(null);

      try {
        const result = await inviteApi.validateInvite(inviteCode.trim());
        setCodeValidation({
          valid: result.valid,
          message: result.valid
            ? 'Invite code is valid'
            : result.message || 'Invalid or expired invite code',
        });
      } catch (err) {
        console.error('Failed to validate invite code:', err);
        setCodeValidation({
          valid: false,
          message: 'Invalid or expired invite code',
        });
      } finally {
        setIsValidatingCode(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inviteCode]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!displayName.trim()) {
        setError('Please enter your display name');
        return;
      }

      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }

      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (inviteCodeRequired) {
        if (!inviteCode.trim()) {
          setError('Please enter an invite code');
          return;
        }

        if (codeValidation && !codeValidation.valid) {
          setError('Please enter a valid invite code');
          return;
        }
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await register({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          ...(inviteCodeRequired && { inviteCode: inviteCode.trim() }),
        });
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Registration failed:', err);
        if (err instanceof AxiosError) {
          if (err.response?.status === 400) {
            setError(err.response.data?.message || 'Invalid registration data');
          } else if (err.response?.status === 409) {
            setError('An account with this email already exists');
          } else if (err.response?.data?.message) {
            setError(err.response.data.message);
          } else {
            setError('Registration failed. Please try again.');
          }
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [displayName, email, password, inviteCode, codeValidation, register, navigate]
  );

  const isCodeFromUrl = codeFromUrl && inviteCode === codeFromUrl;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            {inviteCodeRequired ? 'Join MakeIt with your invite code' : 'Join MakeIt'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Invite Code */}
            {inviteCodeRequired && (
            <div>
              <label
                htmlFor="inviteCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Invite Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className={`w-full px-4 py-3 text-base border rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                    bg-white transition-shadow pr-10
                    ${isCodeFromUrl ? 'bg-gray-50' : ''}
                    ${codeValidation?.valid === false ? 'border-red-300' : 'border-gray-300'}
                    ${codeValidation?.valid === true ? 'border-green-300' : ''}
                  `}
                  placeholder="Enter your invite code"
                  readOnly={!!isCodeFromUrl}
                  required
                />
                {/* Validation indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidatingCode && (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {!isValidatingCode && codeValidation?.valid === true && (
                    <svg
                      className="w-5 h-5 text-green-500"
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
                  )}
                  {!isValidatingCode && codeValidation?.valid === false && (
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
              </div>
              {codeValidation && (
                <p
                  className={`text-xs mt-1 ${
                    codeValidation.valid ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {codeValidation.message}
                </p>
              )}
            </div>
            )}

            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  bg-white transition-shadow"
                placeholder="How should we call you?"
                autoComplete="name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  bg-white transition-shadow"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  bg-white transition-shadow"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || (codeValidation !== null && !codeValidation.valid)}
              className={`
                w-full py-3 px-4 font-semibold rounded-xl
                transition-all duration-200 active:scale-[0.98]
                flex items-center justify-center gap-2
                ${isSubmitting || (codeValidation !== null && !codeValidation.valid)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/25'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-teal-600 hover:text-teal-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
