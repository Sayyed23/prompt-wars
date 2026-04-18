import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlerts } from '@/shared/lib/alerts';

/**
 * GET /api/alerts/active
 * Returns all currently active alerts for the operations dashboard (Requirement 6.5).
 */
export async function GET(request: NextRequest) {
  try {
    const alerts = await getActiveAlerts();
    
    return NextResponse.json(alerts, {
      headers: {
        'Cache-Control': 'no-store', // Always fresh
      },
    });
  } catch (error) {
    console.error('Active alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active alerts' },
      { status: 500 }
    );
  }
}
