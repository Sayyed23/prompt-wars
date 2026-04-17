import { Pool } from 'pg';
import { ZoneDensity } from '../types/crowd';

/**
 * PostgreSQL Database Client Manager (Requirement 11.5)
 * Handles connection pooling and data operations for time-series snapshots.
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: process.env.DB_SKIP_CERT_VERIFY !== 'true' } 
    : false,
});

/**
 * Initializes the database schema.
 * This should be called during application startup.
 */
export async function initializeDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS zone_densities (
        id SERIAL PRIMARY KEY,
        zone_id TEXT NOT NULL,
        occupancy INTEGER NOT NULL,
        capacity INTEGER NOT NULL,
        density_percentage FLOAT NOT NULL,
        level TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_zone_densities_timestamp ON zone_densities(timestamp);
      CREATE INDEX IF NOT EXISTS idx_zone_densities_zone_id ON zone_densities(zone_id);
    `);
  } catch (err) {
    console.error('Failed to initialize database schema', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Appends a new density snapshot and triggers a purge of old data.
 */
export async function appendDensityData(data: ZoneDensity): Promise<void> {
  const { zoneId, occupancy, capacity, densityPercentage, level, timestamp } = data;

  await pool.query(
    `INSERT INTO zone_densities (zone_id, occupancy, capacity, density_percentage, level, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [zoneId, occupancy, capacity, densityPercentage, level, timestamp]
  );

  // Requirement 11.5: Purge data older than 5 minutes on write
  await purgeOldData();
}

/**
 * Retrieves historical density trends for a specific zone within a time window.
 */
export async function getHistoricalTrends(
  zoneId: string,
  minutes: number = 5
): Promise<ZoneDensity[]> {
  const result = await pool.query(
    `SELECT zone_id as "zoneId", occupancy, capacity, density_percentage as "densityPercentage", level, timestamp
     FROM zone_densities
     WHERE zone_id = $1 AND timestamp >= NOW() - INTERVAL '1 minute' * $2
     ORDER BY timestamp ASC`,
    [zoneId, minutes]
  );

  return result.rows.map(row => ({
    ...row,
    timestamp: row.timestamp.toISOString(),
  }));
}

/**
 * Deletes records older than the specified retention period (default 5 minutes).
 */
export async function purgeOldData(retentionMinutes: number = 5): Promise<void> {
  try {
    await pool.query(
      `DELETE FROM zone_densities WHERE timestamp < NOW() - INTERVAL '1 minute' * $1`,
      [retentionMinutes]
    );
  } catch (err) {
    console.error('Error purging old density data', err);
  }
}

/**
 * Closes the database pool (useful for cleanup).
 */
export async function closeDb(): Promise<void> {
  await pool.end();
}
