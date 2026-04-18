import { NextRequest, NextResponse } from 'next/server';
import { getAllFacilities } from '@/shared/lib/venue';
import { calculateQueuePrediction } from '@/shared/lib/queue';
import { FacilityType } from '@/shared/types/queue';

/**
 * GET /api/queues/predictions
 * Returns predictions for all facilities, optionally filtered by type.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as FacilityType | null;

    const facilities = getAllFacilities(type || undefined);
    
    // Calculate predictions for all matching facilities in parallel
    const predictions = await Promise.all(
      facilities.map(facility => calculateQueuePrediction(facility))
    );

    return NextResponse.json(predictions, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Response-Time': 'low',
      },
    });
  } catch (error) {
    console.error('Queue predictions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue predictions' },
      { status: 500 }
    );
  }
}
