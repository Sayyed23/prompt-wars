'use client';

import { ConnectionStatus as Status } from '@/shared/lib/realtime';

interface ConnectionStatusProps {
  status: Status;
  className?: string;
}

/**
 * Connection Status Indicator (Requirement 14.3)
 * Displays current real-time connection status to users
 */
export function ConnectionStatus({ status, className = '' }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'Connected',
          icon: '●',
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: 'Connecting...',
          icon: '◐',
        };
      case 'disconnected':
        return {
          color: 'bg-gray-500',
          text: 'Disconnected',
          icon: '○',
        };
      case 'error':
        return {
          color: 'bg-red-500',
          text: 'Connection Error',
          icon: '✕',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`flex items-center gap-2 text-sm ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${config.text}`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.color}`}
        aria-hidden="true"
      >
        {config.icon}
      </span>
      <span className="text-gray-700 dark:text-gray-300">{config.text}</span>
    </div>
  );
}
