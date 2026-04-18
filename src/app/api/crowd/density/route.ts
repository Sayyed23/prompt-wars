import { NextResponse } from 'next/server';
import { getGlobalDensitySnapshot } from '@/shared/lib/crowd';
import { DensitySnapshot, ZoneDensity, DensityLevel } from '@/shared/types/crowd';
import { CACHE_HEADERS } from '@/shared/lib/cache';

/**
 * Global Crowd Density Snapshot API (Requirement 1.1, 1.2)
 * Aggregates latest density data for all venue zones.
 */
export async function GET() {
  try {
    const snapshot = await getGlobalDensitySnapshot();

    // Requirement 5.2: Ensure fast response time (<200ms)
    // Requirement 1.2: Support 10s refresh cycle via cache headers
    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': CACHE_HEADERS.density,
      },
    });

  } catch (error) {
    console.error('Failed to fetch crowd density snapshot:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
