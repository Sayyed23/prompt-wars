import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/shared/lib/redis';
import { findOptimizedRoute } from '@/shared/lib/navigation';
import { getZone } from '@/shared/lib/venue';
import { DensityLevel } from '@/shared/types/crowd';

/**
 * POST /api/wayfinding/recalculate
 * Compares current waypoint zone densities with original densities.
 * Triggers recalculation if any zone density changed >20 percentage points.
 * (Requirement 3.3)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routeId, waypoints, originZoneId, destinationZoneId } = body;

    if (!routeId || !waypoints || !originZoneId || !destinationZoneId) {
      return NextResponse.json(
        { error: 'Missing required fields: routeId, waypoints, originZoneId, destinationZoneId' },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();
    const DENSITY_CHANGE_THRESHOLD = 20;

    let shouldRecalculate = false;
    let recalculationReason = '';
    const densityChanges: Array<{ zoneId: string; original: number; current: number; delta: number }> = [];

    for (const wp of waypoints) {
      const zone = getZone(wp.zoneId);
      if (!zone) continue;

      const occupancyStr = await redis.get(`occupancy:${wp.zoneId}`);
      const currentOccupancy = occupancyStr ? parseInt(occupancyStr, 10) : 0;
      const currentDensityPct = (currentOccupancy / zone.capacity) * 100;

      const originalDensityPct = wp.originalDensityPercentage ?? 0;
      const delta = Math.abs(currentDensityPct - originalDensityPct);

      densityChanges.push({
        zoneId: wp.zoneId,
        original: Math.round(originalDensityPct),
        current: Math.round(currentDensityPct),
        delta: Math.round(delta),
      });

      if (delta > DENSITY_CHANGE_THRESHOLD) {
        shouldRecalculate = true;
        recalculationReason = `Zone "${zone.name}" density changed by ${Math.round(delta)} percentage points (${Math.round(originalDensityPct)}% → ${Math.round(currentDensityPct)}%)`;
      }
    }

    if (!shouldRecalculate) {
      return NextResponse.json({
        recalculated: false,
        routeId,
        message: 'No significant density changes detected',
        densityChanges,
      });
    }

    const updatedRoute = await findOptimizedRoute(originZoneId, destinationZoneId);

    return NextResponse.json({
      recalculated: true,
      routeId,
      reason: recalculationReason,
      route: updatedRoute,
      densityChanges,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
