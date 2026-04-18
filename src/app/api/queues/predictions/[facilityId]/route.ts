import { NextRequest, NextResponse } from 'next/server';
import { getFacility } from '@/shared/lib/venue';
import { calculateQueuePrediction } from '@/shared/lib/queue';

/**
 * GET /api/queues/predictions/[facilityId]
 * Returns prediction for a specific facility.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  try {
    const { facilityId } = await params;
    const facility = getFacility(facilityId);

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }

    const prediction = await calculateQueuePrediction(facility);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Facility prediction API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facility prediction' },
      { status: 500 }
    );
  }
}
