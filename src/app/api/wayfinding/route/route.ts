import { NextRequest, NextResponse } from 'next/server';
import { findOptimizedRoute } from '@/shared/lib/navigation';

/**
 * POST /api/wayfinding/route
 * Accepts origin and destination zone IDs and returns an optimized route.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originZoneId, destinationZoneId } = body;

    if (!originZoneId || !destinationZoneId) {
      return NextResponse.json(
        { error: 'Origin and destination zone IDs are required' },
        { status: 400 }
      );
    }

    const route = await findOptimizedRoute(originZoneId, destinationZoneId);

    return NextResponse.json(route, {
      headers: {
        'X-Calculation-Time': 'optimized',
      },
    });
  } catch (error: any) {
    console.error('Wayfinding API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate route' },
      { status: 500 }
    );
  }
}
