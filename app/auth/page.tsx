'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AuthPage() {
  const router = useRouter();
  const { login, signup, isAuthenticated, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
        router.push('/');
      } else if (mode === 'signup') {
        await signup({ email, password, name });
        router.push('/');
      } else {
        setError('Password reset not implemented yet');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pink-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-pink-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-950 mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-gray-600">
            {mode === 'login'
              ? 'Sign in to access your todos'
              : mode === 'signup'
              ? 'Join us to start organizing your tasks'
              : 'Enter your email to reset your password'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900"
              placeholder="you@example.com"
            />
          </div>

          {mode !== 'forgot-password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition-colors"
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Sign Up'
              : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          {mode === 'login' && (
            <>
              <button
                onClick={() => setMode('forgot-password')}
                className="w-full text-center text-sm text-pink-600 hover:text-pink-700 transition-colors"
              >
                Forgot password?
              </button>
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Sign in
              </button>
            </div>
          )}

          {mode === 'forgot-password' && (
            <div className="text-center text-sm text-gray-600">
              Remember your password?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-pink-600 hover:text-pink-700 font-medium transition-colors"
              >
                Sign in
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-500">
            AI-Powered • Real-time Collaboration • Offline Support
          </p>
        </div>
      </div>
    </div>
  );
}