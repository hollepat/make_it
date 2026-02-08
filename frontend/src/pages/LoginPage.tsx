import { useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the intended destination from state, default to home
  const from = (location.state as LocationState)?.from?.pathname || '/';

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email.trim() || !password) {
        setError('Please enter your email and password');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await login({ email: email.trim(), password });
        navigate(from, { replace: true });
      } catch (err) {
        console.error('Login failed:', err);
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            setError('Invalid email or password');
          } else if (err.response?.data?.message) {
            setError(err.response.data.message);
          } else {
            setError('Login failed. Please try again.');
          }
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, login, navigate, from]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900">MakeIt</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to manage your training
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
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
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  bg-white transition-shadow"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
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
              disabled={isSubmitting}
              className={`
                w-full py-3 px-4 font-semibold rounded-xl
                transition-all duration-200 active:scale-[0.98]
                flex items-center justify-center gap-2
                ${isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/25'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-teal-600 hover:text-teal-700"
            >
              Register with invite code
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
