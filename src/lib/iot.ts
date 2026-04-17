import { getZone } from './venue';

export interface IoTDataPayload {
  zoneId: string;
  occupancy: number;
  timestamp: string;
}

/**
 * Validates incoming IoT sensor data.
 * (Requirements 11.1, 11.4)
 */
export function validateIoTData(data: any): IoTDataPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid IoT data: Payload must be an object');
  }

  const { zoneId, occupancy, timestamp } = data;

  // 1. Check for required fields
  if (!zoneId || typeof zoneId !== 'string') {
    throw new Error('Invalid IoT data: zoneId is required and must be a string');
  }

  if (occupancy === undefined || occupancy === null || typeof occupancy !== 'number') {
    throw new Error('Invalid IoT data: occupancy is required and must be a number');
  }

  if (!timestamp || typeof timestamp !== 'string') {
    throw new Error('Invalid IoT data: timestamp is required and must be a string');
  }

  // 2. Validate occupancy range (Requirement 11.1)
  if (occupancy < 0) {
    throw new Error('Invalid IoT data: occupancy cannot be negative');
  }

  // 3. Fetch zone and validate against capacity
  const zone = getZone(zoneId);
  if (!zone) {
    throw new Error(`Invalid IoT data: zoneId "${zoneId}" not found in registry`);
  }

  // Validation for occupancy within capacity limits (0 to 120% of capacity)
  const maxCapacity = zone.capacity * 1.2;
  if (occupancy > maxCapacity) {
    throw new Error(
      `Invalid IoT data: occupancy ${occupancy} exceeds 120% of zone capacity (${maxCapacity})`
    );
  }

  // 4. Validate timestamp format
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid IoT data: timestamp must be a valid ISO 8601 string');
  }

  return {
    zoneId,
    occupancy: Math.floor(occupancy), // Ensure integer
    timestamp: date.toISOString(),
  };
}
