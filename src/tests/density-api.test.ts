import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getGlobalDensitySnapshot, getZoneDensityDetails } from '@/shared/lib/crowd';
import { getAllZones, getZone } from '@/shared/lib/venue';
import { getCache } from '@/shared/lib/redis';
import { getHistoricalTrends } from '@/shared/lib/db';

// Mock dependencies
vi.mock('@/shared/lib/venue');
vi.mock('@/shared/lib/redis');
vi.mock('@/shared/lib/db');

describe('Crowd Density Logic (Task 7)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getGlobalDensitySnapshot', () => {
    it('Property: snapshot should aggregate all zone occupancies correctly', async () => {
      const mockZones = [
        { id: 'z1', capacity: 100 },
        { id: 'z2', capacity: 200 },
      ];
      (getAllZones as any).mockReturnValue(mockZones);

      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 200 }), async (occ1, occ2) => {
          (getCache as any).mockImplementation((key: string) => {
            if (key === 'zone:density:z1') return JSON.stringify({ zoneId: 'z1', occupancy: occ1 });
            if (key === 'zone:density:z2') return JSON.stringify({ zoneId: 'z2', occupancy: occ2 });
            return null;
          });

          const snapshot = await getGlobalDensitySnapshot();

          expect(Object.keys(snapshot.zones)).toHaveLength(2);
          expect(snapshot.zones['z1']?.occupancy).toBe(occ1);
          expect(snapshot.zones['z2']?.occupancy).toBe(occ2);
        })
      );
    });
  });

  describe('getZoneDensityDetails', () => {
    it('Property: should combine current state and trends', async () => {
      const mockZone = { id: 'z1', capacity: 100 };
      (getZone as any).mockReturnValue(mockZone);

      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 0, max: 100 }), fc.array(fc.object()), async (currentOcc, trends) => {
          (getCache as any).mockReturnValue(JSON.stringify({ zoneId: 'z1', occupancy: currentOcc }));
          (getHistoricalTrends as any).mockReturnValue(trends);

          const details = await getZoneDensityDetails('z1');

          expect(details?.current.occupancy).toBe(currentOcc);
          expect(details?.trends).toEqual(trends);
        })
      );
    });

    it('should return null for non-existent zones', async () => {
      (getZone as any).mockReturnValue(null);

      const details = await getZoneDensityDetails('non-existent');

      expect(details).toBeNull();
    });
  });
});
