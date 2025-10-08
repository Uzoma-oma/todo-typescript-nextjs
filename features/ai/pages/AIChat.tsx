import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import { aiService, ChatMessage } from '../../../services/aiService';
import { useAI } from '../../../contexts/AIContext';

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  context?: {
    type: 'general' | 'todo' | 'productivity';
    todoId?: number;
  };
}

export default function AIChat() {
  const search = useSearch({ from: '/ai-chat' });
  const navigate = useNavigate();
  const { isAIEnabled } = useAI();
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [chatType, setChatType] = useState<'general' | 'todo-suggestions' | 'productivity' | 'help'>('general');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Load saved sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('ai-chat-sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      
      // Load the most recent session or create new one
      if (parsed.length > 0) {
        const latestSession = parsed[0];
        setCurrentSessionId(latestSession.id);
        setMessages(latestSession.messages);
      } else {
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Load todos for context
  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const cached = localStorage.getItem('todos');
      return cached ? JSON.parse(cached) : [];
    },
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Save sessions to localStorage
  const saveSessions = useCallback((updatedSessions: ChatSession[]) => {
    localStorage.setItem('ai-chat-sessions', JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
  }, []);

  // Create new chat session
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [{
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm your AI assistant. I can help you with:\n\n• Creating and organizing todos\n• Productivity tips and strategies\n• Breaking down complex tasks\n• Time management advice\n• General task management\n\nHow can I help you today?",
        timestamp: Date.now(),
      }],
      createdAt: Date.now(),
      context: { type: 'general' },
    };

    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    
    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
  };

  // Switch between sessions
  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  // Delete session
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(updatedSessions);
    
    if (sessionId === currentSessionId) {
      if (updatedSessions.length > 0) {
        switchSession(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // Update session title based on first user message
  const updateSessionTitle = (sessionId: string, firstMessage: string) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId && session.title === 'New Chat') {
        return {
          ...session,
          title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : ''),
        };
      }
      return session;
    });
    saveSessions(updatedSessions);
  };

  // Send message with streaming support
  const sendMessage = async (useStreaming: boolean = false) => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    // Update session title if this is the first user message
    if (messages.length === 1) {
      updateSessionTitle(currentSessionId, inputMessage);
    }

    try {
      let aiResponse: ChatMessage;
      
      if (useStreaming) {
        setIsStreaming(true);
        setStreamingMessage('');
        
        aiResponse = await aiService.streamMessage(
          newMessages,
          {
            todoContext: todos,
            chatType,
          },
          (chunk: string) => {
            setStreamingMessage(prev => prev + chunk);
          }
        );
        
        setIsStreaming(false);
        setStreamingMessage('');
      } else {
        aiResponse = await aiService.sendMessage(newMessages, {
          todoContext: todos,
          chatType,
        });
      }

      const finalMessages = [...newMessages, aiResponse];
      setMessages(finalMessages);

      // Update session in storage
      const updatedSessions = sessions.map(session => {
        if (session.id === currentSessionId) {
          return { ...session, messages: finalMessages };
        }
        return session;
      });
      saveSessions(updatedSessions);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle textarea resize
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action buttons
  const quickActions = [
    {
      label: 'Analyze my productivity',
      action: () => setInputMessage('Can you analyze my current todos and give me productivity insights?')
    },
    {
      label: 'Suggest todo improvements',
      action: () => setInputMessage('Can you suggest ways to improve my current todos?')
    },
    {
      label: 'Time management tips',
      action: () => setInputMessage('Give me some time management tips for handling my tasks better')
    },
    {
      label: 'Break down complex task',
      action: () => setInputMessage('Help me break down a complex task into smaller steps')
    }
  ];

  if (!isAIEnabled) {
    return (
      <div className="min-h-screen bg-pink-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-2xl font-bold mb-4">AI Assistant Disabled</h1>
          <p className="text-pink-200 mb-6">
            The AI assistant is currently disabled. Enable it in settings to start chatting.
          </p>
          <Button
            onClick={() => navigate({ to: '/settings', search: { tab: 'ai' } })}
            variant="default"
            size="default"
            className="bg-pink-600 hover:bg-pink-700"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-950 text-white flex">
      {/* Sidebar - Chat Sessions */}
      <div className="w-80 bg-pink-900/50 border-r border-pink-800 flex flex-col">
        <div className="p-4 border-b border-pink-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <Button
              onClick={createNewSession}
              variant="outline"
              size="sm"
              className="bg-pink-800 border-pink-700 hover:bg-pink-700 text-white"
            >
              + New Chat
            </Button>
          </div>
          
          {/* Chat Type Selector */}
          <select
            value={chatType}
            onChange={(e) => setChatType(e.target.value as any)}
            className="w-full px-3 py-2 bg-pink-800 border border-pink-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="general">General Assistant</option>
            <option value="todo-suggestions">Todo Helper</option>
            <option value="productivity">Productivity Coach</option>
            <option value="help">Help & Support</option>
          </select>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 border-b border-pink-800/50 cursor-pointer hover:bg-pink-800/30 transition-colors ${
                session.id === currentSessionId ? 'bg-pink-800/50' : ''
              }`}
              onClick={() => switchSession(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{session.title}</div>
                  <div className="text-xs text-pink-300 mt-1">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="text-pink-400 hover:text-red-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-pink-800 text-xs text-pink-300">
          <div>Sessions: {sessions.length}</div>
          <div>Current: {messages.length} messages</div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-pink-900/30 px-6 py-4 border-b border-pink-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">AI Chat Assistant</h1>
              <p className="text-pink-200 text-sm">
                {chatType === 'general' && 'General productivity and task management help'}
                {chatType === 'todo-suggestions' && 'Specialized in todo creation and optimization'}
                {chatType === 'productivity' && 'Focused on productivity tips and strategies'}
                {chatType === 'help' && 'Help and support for using the app'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                AI Online
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                )}
                
                <div
                  className={`max-w-3xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-pink-600 text-white ml-auto'
                      : 'bg-white/10 backdrop-blur'
                  }`}
                >
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {message.content}
                    </pre>
                  </div>
                  {message.tokens && (
                    <div className="text-xs text-pink-300 mt-2 opacity-70">
                      {message.tokens} tokens
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">👤</span>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {isStreaming && streamingMessage && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div className="max-w-3xl px-4 py-3 rounded-lg bg-white/10 backdrop-blur">
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {streamingMessage}
                      <span className="animate-pulse">▋</span>
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !isStreaming && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div className="px-4 py-3 rounded-lg bg-white/10 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-pink-200">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-6 py-2">
            <div className="max-w-4xl mx-auto">
              <div className="text-sm text-pink-200 mb-3">Quick actions:</div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-pink-900/30 px-6 py-4 border-t border-pink-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about todos, productivity, or task management..."
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-pink-700 rounded-lg text-white placeholder-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none min-h-[48px] max-h-32"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-2 text-xs text-pink-400">
                  Enter to send • Shift+Enter for new line
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => sendMessage(false)}
                  disabled={!inputMessage.trim() || isLoading}
                  variant="default"
                  size="default"
                  className="bg-pink-600 hover:bg-pink-700 text-white min-w-[80px]"
                >
                  {isLoading ? '...' : 'Send'}
                </Button>
                <Button
                  onClick={() => sendMessage(true)}
                  disabled={!inputMessage.trim() || isLoading}
                  variant="outline"
                  size="default"
                  className="border-pink-600 text-pink-300 hover:bg-pink-800 min-w-[80px]"
                  title="Send with streaming response"
                >
                  Stream
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}