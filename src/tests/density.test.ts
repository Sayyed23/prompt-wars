import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateDensityLevel, getDensityColor } from '../lib/density';
import { DensityLevel } from '../types/crowd';

describe('calculateDensityLevel property tests', () => {
  it('should return LOW for occupancy up to 40% of capacity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (capacity) => {
        const maxOccupancy = Math.floor(capacity * 0.4);
        for (let occupancy = 0; occupancy <= maxOccupancy; occupancy++) {
          expect(calculateDensityLevel(occupancy, capacity)).toBe(
            DensityLevel.LOW,
          );
        }
      }),
    );
  });

  it('should return MODERATE for occupancy between 40% and 70% of capacity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 1000 }), (capacity) => {
        const minOccupancy = Math.floor(capacity * 0.4 + 1e-9) + 1;
        const maxOccupancy = Math.floor(capacity * 0.7);
        if (minOccupancy <= maxOccupancy) {
          expect(calculateDensityLevel(minOccupancy, capacity)).toBe(
            DensityLevel.MODERATE,
          );
          expect(calculateDensityLevel(maxOccupancy, capacity)).toBe(
            DensityLevel.MODERATE,
          );
        }
      }),
    );
  });

  it('should return HIGH for occupancy between 70% and 90% of capacity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 1000 }), (capacity) => {
        const minOccupancy = Math.floor(capacity * 0.7 + 1e-9) + 1;
        const maxOccupancy = Math.floor(capacity * 0.9);
        if (minOccupancy <= maxOccupancy) {
          expect(calculateDensityLevel(minOccupancy, capacity)).toBe(
            DensityLevel.HIGH,
          );
          expect(calculateDensityLevel(maxOccupancy, capacity)).toBe(
            DensityLevel.HIGH,
          );
        }
      }),
    );
  });

  it('should return CRITICAL for occupancy above 90% of capacity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 10, max: 1000 }), (capacity) => {
        const minOccupancy = Math.floor(capacity * 0.9) + 1;
        expect(calculateDensityLevel(minOccupancy, capacity)).toBe(
          DensityLevel.CRITICAL,
        );
        expect(calculateDensityLevel(capacity, capacity)).toBe(
          DensityLevel.CRITICAL,
        );
        expect(calculateDensityLevel(capacity * 1.5, capacity)).toBe(
          DensityLevel.CRITICAL,
        );
      }),
    );
  });

  it('should always return a valid color for any density level', () => {
    Object.values(DensityLevel).forEach((level) => {
      const color = getDensityColor(level);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
