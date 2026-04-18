import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const redis = await getRedisClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode('retry: 1000\n\n'));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      const subscriber = redis.duplicate();
      await subscriber.connect();

      // Subscribe to density updates channel (matches IoT ingest publish channel)
      await subscriber.subscribe('crowd-updates', (message) => {
        try {
          const data = JSON.parse(message);
          controller.enqueue(encoder.encode(`event: density_update\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('SSE Broadcast error:', err);
        }
      });

      // Keep connection alive with heartbeats every 30 seconds (Requirement 14.1)
      const heartbeatInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      // Handle close
      req.signal.addEventListener('abort', async () => {
        clearInterval(heartbeatInterval);
        await subscriber.unsubscribe('crowd-updates');
        await subscriber.quit();
        controller.close();
      });
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
