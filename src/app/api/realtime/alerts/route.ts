import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/shared/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const redis = await getRedisClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('retry: 1000\n\n'));
      
      const subscriber = redis.duplicate();
      await subscriber.connect();

      // Subscribe to both new alerts and updates
      const handler = (message: string) => {
        try {
          const data = JSON.parse(message);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('Alert SSE Broadcast error:', err);
        }
      };

      await subscriber.subscribe('alerts:new', handler);
      await subscriber.subscribe('alerts:update', handler);

      // Keep connection alive with heartbeats every 30 seconds (Requirement 14.1)
      const heartbeatInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      req.signal.addEventListener('abort', async () => {
        clearInterval(heartbeatInterval);
        await subscriber.unsubscribe('alerts:new');
        await subscriber.unsubscribe('alerts:update');
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
