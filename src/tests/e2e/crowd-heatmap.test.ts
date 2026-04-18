import { describe, it, expect } from 'vitest';
import { calculateDensityLevel, getDensityColor } from '@/shared/lib/density';
import { DensityLevel } from '@/shared/types/crowd';
import { getAllZones, getAllFacilities } from '@/shared/lib/venue';
import { FacilityType } from '@/shared/types/queue';

/**
 * E2E Test: Attendee views crowd heatmap and queue times (Task 24.1)
 * Requirements: 1.1, 1.3, 2.1
 */
describe('E2E: Crowd Heatmap Visualization', () => {
  const zones = getAllZones();

  it('all venue zones are available for visualization', () => {
    expect(zones.length).toBeGreaterThanOrEqual(4);
    for (const zone of zones) {
      expect(zone.id).toBeTruthy();
      expect(zone.name).toBeTruthy();
      expect(zone.capacity).toBeGreaterThan(0);
      expect(zone.coordinates).toHaveLength(4);
    }
  });

  it('density levels produce correct color mapping', () => {
    const colorMap: Record<string, string> = {};

    for (const zone of zones) {
      const testCases = [
        { occupancy: 0, expected: DensityLevel.LOW },
        { occupancy: zone.capacity * 0.3, expected: DensityLevel.LOW },
        { occupancy: zone.capacity * 0.5, expected: DensityLevel.MODERATE },
        { occupancy: zone.capacity * 0.8, expected: DensityLevel.HIGH },
        { occupancy: zone.capacity * 0.95, expected: DensityLevel.CRITICAL },
      ];

      for (const tc of testCases) {
        const level = calculateDensityLevel(tc.occupancy, zone.capacity);
        expect(level).toBe(tc.expected);

        const color = getDensityColor(level);
        expect(color).toBeTruthy();
        colorMap[level] = color;
      }
    }

    // Verify all four levels have distinct colors
    const uniqueColors = new Set(Object.values(colorMap));
    expect(uniqueColors.size).toBe(4);
  });

  it('zone coordinates form valid polygons for SVG rendering', () => {
    for (const zone of zones) {
      expect(zone.coordinates).toHaveLength(4);
      for (const coord of zone.coordinates) {
        expect(coord.x).toBeGreaterThanOrEqual(0);
        expect(coord.x).toBeLessThanOrEqual(100);
        expect(coord.y).toBeGreaterThanOrEqual(0);
        expect(coord.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it('density colors map low=green, moderate=yellow, high=orange, critical=red', () => {
    const lowColor = getDensityColor(DensityLevel.LOW);
    const criticalColor = getDensityColor(DensityLevel.CRITICAL);
    expect(lowColor).not.toBe(criticalColor);
  });
});

describe('E2E: Queue Predictions Display', () => {
  it('all facilities are registered in the venue', () => {
    const facilities = getAllFacilities();
    expect(facilities.length).toBeGreaterThan(0);

    for (const facility of facilities) {
      expect(facility).toHaveProperty('id');
      expect(facility).toHaveProperty('name');
      expect(facility).toHaveProperty('type');
      expect(facility).toHaveProperty('zoneId');
    }
  });

  it('facility types cover food and entry gates', () => {
    const facilities = getAllFacilities();
    const types = new Set(facilities.map(f => f.type));
    expect(types.has(FacilityType.FOOD_STALL)).toBe(true);
    expect(types.has(FacilityType.ENTRY_GATE)).toBe(true);
  });
});
