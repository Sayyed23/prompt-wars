import { NextRequest, NextResponse } from 'next/server';
import { validateIoTData } from '@/shared/lib/iot';
import { calculateDensityLevel } from '@/shared/lib/density';
import { getZone } from '@/shared/lib/venue';
import { setCache, getRedisClient } from '@/shared/lib/redis';
import { appendDensityData } from '@/shared/lib/db';
import { ZoneDensity } from '@/shared/types/crowd';

/**
 * IoT Data Ingestion Endpoint (Requirement 11.2, 11.3, 11.4)
 * Receives sensor data, validates, and updates real-time caches/buffers.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate incoming data (Requirement 11.1, 11.4)
    const validData = validateIoTData(body);
    const { zoneId, occupancy, timestamp } = validData;

    // 2. Fetch zone details for processing
    const zone = getZone(zoneId); 
    if (!zone) {
      // Should already be caught by validateIoTData, but double-check
      return NextResponse.json({ error: 'Zone not found' }, { status: 400 });
    }

    // 3. Process data (Calculate density)
    const densityPercentage = (occupancy / zone.capacity) * 100;
    const level = calculateDensityLevel(occupancy, zone.capacity);

    const snapshot: ZoneDensity = {
      zoneId,
      occupancy,
      capacity: zone.capacity,
      densityPercentage,
      level,
      timestamp,
    };

    // 4. Update Redis Cache (Requirement 11.5)
    // Cache the latest density for immediate retrieval (Task 7.1)
    await setCache(`zone:density:${zoneId}`, JSON.stringify(snapshot), 300); // 5 min TTL

    // 5. Append to Time-Series Buffer (Requirement 11.5)
    // This handles the 5-minute rolling window in PostgreSQL
    await appendDensityData(snapshot);

    // 6. Broadcast Update via Redis Pub/Sub (Requirement 5.4)
    // This will be picked up by the SSE handler (Task 14)
    const redis = await getRedisClient();
    await redis.publish('crowd-updates', JSON.stringify(snapshot));

    // 7. Success Response
    return NextResponse.json({ 
      success: true, 
      data: snapshot 
    });

  } catch (error: any) {
    console.error('IoT Ingestion Error:', error.message);
    
    // Requirement 11.4: Log errors and return bad request
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }, 
      { status: 400 }
    );
  }
}
