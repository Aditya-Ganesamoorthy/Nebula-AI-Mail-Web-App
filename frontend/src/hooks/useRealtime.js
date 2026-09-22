import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for real-time WebSocket mailbox synchronization.
 * Automatically connects to backend WebSocket hub, handles ping/pong keepalives,
 * executes exponential backoff reconnects, and notifies the application when
 * Google Cloud Pub/Sub push updates arrive.
 */
export function useRealtime({ userEmail, onInboxUpdated, enabled = true }) {
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [lastDelta, setLastDelta] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const backoffDelayRef = useRef(1000);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled || !userEmail) {
      setStatus('disconnected');
      return;
    }

    // Clean up any existing connection
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (e) {
        // Ignore
      }
      socketRef.current = null;
    }

    setStatus((prev) => (prev === 'connected' ? 'reconnecting' : 'connecting'));

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const wsBase = backendUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/realtime?email=${encodeURIComponent(userEmail)}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus('connected');
        backoffDelayRef.current = 1000; // Reset backoff delay on successful connection

        // Setup ping keepalive every 25 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        if (event.data === 'pong') return;

        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'INBOX_UPDATED') {
            setLastSyncTime(new Date());
            setLastDelta(payload.data);
            if (onInboxUpdated) {
              onInboxUpdated(payload.data);
            }
          }
        } catch (err) {
          console.warn('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        clearInterval(pingIntervalRef.current);
        socketRef.current = null;

        if (enabled && userEmail) {
          setStatus('reconnecting');
          const nextDelay = Math.min(backoffDelayRef.current * 1.5, 30000);
          backoffDelayRef.current = nextDelay;
          reconnectTimeoutRef.current = setTimeout(connect, nextDelay);
        } else {
          setStatus('disconnected');
        }
      };

      ws.onerror = (err) => {
        // Will trigger onclose next
        console.warn('WebSocket encountered error:', err);
      };
    } catch (err) {
      console.error('Failed to initiate WebSocket connection:', err);
      setStatus('disconnected');
    }
  }, [userEmail, enabled, onInboxUpdated]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [connect]);

  const forceReconnect = useCallback(() => {
    backoffDelayRef.current = 1000;
    connect();
  }, [connect]);

  return {
    status,
    lastSyncTime,
    lastDelta,
    forceReconnect,
    isConnected: status === 'connected',
  };
}
