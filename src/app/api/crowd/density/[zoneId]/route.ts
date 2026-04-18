import { NextRequest, NextResponse } from 'next/server';
import { getZoneDensityDetails } from '@/shared/lib/crowd';
import { ZoneDensity, DensityLevel } from '@/shared/types/crowd';

/**
 * Zone-Specific Density API (Requirement 1.2, 11.5)
 * Returns current status and 5-minute historical trends for a zone.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  const { zoneId } = params;

  try {
    const details = await getZoneDensityDetails(zoneId);
    
    if (!details) {
      return NextResponse.json(
        { error: 'Zone not found', zoneId },
        { status: 404 }
      );
    }

    return NextResponse.json(details);

  } catch (error) {
    console.error(`Failed to fetch density for zone ${zoneId}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
