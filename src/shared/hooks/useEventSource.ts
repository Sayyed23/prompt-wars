'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface SSEMessage<T> {
  data: T;
  timestamp: string;
}

export function useEventSource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus('connecting');
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('connected');
      setError(null);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    es.onerror = (e) => {
      console.error('SSE Error:', e);
      setStatus('error');
      setError(new Error('Connection failed'));
      es.close();
      
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    return () => {
      es.close();
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { data, status, error };
}
