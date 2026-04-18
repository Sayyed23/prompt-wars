import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateIoTData } from '../../lib/iot';
import { getAllZones, getZone } from '../../lib/venue';

const validZoneIds = getAllZones().map(z => z.id);

/**
 * Property 39: IoT Data Processing Timing
 * Validates: Requirement 11.2 — Data validation completes synchronously in <1ms
 */
describe('Property 39: IoT Data Processing Timing', () => {
  it('IoT validation completes within 1ms average for valid data', () => {
    for (const zoneId of validZoneIds) {
      const zone = getZone(zoneId)!;
      const maxOccupancy = Math.floor(zone.capacity * 1.2);
      const BATCH = 50;

      const start = performance.now();
      for (let i = 0; i < BATCH; i++) {
        validateIoTData({
          zoneId,
          occupancy: Math.floor(Math.random() * maxOccupancy),
          timestamp: new Date().toISOString(),
        });
      }
      const duration = performance.now() - start;
      // Average should be well under 1ms; total batch under 10ms
      expect(duration / BATCH).toBeLessThan(1);
    }
  });
});

/**
 * Property 40: IoT Data Update Throughput
 * Validates: Requirement 11.3 — Can process 100+ validations sequentially in <100ms
 */
describe('Property 40: IoT Data Update Throughput', () => {
  it('processes 100 validations in <100ms', () => {
    const zoneId = validZoneIds[0];
    const zone = getZone(zoneId)!;

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      validateIoTData({
        zoneId,
        occupancy: Math.floor(Math.random() * zone.capacity),
        timestamp: new Date().toISOString(),
      });
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});

