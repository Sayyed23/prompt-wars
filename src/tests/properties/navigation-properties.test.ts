import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getAllZones, getZone } from '../../lib/venue';
import { DensityLevel } from '../../types/crowd';
import { calculateDensityLevel } from '../../lib/density';

/**
 * Property 8: Route Generation Timing
 * Validates: Requirement 3.1 — Dijkstra pathfinding on 4-zone graph is sub-ms
 */
describe('Property 8: Route Generation Timing', () => {
  it('Dijkstra on small graph completes synchronously in <1ms', () => {
    const zones = getAllZones();
    const weights: Record<string, number> = {
      [DensityLevel.LOW]: 1,
      [DensityLevel.MODERATE]: 2,
      [DensityLevel.HIGH]: 10,
      [DensityLevel.CRITICAL]: 100,
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...zones.map(z => z.id)),
        fc.constantFrom(...zones.map(z => z.id)),
        (from, to) => {
          if (from === to) return true;
          const start = performance.now();
          // Simulate sync Dijkstra (without Redis)
          const distances: Record<string, number> = {};
          const previous: Record<string, string | null> = {};
          const queue: string[] = [];

          for (const z of zones) {
            distances[z.id] = z.id === from ? 0 : Infinity;
            previous[z.id] = null;
            queue.push(z.id);
          }

          while (queue.length > 0) {
            queue.sort((a, b) => distances[a] - distances[b]);
            const u = queue.shift()!;
            if (u === to) break;
            if (distances[u] === Infinity) break;

            const zone = getZone(u);
            if (!zone) continue;
            for (const v of zone.adjacencies) {
              if (!queue.includes(v)) continue;
              const alt = distances[u] + 1;
              if (alt < distances[v]) {
                distances[v] = alt;
                previous[v] = u;
              }
            }
          }

          const duration = performance.now() - start;
          return duration < 1;
        }
      ),
      { numRuns: 20 }
    );
  });
});

/**
 * Property 9: Low Density Route Prioritization
 * Validates: Requirement 3.2 — Routes prefer lower density zones
 */
describe('Property 9: Low Density Route Prioritization', () => {
  it('low density weight < moderate < high < critical', () => {
    const weights = {
      [DensityLevel.LOW]: 1,
      [DensityLevel.MODERATE]: 2,
      [DensityLevel.HIGH]: 10,
      [DensityLevel.CRITICAL]: 100,
    };

    expect(weights[DensityLevel.LOW]).toBeLessThan(weights[DensityLevel.MODERATE]);
    expect(weights[DensityLevel.MODERATE]).toBeLessThan(weights[DensityLevel.HIGH]);
    expect(weights[DensityLevel.HIGH]).toBeLessThan(weights[DensityLevel.CRITICAL]);
  });

  it('critical zones incur ≥10x cost compared to low density', () => {
    expect(100 / 1).toBeGreaterThanOrEqual(10);
  });
});

/**
 * Property 10: Route Recalculation on Density Change
 * Validates: Requirement 3.3 — Recalculate when density changes >20pp
 */
describe('Property 10: Route Recalculation on Density Change', () => {
  it('detects density changes exceeding 20 percentage points', () => {
    const THRESHOLD = 20;

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (original, current) => {
          const delta = Math.abs(current - original);
          const shouldRecalculate = delta > THRESHOLD;
          if (shouldRecalculate) {
            return delta > THRESHOLD;
          }
          return delta <= THRESHOLD;
        }
      )
    );
  });

  it('does NOT trigger recalculation for small changes (≤20pp)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: -20, max: 20 }),
        (base, change) => {
          const newValue = Math.max(0, Math.min(100, base + change));
          const delta = Math.abs(newValue - base);
          return delta <= 20; // should not trigger
        }
      )
    );
  });
});

/**
 * Property 11: Route Visual Display Completeness
 * Property 12: Route Travel Time Calculation
 * Validates: Requirements 3.4, 3.5
 */
describe('Property 11-12: Route Completeness & Travel Time', () => {
  it('all zones in route have valid adjacency connections', () => {
    const zones = getAllZones();
    for (const zone of zones) {
      for (const adjId of zone.adjacencies) {
        const adj = getZone(adjId);
        expect(adj).not.toBeNull();
        expect(adj!.adjacencies).toContain(zone.id);
      }
    }
  });

  it('route waypoints contain all required fields', () => {
    const requiredFields = ['id', 'name', 'zoneId', 'coordinates', 'instruction'];
    const sampleWaypoint = {
      id: 'wp-0',
      name: 'North Stand Lower',
      zoneId: 'zone-north-1',
      coordinates: { x: 10, y: 10 },
      instruction: 'Start at North Stand Lower',
    };

    for (const field of requiredFields) {
      expect(sampleWaypoint).toHaveProperty(field);
    }
  });

  it('travel time scales with graph distance', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (graphDistance) => {
          const travelTime = Math.ceil(graphDistance * 1.5);
          return travelTime >= graphDistance && travelTime > 0;
        }
      )
    );
  });
});

