'use client';

import { useEffect, useState, useCallback } from 'react';
import { RealtimeClient, ConnectionStatus } from '@/shared/lib/realtime';

/**
 * React hook for real-time data subscriptions
 * Automatically manages connection lifecycle and cleanup
 */
export function useRealtime<T>(
  createClient: (
    onMessage: (data: T) => void,
    onStatusChange?: (status: ConnectionStatus) => void,
    onError?: (error: Error) => void
  ) => RealtimeClient
) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  const handleMessage = useCallback((newData: T) => {
    setData(newData);
    setError(null);
  }, []);

  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err);
  }, []);

  useEffect(() => {
    const client = createClient(handleMessage, handleStatusChange, handleError);
    client.connect();

    return () => {
      client.disconnect();
    };
  }, [createClient, handleMessage, handleStatusChange, handleError]);

  return { data, status, error };
}
