import { getRedisClient } from './redis';
import { getZone, getAllZones } from './venue';
import { Route, Waypoint } from '../types/navigation';
import { Coordinates } from '../types/venue';
import { DensityLevel } from '../types/crowd';

/**
 * Calculates the shortest path between two zones, avoiding high-density areas.
 * Uses a simplified Dijkstra approach.
 */
export async function findOptimizedRoute(
  originZoneId: string,
  destinationZoneId: string
): Promise<Route> {
  const redis = getRedisClient();
  const zones = getAllZones();
  
  // Weights for density levels (Requirement 3.2)
  const weights: Record<string, number> = {
    [DensityLevel.LOW]: 1,
    [DensityLevel.MODERATE]: 2,
    [DensityLevel.HIGH]: 10,
    [DensityLevel.CRITICAL]: 100,
  };

  // 1. Fetch current density levels for all zones to use as edge weights
  const densityLevels: Record<string, string> = {};
  await Promise.all(
    zones.map(async (zone) => {
      const level = await redis.get(`densityLevel:${zone.id}`);
      densityLevels[zone.id] = level || DensityLevel.LOW;
    })
  );

  // 2. Dijkstra Algorithm
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const queue: string[] = [];

  for (const zone of zones) {
    distances[zone.id] = zone.id === originZoneId ? 0 : Infinity;
    previous[zone.id] = null;
    queue.push(zone.id);
  }

  while (queue.length > 0) {
    // Pick node with smallest distance
    queue.sort((a, b) => distances[a] - distances[b]);
    const u = queue.shift()!;

    if (u === destinationZoneId) break;
    if (distances[u] === Infinity) break;

    const currentZone = getZone(u);
    if (!currentZone) continue;

    for (const v of currentZone.adjacencies) {
      if (!queue.includes(v)) continue;

      const vLevel = densityLevels[v] || DensityLevel.LOW;
      const weight = weights[vLevel];
      const alt = distances[u] + weight;

      if (alt < distances[v]) {
        distances[v] = alt;
        previous[v] = u;
      }
    }
  }

  // 3. Reconstruct Path
  const path: string[] = [];
  let curr: string | null = destinationZoneId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  if (path[0] !== originZoneId) {
    throw new Error('No path found between selected zones');
  }

  // 4. Build Route Object (Requirement 3.4, 3.5)
  const waypoints: Waypoint[] = path.map((zoneId, index) => {
    const zone = getZone(zoneId)!;
    return {
      id: `wp-${index}`,
      name: zone.name,
      zoneId: zone.id,
      coordinates: zone.coordinates[0] || { x: 0, y: 0 },
      instruction: index === 0 
        ? `Start at ${zone.name}` 
        : index === path.length - 1 
          ? `Arrive at ${zone.name}` 
          : `Proceed through ${zone.name}`,
    };
  });

  const originZone = getZone(originZoneId)!;
  const destZone = getZone(destinationZoneId)!;

  return {
    id: `route-${Date.now()}`,
    origin: originZone.coordinates[0] || { x: 0, y: 0 },
    destination: destZone.coordinates[0] || { x: 0, y: 0 },
    waypoints,
    estimatedTimeMinutes: Math.ceil(distances[destinationZoneId] * 1.5), // Arbitrary scaling: 1 "unit" = 1.5 mins
    distanceMetres: distances[destinationZoneId] * 100, // 1 "unit" = 100m
    timestamp: new Date().toISOString(),
  };
}
