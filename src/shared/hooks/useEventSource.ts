'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface SSEMessage<T> {
  data: T;
  timestamp: string;
}

export function useEventSource<T>(url: string) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    if (retryCount >= maxRetries) {
      console.error('SSE: Max retries reached');
      setStatus('closed');
      return;
    }

    setStatus('connecting');
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('connected');
      setError(null);
      setRetryCount(0); // Reset retry count on success
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    es.onerror = (e) => {
      console.error('SSE Error:', e);
      setStatus('error');
      setError(new Error('Connection failed'));
      es.close();
      
      // Auto-reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      setRetryCount(prev => prev + 1);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        // Ignore connection setup messages
        if (parsed.type === 'connected') return;
        setData(parsed);
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    return () => {
      es.close();
    };
  }, [url, retryCount]);

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

  // Memoize return values to prevent unnecessary re-renders in consumers
  return { 
    data, 
    status, 
    error,
    isInitialLoading: status === 'connecting' && !data 
  };
}
