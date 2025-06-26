import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../components/auth/AuthProvider';
import type { WebSocketMessage, WebSocketState } from '../types/game';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface UseWebSocketReturn extends WebSocketState {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  isConnected: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    url = import.meta.env.VITE_WS_URL || 
      (window.location.protocol === 'https:' ? 
        `wss://${window.location.host}` : 
        `ws://${window.location.host}`),
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('jwtToken');
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventListenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    reconnectAttempts: 0,
  });

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleConnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      connected: true,
      connecting: false,
      error: null,
      reconnectAttempts: 0,
    }));
    clearReconnectTimeout();
  }, [clearReconnectTimeout]);

  const handleDisconnect = useCallback((reason: string) => {
    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: reason === 'io client disconnect' ? null : `Disconnected: ${reason}`,
    }));

    // Auto-reconnect if not manually disconnected
    if (reason !== 'io client disconnect' && state.reconnectAttempts < reconnectAttempts) {
      setState(prev => ({ ...prev, connecting: true }));
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && !socketRef.current.connected) {
          setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
          socketRef.current.connect();
        }
      }, reconnectDelay * Math.pow(2, state.reconnectAttempts)); // Exponential backoff
    }
  }, [state.reconnectAttempts, reconnectAttempts, reconnectDelay]);

  const handleError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error: error.message,
      connecting: false,
    }));
  }, []);

  const handleMessage = useCallback((event: string, data: any) => {
    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      lastMessage: message,
    }));

    // Trigger event listeners
    const listeners = eventListenersRef.current.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected || !isAuthenticated) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const socket = io(url, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleError);
      
      // Listen to all events and route them through our message handler
      socket.onAny((event, ...args) => {
        handleMessage(event, args.length === 1 ? args[0] : args);
      });

      socketRef.current = socket;
    } catch (error) {
      handleError(error as Error);
    }
  }, [url, token, isAuthenticated, handleConnect, handleDisconnect, handleError, handleMessage]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0,
    }));
  }, [clearReconnectTimeout]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: WebSocket not connected`);
    }
  }, []);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    
    eventListenersRef.current.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListenersRef.current.delete(event);
        }
      }
    };
  }, []);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && autoConnect && !socketRef.current) {
      connect();
    } else if (!isAuthenticated && socketRef.current) {
      disconnect();
    }
  }, [isAuthenticated, autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [clearReconnectTimeout]);

  // Ping-pong heartbeat to detect connection issues
  useEffect(() => {
    if (!socketRef.current?.connected) return;

    const pingInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping');
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [state.connected]);

  return {
    ...state,
    socket: socketRef.current,
    connect,
    disconnect,
    emit,
    subscribe,
    isConnected: state.connected,
  };
};

export default useWebSocket; 