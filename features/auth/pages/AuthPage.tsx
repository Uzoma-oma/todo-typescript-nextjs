import React, { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import logo from "../../../assets/logo.png";

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/auth' });
  const { login, signup } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>(search.mode ?? 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signup({ email, password, name });
        setSuccess('Account created successfully!');
        navigate({ to: '/' });
      } else if (mode === 'login') {
        await login({ email, password });
        setSuccess('Logged in successfully!');
        navigate({ to: '/' });
      } else if (mode === 'forgot-password') {
        setSuccess('Password reset link sent to your email!');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-950 via-pink-900 to-purple-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8 ">
          <img src={logo} alt="Logo" className="h-10 mx-auto" />


          <h1 className="text-4xl font-bold text-white mb-2">
             Todo App
          </h1>
          <p className="text-pink-200">
            {mode === 'login' && 'Welcome back! Sign in to continue'}
            {mode === 'signup' && 'Create your account to get started'}
            {mode === 'forgot-password' && 'Reset your password'}
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-pink-100 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-pink-100 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            {/* Password field */}
            {mode !== 'forgot-password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-pink-100 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                {mode === 'signup' && (
                  <p className="mt-1 text-xs text-pink-300">
                    Must be at least 6 characters
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password field (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-pink-100 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              variant="default"
              size="default"
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </span>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot-password' && 'Send Reset Link'}
                </>
              )}
            </Button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 space-y-3">
            {mode === 'login' && (
              <>
                <div className="text-center">
                  <button
                    onClick={() => setMode('forgot-password')}
                    className="text-pink-300 hover:text-pink-200 text-sm transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-pink-200 text-sm">Don't have an account? </span>
                  <button
                    onClick={() => setMode('signup')}
                    className="text-pink-300 hover:text-pink-200 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-center">
                <span className="text-pink-200 text-sm">Already have an account? </span>
                <button
                  onClick={() => setMode('login')}
                  className="text-pink-300 hover:text-pink-200 font-medium transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}

            {mode === 'forgot-password' && (
              <div className="text-center">
                <button
                  onClick={() => setMode('login')}
                  className="text-pink-300 hover:text-pink-200 text-sm transition-colors"
                >
                  Back to login
                </button>
              </div>
            )}
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-xs text-center text-pink-300 mb-2">
              Demo Mode: No API key required
            </p>
            <p className="text-xs text-center text-pink-400">
              Use any email and password to try the app
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-white/80">
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-xs">AI Assistant</p>
          </div>
          <div className="text-white/80">
            <div className="text-2xl mb-1">🔄</div>
            <p className="text-xs">Real-time Sync</p>
          </div>
          <div className="text-white/80">
            <div className="text-2xl mb-1">📱</div>
            <p className="text-xs">Offline Mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}
