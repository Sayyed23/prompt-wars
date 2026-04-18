import { NextRequest, NextResponse } from 'next/server';
import { getGlobalDensitySnapshot } from '@/shared/lib/crowd';

/**
 * Polling Fallback for Crowd Density Updates (Requirement 14.3)
 * Provides 15-second polling mechanism for browsers without SSE support
 */
export async function GET(req: NextRequest) {
  try {
    const snapshot = await getGlobalDensitySnapshot();
    
    return NextResponse.json({
      success: true,
      data: snapshot,
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
      { error: 'Failed to fetch density data' },
      { status: 500 }
    );
  }
}
