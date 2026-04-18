import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/shared/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const redis = await getRedisClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection event
        controller.enqueue(encoder.encode('retry: 1000\n\n'));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

        const subscriber = redis.duplicate();
        try {
          await subscriber.connect();

          // Subscribe to density updates channel
          await subscriber.subscribe('crowd-updates', (message) => {
            try {
              controller.enqueue(encoder.encode(`data: ${message}\n\n`));
            } catch (err) {
              console.error('SSE Broadcast error:', err);
            }
          });

          // Handle close
          req.signal.addEventListener('abort', async () => {
            try {
              clearInterval(heartbeatInterval);
              await subscriber.unsubscribe('crowd-updates');
              await subscriber.quit();
            } catch (e) {
              console.warn('SSE Cleanup warning:', e);
            }
            try { controller.close(); } catch (e) {}
          });

        } catch (redisErr) {
          console.error('SSE Redis Connection failed:', redisErr);
          // Fallback: Just keep the stream alive with heartbeats so client doesn't retry instantly
        }

        // Keep connection alive with heartbeats every 30 seconds
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (e) {
            clearInterval(heartbeatInterval);
          }
        }, 30000);

      } catch (err) {
        console.error('SSE Stream Error:', err);
        try { controller.close(); } catch (e) {}
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
