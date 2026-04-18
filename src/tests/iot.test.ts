import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateIoTData } from '../lib/iot';
import { getAllZones } from '../lib/venue';

/**
 * Property Tests for Task 6: IoT Data Ingestion and Validation
 */

describe('IoT Data Validation (Requirement 11.1, 11.4)', () => {
  const zones = getAllZones();
  const validZoneIds = zones.map((z) => z.id);

  it('Property 38: Should accept and format valid IoT data correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validZoneIds), // Valid zone IDs
        fc.integer({ min: 0, max: 1000 }), // occupancy within common limits
        fc.date(), // valid date
        (zoneId, occupancy, date) => {
          const timestamp = date.toISOString();
          const payload = { zoneId, occupancy, timestamp };
          
          const result = validateIoTData(payload);
          
          expect(result.zoneId).toBe(zoneId);
          expect(result.occupancy).toBe(occupancy);
          expect(result.timestamp).toBe(timestamp);
        }
      )
    );
  });

  it('Property 41: Should throw error for negative occupancy', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validZoneIds),
        fc.integer({ max: -1 }), // Negative occupancy
        fc.date(),
        (zoneId, occupancy, date) => {
          const payload = { zoneId, occupancy, timestamp: date.toISOString() };
          expect(() => validateIoTData(payload)).toThrow(/cannot be negative/);
        }
      )
    );
  });

  it('Property 41: Should throw error for occupancy exceeding 120% capacity', () => {
    // We'll test with each zone's specific capacity
    zones.forEach(zone => {
      const excessiveOccupancy = Math.floor(zone.capacity * 1.2) + 1;
      const payload = { 
        zoneId: zone.id, 
        occupancy: excessiveOccupancy, 
        timestamp: new Date().toISOString() 
      };
      
      expect(() => validateIoTData(payload)).toThrow(/exceeds 120% of zone capacity/);
    });
  });

  it('Property 41: Should throw error for non-existent zoneId', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(id => !validZoneIds.includes(id)), // Any non-empty string not a valid zoneId
        fc.integer({ min: 0 }),
        fc.date(),
        (zoneId, occupancy, date) => {
          const payload = { zoneId, occupancy, timestamp: date.toISOString() };
          expect(() => validateIoTData(payload)).toThrow(/not found in registry/);
        }
      )
    );
  });

  it('Property 39: IoT Data Processing Timing (Requirement 11.2)', () => {
    // Property: Validation should be extremely fast (< 1ms) to support high throughput
    const payload = { 
      zoneId: validZoneIds[0], 
      occupancy: 100, 
      timestamp: new Date().toISOString() 
    };
    
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      validateIoTData(payload);
    }
    const end = performance.now();
    const averageTime = (end - start) / 1000;
    
    expect(averageTime).toBeLessThan(1); // average < 1ms
  });

  it('Property 40: IoT Data Update Throughput (Requirement 11.3)', () => {
    // Property: Should handle valid data for multiple zones without conflict
    const batch = validZoneIds.map(id => ({
      zoneId: id,
      occupancy: 50,
      timestamp: new Date().toISOString()
    }));

    const results = batch.map(p => validateIoTData(p));
    expect(results).toHaveLength(validZoneIds.length);
  });
});
