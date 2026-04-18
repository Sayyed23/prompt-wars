import { getRedisClient } from './redis';
import { getHistoricalTrends } from './db';
import { 
  QueuePrediction, 
  ConfidenceLevel, 
  Facility, 
  FacilityType 
} from '../types/queue';
import { getZone } from './venue';

/**
 * Service rates (people per minute) per facility type.
 */
const SERVICE_RATES: Record<FacilityType, number> = {
  [FacilityType.FOOD_STALL]: 5,
  [FacilityType.ENTRY_GATE]: 20,
};

/**
 * Calculates wait time prediction for a facility (Requirement 8.1).
 */
export async function calculateQueuePrediction(
  facility: Facility
): Promise<QueuePrediction> {
  const redis = getRedisClient();
  const zoneId = facility.zoneId;
  
  // Fetch current occupancy from Redis
  const occupancyStr = await redis.get(`occupancy:${zoneId}`);
  const occupancy = occupancyStr ? parseInt(occupancyStr, 10) : 0;
  
  // Fetch historical samples to determine confidence (Requirement 8.1)
  const history = await getHistoricalTrends(zoneId, 5);
  const sampleCount = history.length;
  
  let confidence: ConfidenceLevel;
  if (sampleCount >= 100) {
    confidence = ConfidenceLevel.HIGH;
  } else if (sampleCount >= 50) {
    confidence = ConfidenceLevel.MEDIUM;
  } else if (sampleCount >= 10) {
    confidence = ConfidenceLevel.LOW;
  } else {
    confidence = ConfidenceLevel.INSUFFICIENT;
  }

  // Calculate wait time (Requirement 2.4, 8.1)
  const serviceRate = SERVICE_RATES[facility.type];
  
  // Wait time = (Current Occupancy / Service Rate)
  // We apply a slight overhead factor if density is high (simulated logic)
  const zone = getZone(zoneId);
  const capacity = zone?.capacity || 100;
  const density = occupancy / capacity;
  const multiplier = 1 + (density > 0.8 ? 0.5 : 0); // 50% social distancing/congestion penalty
  
  const waitTimeMinutes = Math.ceil((occupancy / serviceRate) * multiplier);

  return {
    facilityId: facility.id,
    waitTimeMinutes,
    confidence,
    timestamp: new Date().toISOString(),
  };
}
