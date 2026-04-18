import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlerts } from '@/lib/alerts';

/**
 * Polling Fallback for Alert Updates (Requirement 14.3)
 * Provides 15-second polling mechanism for browsers without SSE support
 */
export async function GET(req: NextRequest) {
  try {
    const alerts = await getActiveAlerts();
    
    return NextResponse.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Polling endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
