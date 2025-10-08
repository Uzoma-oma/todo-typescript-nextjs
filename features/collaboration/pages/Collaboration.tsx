import React, { useState, useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Button } from '../../../components/ui/button';
import { useRealtime } from '../../../contexts/RealtimeContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function Collaboration() {
  const search = useSearch({ from: '/collaborate' });
  const { user } = useAuth();
  const { 
    isConnected, 
    activeUsers, 
    onlineCount,
    cursors,
    typingUsers,
    joinRoom,
    leaveRoom,
    emitCursorMove
  } = useRealtime();

  const [roomId, setRoomId] = useState(search.room || 'default');
  const [roomInput, setRoomInput] = useState('');
  const [messages, setMessages] = useState<Array<{ user: string; text: string; timestamp: number }>>([]);
  const [messageInput, setMessageInput] = useState('');

  // Join room on mount
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }

    return () => {
      if (roomId) {
        leaveRoom(roomId);
      }
    };
  }, [roomId]);

  // Track cursor movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isConnected) {
        emitCursorMove(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isConnected]);

  const handleJoinRoom = () => {
    if (roomInput.trim()) {
      setRoomId(roomInput);
      setRoomInput('');
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        user: user?.name || user?.email || 'Anonymous',
        text: messageInput,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
    }
  };

  return (
    <div className="min-h-screen bg-pink-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Real-time Collaboration</h1>
          <p className="text-pink-200">
            Collaborate with your team in real-time
          </p>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`bg-white/10 backdrop-blur rounded-lg p-6 border-2 ${
            isConnected ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <div>
                <div className="font-semibold">Connection Status</div>
                <div className="text-sm text-pink-200">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">👥</div>
              <div>
                <div className="font-semibold">Active Users</div>
                <div className="text-2xl font-bold text-green-400">{onlineCount}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏠</div>
              <div>
                <div className="font-semibold">Current Room</div>
                <div className="text-sm text-pink-200 truncate">{roomId}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Join or Create Room</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder="Enter room name..."
              className="flex-1 px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!roomInput.trim()}
              variant="default"
              size="default"
              className="bg-pink-600 hover:bg-pink-700"
            >
              Join Room
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setRoomInput('general')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            >
              #general
            </button>
            <button
              onClick={() => setRoomInput('work')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            >
              #work
            </button>
            <button
              onClick={() => setRoomInput('team')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            >
              #team
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Users Panel */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Active Users</h2>
            <div className="space-y-3">
              {activeUsers.length === 0 ? (
                <div className="text-center py-8 text-pink-300">
                  <p>No other users online</p>
                  <p className="text-sm mt-2">Invite your team to collaborate!</p>
                </div>
              ) : (
                activeUsers.map((activeUser) => (
                  <div
                    key={activeUser.userId}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {activeUser.userName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{activeUser.userName}</div>
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        {activeUser.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Current User */}
              <div className="flex items-center gap-3 p-3 bg-pink-600/20 rounded-lg border border-pink-500">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'Y'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user?.name || 'You'}</div>
                  <div className="text-xs text-pink-300">You (current user)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur rounded-lg p-6 flex flex-col h-[600px]">
            <h2 className="text-xl font-bold mb-4">Team Chat</h2>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-pink-300">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start a conversation with your team!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.user === (user?.name || user?.email)
                        ? 'bg-pink-600/30 ml-auto max-w-[80%]'
                        : 'bg-white/5 mr-auto max-w-[80%]'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">{msg.user}</div>
                    <div>{msg.text}</div>
                    <div className="text-xs text-pink-300 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="text-sm text-pink-300 italic">
                  {Array.from(typingUsers).length} user(s) typing...
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                disabled={!isConnected}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !isConnected}
                variant="default"
                size="default"
                className="bg-pink-600 hover:bg-pink-700"
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Collaborative Cursors Overlay */}
        {Array.from(cursors.entries()).map(([userId, cursor]) => (
          <div
            key={userId}
            className="fixed pointer-events-none z-50"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative">
              <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-lg"></div>
              <div className="absolute top-4 left-4 bg-purple-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                {cursor.userName}
              </div>
            </div>
          </div>
        ))}

        {/* Features Info */}
        <div className="mt-8 bg-blue-500/10 backdrop-blur rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Real-time Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-300 mb-1">Live Presence</div>
              <p className="text-pink-200">See who's online and active in real-time</p>
            </div>
            <div>
              <div className="font-medium text-blue-300 mb-1">Cursor Tracking</div>
              <p className="text-pink-200">See where other users are working</p>
            </div>
            <div>
              <div className="font-medium text-blue-300 mb-1">Instant Sync</div>
              <p className="text-pink-200">Changes sync across all connected clients</p>
            </div>
            <div>
              <div className="font-medium text-blue-300 mb-1">Team Chat</div>
              <p className="text-pink-200">Communicate with your team in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}