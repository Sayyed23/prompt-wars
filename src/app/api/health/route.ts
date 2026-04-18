import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint (Requirement 10.2)
 * Returns 200 OK with service status for Cloud Run probes and monitoring.
 */
export async function GET() {
  const startTime = Date.now();

  const health: Record<string, unknown> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Check Redis connectivity
  try {
    const { getRedisClient } = await import('@/shared/lib/redis');
    const redis = await getRedisClient();
    const pingStart = Date.now();
    await redis.ping();
    health.redis = {
      status: 'connected',
      latencyMs: Date.now() - pingStart,
    };
  } catch (error: unknown) {
    health.redis = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.status = 'degraded';
  }

  // Check Database connectivity
  try {
    const { getPool } = await import('@/shared/lib/db');
    const pool = getPool();
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    health.database = {
      status: 'connected',
      latencyMs: Date.now() - dbStart,
    };
  } catch (error: unknown) {
    health.database = {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.status = 'degraded';
  }

  health.responseTimeMs = Date.now() - startTime;

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
