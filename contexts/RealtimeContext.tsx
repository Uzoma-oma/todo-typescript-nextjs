'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { realtimeService, TodoUpdate, UserPresence, CursorPosition } from '../services/realtimeService';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
  isConnected: boolean;
  activeUsers: UserPresence[];
  onlineCount: number;
  todoUpdates: TodoUpdate[];
  cursors: Map<string, CursorPosition>;
  typingUsers: Set<string>;
  connect: () => void;
  disconnect: () => void;
  emitTodoChange: (type: TodoUpdate['type'], todo: any) => void;
  emitCursorMove: (x: number, y: number, todoId?: number) => void;
  emitTyping: (isTyping: boolean, todoId?: number) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [todoUpdates, setTodoUpdates] = useState<TodoUpdate[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  // Setup event listeners
  useEffect(() => {
    // Connection events
    realtimeService.on('connection', (data: any) => {
      setIsConnected(data.status === 'connected' || data.status === 'polling');
    });

    // Todo events
    realtimeService.on('todo:created', (data: TodoUpdate) => {
      setTodoUpdates(prev => [...prev, data]);
    });

    realtimeService.on('todo:updated', (data: TodoUpdate) => {
      setTodoUpdates(prev => [...prev, data]);
    });

    realtimeService.on('todo:deleted', (data: TodoUpdate) => {
      setTodoUpdates(prev => [...prev, data]);
    });

    // User presence events
    realtimeService.on('user:joined', (data: UserPresence) => {
      setActiveUsers(prev => [...prev, data]);
    });

    realtimeService.on('user:left', (data: UserPresence) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    realtimeService.on('users:list', (data: UserPresence[]) => {
      setActiveUsers(data);
    });

    // Cursor tracking
    realtimeService.on('cursor:move', (data: CursorPosition) => {
      setCursors(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, data);
        return newMap;
      });

      // Remove cursor after 3 seconds of inactivity
      setTimeout(() => {
        setCursors(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      }, 3000);
    });

    // Typing indicators
    realtimeService.on('typing:start', (data: { userId: string; userName: string }) => {
      setTypingUsers(prev => new Set(prev).add(data.userId));
    });

    realtimeService.on('typing:stop', (data: { userId: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    return () => {
      // Cleanup listeners
    };
  }, []);

  const connect = () => {
    realtimeService.connect();
  };

  const disconnect = () => {
    realtimeService.disconnect();
    setIsConnected(false);
    setActiveUsers([]);
    setCursors(new Map());
    setTypingUsers(new Set());
  };

  const emitTodoChange = (type: TodoUpdate['type'], todo: any) => {
    realtimeService.emitTodoChange(type, todo);
  };

  const emitCursorMove = (x: number, y: number, todoId?: number) => {
    realtimeService.emitCursorPosition(x, y, todoId);
  };

  const emitTyping = (isTyping: boolean, todoId?: number) => {
    realtimeService.emitTyping(isTyping, todoId);
  };

  const joinRoom = (roomId: string) => {
    realtimeService.joinRoom(roomId);
  };

  const leaveRoom = (roomId: string) => {
    realtimeService.leaveRoom(roomId);
  };

  const value: RealtimeContextType = {
    isConnected,
    activeUsers,
    onlineCount: activeUsers.length + 1, // +1 for current user
    todoUpdates,
    cursors,
    typingUsers,
    connect,
    disconnect,
    emitTodoChange,
    emitCursorMove,
    emitTyping,
    joinRoom,
    leaveRoom,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};