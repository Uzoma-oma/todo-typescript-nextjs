'use client';

import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Providers } from './providers';
import { Button } from '@/components/ui/button';
import { useOffline } from '@/contexts/OfflineContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useAI } from '@/contexts/AIContext';
import { useAuth } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const { isOffline, syncQueue } = useOffline();
  const { isConnected, activeUsers, todoUpdates } = useRealtime();
  const { isAIEnabled } = useAI();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  if (pathname === '/auth') {
    return <>{children}</>;
  }

  const navigationItems = [
    { path: '/', label: 'Todos', icon: '📝' },
    { path: '/ai-chat', label: 'AI Chat', icon: '🤖', premium: true },
    { path: '/collaborate', label: 'Collaborate', icon: '👥', premium: true },
    { path: '/features', label: 'Features', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen bg-pink-950 text-white">
      {isAuthenticated && (
        <div className="bg-pink-900/50 px-4 py-2 text-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              {isOffline && (
                <div className="flex items-center gap-2 text-amber-300">
                  <div className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></div>
                  <span>Offline Mode</span>
                  {syncQueue.length > 0 && (
                    <span className="bg-amber-300 text-pink-950 px-2 py-1 rounded text-xs">
                      {syncQueue.length} pending
                    </span>
                  )}
                </div>
              )}

              {!isOffline && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}
                  ></div>
                  <span className="text-pink-200">
                    {isConnected ? 'Real-time Connected' : 'Connecting...'}
                  </span>
                  {isConnected && activeUsers.length > 0 && (
                    <span className="bg-green-400 text-pink-950 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {activeUsers.length + 1} online
                    </span>
                  )}
                </div>
              )}

              {todoUpdates.length > 0 && (
                <div className="flex items-center gap-2 text-blue-300">
                  <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-xs">Live updates</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isAIEnabled && (
                <div className="flex items-center gap-1 text-purple-300">
                  <span className="text-xs">🤖 AI Ready</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isConnected && (
                  <Link
                    href="/collaborate"
                    className="text-xs text-green-300 hover:text-green-200 underline"
                  >
                    Collaboration Room
                  </Link>
                )}
                <Link
                  href="/features"
                  className="text-xs text-pink-300 hover:text-white"
                >
                  All Features
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="w-full bg-pink-50 py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-4 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt="Todo App Logo" className="h-10 sm:h-12" />
              <div className="text-left">
                <h1 className="text-2xl sm:text-4xl font-bold text-pink-950">
                  Todo App
                </h1>
                <p className="text-sm text-pink-700 hidden sm:block">
                  AI-Powered • Real-time • Offline-Ready
                </p>
              </div>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <nav className="hidden lg:flex items-center gap-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-pink-200 text-pink-950'
                          : 'text-pink-700 hover:bg-pink-100 hover:text-pink-950'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="hidden xl:inline">{item.label}</span>
                        {item.premium && (
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1 py-0.5 rounded">
                            PRO
                          </span>
                        )}
                      </span>
                    </Link>
                  ))}
                </nav>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-pink-200 hover:bg-pink-300 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user?.name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        'U'}
                    </div>
                    <span className="text-pink-950 font-medium hidden md:block">
                      {user?.name || user?.email}
                    </span>
                    <svg
                      className="w-4 h-4 text-pink-950"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-pink-200 z-50">
                      <div className="p-4 border-b border-pink-200">
                        <p className="text-sm font-medium text-pink-950">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-pink-950 hover:bg-pink-50 transition-colors"
                        >
                          ⚙️ Settings
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  variant="outline"
                  size="sm"
                  className="lg:hidden border-pink-300 text-pink-700 hover:bg-pink-100"
                >
                  {isMenuOpen ? '✕' : '☰'}
                </Button>
              </div>
            ) : null}
          </div>

          {isMenuOpen && isAuthenticated && (
            <nav className="lg:hidden mt-4 pt-4 border-t border-pink-200">
              <div className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`relative p-3 rounded-lg font-medium text-center transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-pink-200 text-pink-950'
                        : 'text-pink-700 hover:bg-pink-100 hover:text-pink-950'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                      {item.premium && (
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1 py-0.5 rounded">
                          PRO
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {isAIEnabled && isAuthenticated && pathname !== '/ai-chat' && (
        <Link
          href="/ai-chat"
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 z-50"
          title="Quick AI Chat"
        >
          <span className="text-xl">🤖</span>
        </Link>
      )}

      {activeUsers.length > 0 && isAuthenticated && pathname === '/' && (
        <div className="fixed bottom-6 left-6 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg z-40">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(activeUsers.length, 3) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 bg-white text-green-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-green-500"
                  >
                    {i + 1}
                  </div>
                )
              )}
              {activeUsers.length > 3 && (
                <div className="w-6 h-6 bg-white text-green-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-green-500">
                  +{activeUsers.length - 3}
                </div>
              )}
            </div>
            <span className="text-sm font-medium">collaborating</span>
          </div>
        </div>
      )}

      {syncQueue.length > 0 && isAuthenticated && (
        <div className="fixed bottom-20 right-6 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg z-40">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span className="text-sm">Syncing {syncQueue.length} items...</span>
          </div>
        </div>
      )}
    </div>
  );
}