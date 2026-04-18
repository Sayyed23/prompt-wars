import { describe, it, expect } from 'vitest';
import { validateIoTData } from '@/shared/lib/iot';
import { getZone, getAllZones } from '@/shared/lib/venue';

/**
 * E2E Test: IoT data loss and recovery (Task 24.6)
 * Requirements: 11.4
 */
describe('E2E: IoT Data Loss and Recovery', () => {
  it('system rejects invalid sensor data gracefully', () => {
    const invalidPayloads = [
      { zoneId: '', occupancy: 100, timestamp: new Date().toISOString() },
      { zoneId: 'zone-north-1', occupancy: -50, timestamp: new Date().toISOString() },
      { zoneId: 'nonexistent-zone', occupancy: 100, timestamp: new Date().toISOString() },
      { zoneId: 'zone-north-1', occupancy: 100, timestamp: 'not-a-date' },
    ];

    for (const payload of invalidPayloads) {
      expect(() => validateIoTData(payload)).toThrow();
    }
  });

  it('valid data continues to be accepted after invalid data', () => {
    expect(() =>
      validateIoTData({ zoneId: '', occupancy: -1, timestamp: 'bad' })
    ).toThrow();

    const validPayload = {
      zoneId: 'zone-north-1',
      occupancy: 100,
      timestamp: new Date().toISOString(),
    };

    const result = validateIoTData(validPayload);
    expect(result.zoneId).toBe('zone-north-1');
    expect(result.occupancy).toBe(100);
  });

  it('validation rejects occupancy above 120% of zone capacity', () => {
    const zone = getZone('zone-north-1')!;
    const overCapacity = Math.ceil(zone.capacity * 1.21);

    expect(() =>
      validateIoTData({
        zoneId: 'zone-north-1',
        occupancy: overCapacity,
        timestamp: new Date().toISOString(),
      })
    ).toThrow();
  });

  it('validation accepts occupancy up to 120% of zone capacity', () => {
    const zone = getZone('zone-north-1')!;
    const atLimit = Math.floor(zone.capacity * 1.2);

    const result = validateIoTData({
      zoneId: 'zone-north-1',
      occupancy: atLimit,
      timestamp: new Date().toISOString(),
    });

    expect(result.occupancy).toBe(atLimit);
  });

  it('all registered zones accept valid data', () => {
    const zones = getAllZones();

    for (const zone of zones) {
      const result = validateIoTData({
        zoneId: zone.id,
        occupancy: Math.floor(zone.capacity * 0.5),
        timestamp: new Date().toISOString(),
      });

      expect(result.zoneId).toBe(zone.id);
    }
  });
});
