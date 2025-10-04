import { io, Socket } from 'socket.io-client';
import { authService } from './authService';

// FIX: Use hardcoded API URL directly (TypeScript safe)
const SOCKET_URL = 'https://api.oluwasetemi.dev';

export interface TodoUpdate {
  type: 'create' | 'update' | 'delete' | 'toggle';
  todo: any;
  userId: string;
  timestamp: number;
}

export interface UserPresence {
  userId: string;
  userName: string;
  lastSeen: number;
  status: 'online' | 'away' | 'offline';
}

export interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  todoId?: number;
}

class RealtimeService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();

  // Initialize connection
  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const token = authService.getToken();
    if (!token) {
      console.warn('No auth token, skipping socket connection');
      return;
    }

    try {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Socket connection error:', error);
      this.useFallbackPolling();
    }
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Max reconnection attempts reached, switching to polling');
        this.useFallbackPolling();
      }
    });

    // Todo-related events
    this.socket.on('todo:created', (data: TodoUpdate) => {
      this.emit('todo:created', data);
    });

    this.socket.on('todo:updated', (data: TodoUpdate) => {
      this.emit('todo:updated', data);
    });

    this.socket.on('todo:deleted', (data: TodoUpdate) => {
      this.emit('todo:deleted', data);
    });

    // User presence events
    this.socket.on('user:joined', (data: UserPresence) => {
      this.emit('user:joined', data);
    });

    this.socket.on('user:left', (data: UserPresence) => {
      this.emit('user:left', data);
    });

    this.socket.on('users:list', (data: UserPresence[]) => {
      this.emit('users:list', data);
    });

    // Cursor tracking
    this.socket.on('cursor:move', (data: CursorPosition) => {
      this.emit('cursor:move', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data: { userId: string; userName: string; todoId?: number }) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: { userId: string; todoId?: number }) => {
      this.emit('typing:stop', data);
    });
  }

  // Emit todo changes
  emitTodoChange(type: TodoUpdate['type'], todo: any): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, change not emitted');
      return;
    }

    const update: TodoUpdate = {
      type,
      todo,
      userId: authService.getToken() || 'anonymous',
      timestamp: Date.now(),
    };

    this.socket.emit('todo:change', update);
  }

  // Emit cursor position
  emitCursorPosition(x: number, y: number, todoId?: number): void {
    if (!this.socket?.connected) return;

    const position: CursorPosition = {
      userId: authService.getToken() || 'anonymous',
      userName: 'User', // Get from auth context
      x,
      y,
      todoId,
    };

    this.socket.emit('cursor:move', position);
  }

  // Emit typing indicator
  emitTyping(isTyping: boolean, todoId?: number): void {
    if (!this.socket?.connected) return;

    const event = isTyping ? 'typing:start' : 'typing:stop';
    this.socket.emit(event, { todoId });
  }

  // Subscribe to events
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  // Unsubscribe from events
  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  // Emit to local listeners
  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get active users count
  getActiveUsersCount(): number {
    // This will be populated from server events
    return 1; // Default to current user
  }

  // Fallback to polling when WebSocket fails
  private useFallbackPolling(): void {
    console.log('Using fallback polling mechanism');
    
    // Implement polling fallback
    const pollInterval = setInterval(() => {
      if (this.socket?.connected) {
        clearInterval(pollInterval);
        return;
      }

      // Emit connection status
      this.emit('connection', { 
        status: 'polling',
        message: 'Using HTTP polling fallback'
      });

      // Try to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts * 2) {
        this.reconnectAttempts++;
        this.connect();
      }
    }, 5000); // Poll every 5 seconds
  }

  // Join a specific room (e.g., for a specific todo list)
  joinRoom(roomId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('room:join', { roomId });
  }

  // Leave a room
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('room:leave', { roomId });
  }

  // Broadcast message to room
  sendMessage(roomId: string, message: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('message:send', { roomId, message, timestamp: Date.now() });
  }
}

export const realtimeService = new RealtimeService();
export default RealtimeService;