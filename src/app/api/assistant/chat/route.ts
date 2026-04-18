import { NextRequest, NextResponse } from 'next/server';
import { getChatStream, validateChatMessage } from '@/shared/lib/ai';

export const runtime = 'edge'; // Edge runtime for better streaming support

/**
 * POST /api/assistant/chat
 * Streams AI responses back to the client using SSE (Requirement 11.4).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;

    // 1. Validate Input (Requirement 11.2)
    const validation = validateChatMessage(message);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 2. Initialize Stream (Requirement 11.4)
    const stream = await getChatStream(message, history || []);

    // 3. Create ReadableStream for SSE
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err: any) {
          console.error('Streaming error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Assistant API error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
