import { getAllZones, getZone } from './venue';
import { getCache } from './redis';
import { getHistoricalTrends } from './db';
import { DensitySnapshot, ZoneDensity, DensityLevel } from '../types/crowd';

/**
 * Fetches the global crowd density snapshot across all zones.
 */
export async function getGlobalDensitySnapshot(): Promise<DensitySnapshot> {
  const zones = getAllZones();
  let totalOccupancy = 0;
  const now = new Date().toISOString();

  const zoneDensities = await Promise.all(
    zones.map(async (zone) => {
      const cached = await getCache(`zone:density:${zone.id}`);
      
      if (cached) {
        const data: ZoneDensity = JSON.parse(cached);
        totalOccupancy += data.occupancy;
        return data;
      }

      // Default if no data has been received yet for this zone
      return {
        zoneId: zone.id,
        occupancy: 0,
        capacity: zone.capacity,
        densityPercentage: 0,
        level: DensityLevel.LOW,
        timestamp: now,
      };
    })
  );

  return {
    timestamp: now,
    lastUpdated: now,
    totalOccupancy,
    zones: zoneDensities.reduce((acc, z) => ({ ...acc, [z.zoneId]: z }), {}),
  };
}

/**
 * Fetches density details for a specific zone, including historical trends.
 */
export async function getZoneDensityDetails(zoneId: string) {
  const zone = getZone(zoneId);
  if (!zone) return null;

  const cached = await getCache(`zone:density:${zoneId}`);
  let current: ZoneDensity;

  if (cached) {
    current = JSON.parse(cached);
  } else {
    current = {
      zoneId,
      occupancy: 0,
      capacity: zone.capacity,
      densityPercentage: 0,
      level: DensityLevel.LOW,
      timestamp: new Date().toISOString(),
    };
  }

  const trends = await getHistoricalTrends(zoneId, 5);

  return {
    current,
    trends,
    timestamp: new Date().toISOString(),
  };
}
