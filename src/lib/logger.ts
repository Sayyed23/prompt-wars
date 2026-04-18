/**
 * Structured Logger (Requirement 11.4)
 * Cloud Logging compatible JSON logger with trace correlation and sampling.
 */

export enum LogSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

interface LogEntry {
  severity: LogSeverity;
  message: string;
  timestamp: string;
  traceId?: string;
  spanId?: string;
  component?: string;
  metadata?: Record<string, unknown>;
  httpRequest?: {
    method: string;
    url: string;
    status?: number;
    latencyMs?: number;
    userAgent?: string;
    remoteIp?: string;
  };
}

/** Sampling rates per endpoint prefix. 1.0 = log all, 0.1 = log 10%. */
const SAMPLING_RATES: Record<string, number> = {
  '/api/crowd/density': 0.1,
  '/api/realtime/': 0.1,
  '/api/iot/ingest': 0.2,
  default: 1.0,
};

/**
 * Determines if a request should be logged based on sampling rate.
 */
function shouldSample(pathname: string): boolean {
  for (const [prefix, rate] of Object.entries(SAMPLING_RATES)) {
    if (prefix !== 'default' && pathname.startsWith(prefix)) {
      return Math.random() < rate;
    }
  }
  return Math.random() < (SAMPLING_RATES.default ?? 1.0);
}

/**
 * Extracts Cloud Trace context from request headers.
 */
export function extractTraceId(traceHeader?: string | null): { traceId?: string; spanId?: string } {
  if (!traceHeader) return {};
  // Format: TRACE_ID/SPAN_ID;o=TRACE_TRUE
  const parts = traceHeader.split('/');
  const traceId = parts[0];
  const spanId = parts[1]?.split(';')[0];
  return { traceId, spanId };
}

/**
 * Core logging function — outputs structured JSON to stdout.
 */
function writeLog(entry: LogEntry): void {
  const logObject = {
    severity: entry.severity,
    message: entry.message,
    timestamp: entry.timestamp,
    'logging.googleapis.com/trace': entry.traceId
      ? `projects/${process.env.GCP_PROJECT_ID || 'crowdflow'}/traces/${entry.traceId}`
      : undefined,
    'logging.googleapis.com/spanId': entry.spanId,
    component: entry.component,
    ...entry.metadata,
    httpRequest: entry.httpRequest,
  };

  // Remove undefined keys
  const clean = JSON.stringify(logObject, (_, v) => (v === undefined ? undefined : v));

  if (entry.severity === LogSeverity.ERROR || entry.severity === LogSeverity.CRITICAL) {
    console.error(clean);
  } else if (entry.severity === LogSeverity.WARNING) {
    console.warn(clean);
  } else {
    console.log(clean);
  }
}

/** Convenience loggers */
export const logger = {
  info(message: string, metadata?: Record<string, unknown>) {
    writeLog({ severity: LogSeverity.INFO, message, timestamp: new Date().toISOString(), metadata });
  },

  warn(message: string, metadata?: Record<string, unknown>) {
    writeLog({ severity: LogSeverity.WARNING, message, timestamp: new Date().toISOString(), metadata });
  },

  error(message: string, error?: unknown, metadata?: Record<string, unknown>) {
    writeLog({
      severity: LogSeverity.ERROR,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        error: error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : error,
      },
    });
  },

  critical(message: string, error?: unknown, metadata?: Record<string, unknown>) {
    writeLog({
      severity: LogSeverity.CRITICAL,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        error: error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : error,
      },
    });
  },

  /**
   * Logs an HTTP request/response with optional sampling.
   */
  request(
    method: string,
    url: string,
    status: number,
    latencyMs: number,
    options?: { traceHeader?: string; userAgent?: string; remoteIp?: string; component?: string }
  ) {
    const pathname = new URL(url, 'http://localhost').pathname;
    if (!shouldSample(pathname)) return;

    const { traceId, spanId } = extractTraceId(options?.traceHeader);
    const severity = status >= 500 ? LogSeverity.ERROR : status >= 400 ? LogSeverity.WARNING : LogSeverity.INFO;

    writeLog({
      severity,
      message: `${method} ${pathname} ${status} ${latencyMs}ms`,
      timestamp: new Date().toISOString(),
      traceId,
      spanId,
      component: options?.component || 'api',
      httpRequest: {
        method,
        url: pathname,
        status,
        latencyMs,
        userAgent: options?.userAgent,
        remoteIp: options?.remoteIp,
      },
    });
  },

  /**
   * Audit log for staff actions (separate log stream).
   */
  audit(action: string, details: Record<string, unknown>) {
    writeLog({
      severity: LogSeverity.INFO,
      message: `AUDIT: ${action}`,
      timestamp: new Date().toISOString(),
      component: 'audit',
      metadata: { auditAction: action, ...details },
    });
  },
};
