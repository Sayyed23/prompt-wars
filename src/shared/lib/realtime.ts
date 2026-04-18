/**
 * Real-Time Communication Client (Requirement 14.3)
 * Handles SSE connections with automatic fallback to polling for unsupported browsers
 */

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface RealtimeClientOptions {
  endpoint: string;
  onMessage: (data: any) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

export class RealtimeClient {
  private endpoint: string;
  private onMessage: (data: any) => void;
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onError?: (error: Error) => void;
  
  private eventSource: EventSource | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private status: ConnectionStatus = 'disconnected';

  constructor(options: RealtimeClientOptions) {
    this.endpoint = options.endpoint;
    this.onMessage = options.onMessage;
    this.onStatusChange = options.onStatusChange;
    this.onError = options.onError;
  }

  /**
   * Start the real-time connection with automatic fallback
   */
  connect(): void {
    if (this.supportsSSE()) {
      this.connectSSE();
    } else {
      this.connectPolling();
    }
  }

  /**
   * Disconnect and cleanup resources
   */
  disconnect(): void {
    this.cleanup();
    this.updateStatus('disconnected');
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if browser supports Server-Sent Events
   */
  private supportsSSE(): boolean {
    return typeof EventSource !== 'undefined';
  }

  /**
   * Connect using Server-Sent Events
   */
  private connectSSE(): void {
    try {
      this.updateStatus('connecting');
      
      this.eventSource = new EventSource(this.endpoint);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Ignore connection messages
          if (data.type !== 'connected') {
            this.onMessage(data);
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.updateStatus('error');
        
        // Attempt reconnection with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectSSE();
        } else {
          // Fall back to polling after max reconnect attempts
          this.cleanup();
          this.connectPolling();
        }
      };
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      this.handleError(error as Error);
      this.connectPolling();
    }
  }

  /**
   * Reconnect SSE with exponential backoff (1s, 2s, 4s, 8s, max 30s)
   */
  private reconnectSSE(): void {
    const delay = Math.min(
      Math.pow(2, this.reconnectAttempts) * 1000,
      30000
    );
    
    this.reconnectAttempts++;
    this.updateStatus('connecting');

    this.reconnectTimeout = setTimeout(() => {
      if (this.eventSource) {
        this.eventSource.close();
      }
      this.connectSSE();
    }, delay);
  }

  /**
   * Connect using polling fallback (15-second intervals)
   */
  private connectPolling(): void {
    this.updateStatus('connecting');
    
    // Immediate first fetch
    this.pollData();
    
    // Set up 15-second polling interval
    this.pollingInterval = setInterval(() => {
      this.pollData();
    }, 15000);
  }

  /**
   * Fetch data via polling endpoint
   */
  private async pollData(): Promise<void> {
    try {
      const pollEndpoint = `${this.endpoint}/poll`;
      const response = await fetch(pollEndpoint);
      
      if (!response.ok) {
        throw new Error(`Polling failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        this.updateStatus('connected');
        this.onMessage(result.data);
      }
    } catch (error) {
      console.error('Polling error:', error);
      this.updateStatus('error');
      this.handleError(error as Error);
    }
  }

  /**
   * Update connection status and notify listeners
   */
  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  /**
   * Handle errors and notify listeners
   */
  private handleError(error: Error): void {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Cleanup all connections and timers
   */
  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

/**
 * Create a real-time client for crowd density updates
 */
export function createDensityClient(
  onMessage: (data: any) => void,
  onStatusChange?: (status: ConnectionStatus) => void,
  onError?: (error: Error) => void
): RealtimeClient {
  return new RealtimeClient({
    endpoint: '/api/realtime/density',
    onMessage,
    onStatusChange,
    onError,
  });
}

/**
 * Create a real-time client for alert updates
 */
export function createAlertsClient(
  onMessage: (data: any) => void,
  onStatusChange?: (status: ConnectionStatus) => void,
  onError?: (error: Error) => void
): RealtimeClient {
  return new RealtimeClient({
    endpoint: '/api/realtime/alerts',
    onMessage,
    onStatusChange,
    onError,
  });
}
