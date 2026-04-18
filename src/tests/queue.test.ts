import { describe, it, expect, vi } from 'vitest';
import { calculateQueuePrediction } from '@/shared/lib/queue';
import { ConfidenceLevel, Facility, FacilityType } from '@/shared/types/queue';

// Mock dependencies with correct module paths
vi.mock('@/shared/lib/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue('50'),
  }),
}));

vi.mock('@/shared/lib/db', () => ({
  getHistoricalTrends: vi.fn().mockResolvedValue(new Array(120).fill({})),
}));

vi.mock('@/shared/lib/venue', () => ({
  getZone: (id: string) => ({
    id,
    name: 'Test Zone',
    capacity: 100,
  }),
}));

describe('Queue Prediction Logic (Requirement 8.1, 2.4)', () => {
  const mockFacility: Facility = {
    id: 'food-1',
    name: 'Burger & Brew',
    type: FacilityType.FOOD_STALL,
    zoneId: 'zone-food-1',
  };

  it('Property 7: Should return whole number wait times (Requirement 2.4)', async () => {
    const prediction = await calculateQueuePrediction(mockFacility);
    expect(Number.isInteger(prediction.waitTimeMinutes)).toBe(true);
    expect(prediction.waitTimeMinutes).toBeGreaterThanOrEqual(0);
  });

  it('Property 5: Should map confidence levels based on sample count', async () => {
    const db = await import('@/shared/lib/db');
    const mockedGetHistoricalTrends = vi.mocked(db.getHistoricalTrends);

    // Test HIGH confidence (>100 samples)
    mockedGetHistoricalTrends.mockResolvedValue(new Array(150).fill({}) as any);
    let prediction = await calculateQueuePrediction(mockFacility);
    expect(prediction.confidence).toBe(ConfidenceLevel.HIGH);

    // Test MEDIUM confidence (50-100)
    mockedGetHistoricalTrends.mockResolvedValue(new Array(75).fill({}) as any);
    prediction = await calculateQueuePrediction(mockFacility);
    expect(prediction.confidence).toBe(ConfidenceLevel.MEDIUM);

    // Test LOW confidence (10-49)
    mockedGetHistoricalTrends.mockResolvedValue(new Array(25).fill({}) as any);
    prediction = await calculateQueuePrediction(mockFacility);
    expect(prediction.confidence).toBe(ConfidenceLevel.LOW);

    // Test INSUFFICIENT confidence (<10)
    mockedGetHistoricalTrends.mockResolvedValue(new Array(5).fill({}) as any);
    prediction = await calculateQueuePrediction(mockFacility);
    expect(prediction.confidence).toBe(ConfidenceLevel.INSUFFICIENT);
  });

  it('Property 17: Should process prediction logic within 200ms (Requirement 5.2)', async () => {
    const start = performance.now();
    await calculateQueuePrediction(mockFacility);
    const end = performance.now();
    expect(end - start).toBeLessThan(200);
  });
});
