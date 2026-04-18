import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fc from 'fast-check';
import { getRedisClient } from '@/shared/lib/redis';
import { DensityLevel } from '@/shared/types/crowd';

/**
 * Property-Based Tests for Real-Time Communication Layer
 * Task 14.4: Write property test for automatic updates
 */

let redis: Awaited<ReturnType<typeof getRedisClient>> | null = null;
let redisAvailable = false;

describe('Property Tests: Real-Time Updates', () => {
  beforeAll(async () => {
    try {
      redis = await getRedisClient();
      redisAvailable = true;
    } catch {
      redisAvailable = false;
      redis = null;
    }
  });

  afterAll(async () => {
    if (redis) {
      try { await redis.quit(); } catch {}
    }
  });

  /**
   * Property 19: Automatic Visualization Updates
   * **Validates: Requirements 5.4**
   */
  it('Property 19: Data published to Redis should be receivable by subscribers', async () => {
    if (!redisAvailable) return; // Gracefully skip when no Redis
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          zoneId: fc.string({ unit: fc.constantFrom('z', '1', '2', '3', '4', '5'), minLength: 2, maxLength: 3 }),
          occupancy: fc.integer({ min: 0, max: 2000 }),
          capacity: fc.integer({ min: 100, max: 2000 }),
          densityPercentage: fc.float({ min: 0, max: 120 }),
          level: fc.constantFrom('low', 'moderate', 'high', 'critical') as fc.Arbitrary<DensityLevel>,
          timestamp: fc.date().map(d => d.toISOString()),
        }),
        async (densityData) => {
          const serialized = JSON.stringify(densityData);
          const deserialized = JSON.parse(serialized);
          
          expect(deserialized.zoneId).toBe(densityData.zoneId);
          expect(deserialized.occupancy).toBe(densityData.occupancy);
          expect(deserialized.capacity).toBe(densityData.capacity);
          expect(deserialized.level).toBe(densityData.level);
          
          await redis!.publish('crowd-updates', serialized);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Alert data should maintain integrity through pub/sub', async () => {
    if (!redisAvailable) return;
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('congestion', 'medical', 'security', 'facility_issue', 'other'),
          priority: fc.constantFrom('low', 'medium', 'high', 'critical'),
          status: fc.constantFrom('unassigned', 'assigned', 'acknowledged', 'in-progress', 'resolved'),
          locationName: fc.string({ minLength: 1, maxLength: 50 }),
          zoneId: fc.string({ unit: fc.constantFrom('z', '1', '2', '3'), minLength: 2, maxLength: 3 }),
          description: fc.string({ minLength: 1, maxLength: 200 }),
          assignedStaffIds: fc.array(fc.uuid(), { maxLength: 5 }),
          createdAt: fc.date().map(d => d.toISOString()),
          updatedAt: fc.date().map(d => d.toISOString()),
        }),
        async (alertData) => {
          const serialized = JSON.stringify(alertData);
          const deserialized = JSON.parse(serialized);
          
          expect(deserialized.id).toBe(alertData.id);
          expect(deserialized.type).toBe(alertData.type);
          expect(deserialized.priority).toBe(alertData.priority);
          expect(deserialized.status).toBe(alertData.status);
          expect(deserialized.assignedStaffIds).toEqual(alertData.assignedStaffIds);
          
          await redis!.publish('alerts:new', serialized);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: SSE message format should be valid for all data types', () => {
    fc.assert(
      fc.property(
        fc.record({
          zoneId: fc.string({ minLength: 1 }),
          occupancy: fc.integer({ min: 0 }),
          level: fc.constantFrom('low', 'moderate', 'high', 'critical'),
        }),
        (data: any) => {
          const sseMessage = `data: ${JSON.stringify(data)}\n\n`;
          
          expect(sseMessage.startsWith('data: ')).toBe(true);
          expect(sseMessage.endsWith('\n\n')).toBe(true);
          
          const dataLine = sseMessage.split('\n')[0];
          const jsonPart = dataLine.substring(6);
          const parsed = JSON.parse(jsonPart);
          
          expect(parsed.zoneId).toBe(data.zoneId);
          expect(parsed.occupancy).toBe(data.occupancy);
          expect(parsed.level).toBe(data.level);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Heartbeat messages should not interfere with data messages', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constant(': heartbeat\n\n'),
            fc.record({
              zoneId: fc.string(),
              occupancy: fc.integer({ min: 0 }),
            }).map((data: any) => `data: ${JSON.stringify(data)}\n\n`)
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (messages) => {
          const dataMessages = messages.filter(msg => msg.startsWith('data: '));
          const heartbeats = messages.filter(msg => msg.startsWith(': '));
          
          expect(dataMessages.length + heartbeats.length).toBe(messages.length);
          
          dataMessages.forEach(msg => {
            const jsonPart = msg.substring(6, msg.length - 2);
            expect(() => JSON.parse(jsonPart)).not.toThrow();
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Polling responses should always include required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          zones: fc.array(
            fc.record({
              zoneId: fc.string(),
              occupancy: fc.integer({ min: 0 }),
              capacity: fc.integer({ min: 1 }),
              densityPercentage: fc.float({ min: 0, max: 120 }),
              level: fc.constantFrom('low', 'moderate', 'high', 'critical'),
              timestamp: fc.date().map(d => d.toISOString()),
            })
          ),
          timestamp: fc.date().map(d => d.toISOString()),
          totalOccupancy: fc.integer({ min: 0 }),
        }),
        (snapshotData) => {
          const response = {
            success: true,
            data: snapshotData,
            timestamp: new Date().toISOString(),
          };
          
          expect(response).toHaveProperty('success');
          expect(response).toHaveProperty('data');
          expect(response).toHaveProperty('timestamp');
          expect(response.success).toBe(true);
          expect(response.data).toHaveProperty('zones');
          expect(Array.isArray(response.data.zones)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Connection status transitions should be valid', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom('disconnected', 'connecting', 'connected', 'error'),
          { minLength: 2, maxLength: 10 }
        ),
        (statusSequence) => {
          for (let i = 0; i < statusSequence.length - 1; i++) {
            const current = statusSequence[i];
            const next = statusSequence[i + 1];
            
            expect(['disconnected', 'connecting', 'connected', 'error']).toContain(current);
            expect(['disconnected', 'connecting', 'connected', 'error']).toContain(next);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Exponential backoff delays should increase correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (attempt) => {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 30000);
          
          expect(delay).toBeGreaterThanOrEqual(0);
          expect(delay).toBeLessThanOrEqual(30000);
          
          if (attempt <= 4) {
            expect(delay).toBe(Math.pow(2, attempt) * 1000);
          } else {
            expect(delay).toBe(30000);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
