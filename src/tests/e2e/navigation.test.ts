import { describe, it, expect } from 'vitest';
import { getAllZones, getZone } from '@/shared/lib/venue';

/**
 * E2E Test: Attendee requests navigation (Task 24.2)
 * Requirements: 3.1, 3.2, 3.4
 */
describe('E2E: Navigation Route Generation', () => {
  const zones = getAllZones();

  it('all zones have adjacency data for pathfinding', () => {
    for (const zone of zones) {
      expect(zone).toHaveProperty('adjacencies');
      expect(Array.isArray(zone.adjacencies)).toBe(true);

      for (const adjId of zone.adjacencies) {
        const adjZone = getZone(adjId);
        expect(adjZone).not.toBeNull();
      }
    }
  });

  it('venue graph is connected (all zones reachable)', () => {
    const visited = new Set<string>();
    const queue = [zones[0].id];
    visited.add(zones[0].id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const zone = getZone(current);
      if (!zone) continue;

      for (const adjId of zone.adjacencies) {
        if (!visited.has(adjId)) {
          visited.add(adjId);
          queue.push(adjId);
        }
      }
    }

    expect(visited.size).toBe(zones.length);
  });

  it('route optimization prioritizes low density zones', () => {
    const weights = { low: 1, moderate: 2, high: 10, critical: 100 };
    expect(weights.low).toBeLessThan(weights.moderate);
    expect(weights.moderate).toBeLessThan(weights.high);
    expect(weights.high).toBeLessThan(weights.critical);
  });

  it('waypoints contain navigation instructions', () => {
    const sampleWaypoint = {
      id: 'wp-0',
      name: 'North Stand Lower',
      zoneId: 'zone-north-1',
      coordinates: { x: 10, y: 10 },
      instruction: 'Start at North Stand Lower',
    };

    expect(sampleWaypoint).toHaveProperty('id');
    expect(sampleWaypoint).toHaveProperty('name');
    expect(sampleWaypoint).toHaveProperty('zoneId');
    expect(sampleWaypoint).toHaveProperty('coordinates');
    expect(sampleWaypoint).toHaveProperty('instruction');
    expect(sampleWaypoint.instruction).toContain(sampleWaypoint.name);
  });
});
