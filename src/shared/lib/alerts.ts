import { getRedisClient } from './redis';
import { Alert, AlertStatus, AlertPriority, AlertType } from '../types/alerts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Alert Management Service (Requirement 12.1)
 * Handles storage and lifecycle of staff alerts and attendee notifications.
 */

const ACTIVE_ALERTS_KEY = 'alerts:active';

/**
 * Checks and increments notification rate limit for a user (Requirement 12.4).
 * Limit: 3 notifications per 15 minutes.
 */
export async function checkNotificationRateLimit(userId: string): Promise<boolean> {
  const redis = await getRedisClient();
  const key = `ratelimit:notifications:${userId}`;
  
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 900); // 15 minutes
  }
  
  return count <= 3;
}

/**
 * Creates a new alert and stores it in Redis (Requirement 12.1).
 */
export async function createAlert(data: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'assignedStaffIds'>): Promise<Alert> {
  const redis = await getRedisClient();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const alert: Alert = {
    ...data,
    id,
    status: AlertStatus.UNASSIGNED,
    assignedStaffIds: [],
    createdAt: now,
    updatedAt: now,
  };

  // Store alert details and add to set of active alerts
  await redis.set(`alert:${id}`, JSON.stringify(alert));
  await redis.sAdd(ACTIVE_ALERTS_KEY, id);
  
  // Requirement 6.1: Broadcast alert via Redis pub/sub
  await redis.publish('alerts:new', JSON.stringify(alert));
  
  return alert;
}

/**
 * Updates the status of an existing alert (Requirement 6.4).
 */
export async function updateAlertStatus(
  alertId: string, 
  status: AlertStatus,
  staffIds?: string[]
): Promise<Alert | null> {
  const redis = await getRedisClient();
  const key = `alert:${alertId}`;
  
  const data = await redis.get(key);
  if (!data) return null;
  
  const alert: Alert = JSON.parse(data);
  alert.status = status;
  alert.updatedAt = new Date().toISOString();
  if (staffIds) {
    alert.assignedStaffIds = Array.from(new Set([...alert.assignedStaffIds, ...staffIds]));
  }
  
  await redis.set(key, JSON.stringify(alert));
  
  // If resolved, remove from active set
  if (status === AlertStatus.RESOLVED) {
    await redis.sRem(ACTIVE_ALERTS_KEY, alertId);
  }
  
  await redis.publish('alerts:update', JSON.stringify(alert));
  
  return alert;
}

/**
 * Retrieves all active alerts (Requirement 6.5).
 */
export async function getActiveAlerts(): Promise<Alert[]> {
  const redis = await getRedisClient();
  const alertIds = await redis.sMembers(ACTIVE_ALERTS_KEY);
  
  if (alertIds.length === 0) return [];
  
  const alertsData = await Promise.all(
    alertIds.map((id: string) => redis.get(`alert:${id}`))
  );
  
  return alertsData
    .filter((d): d is string => !!d)
    .map((d: string) => JSON.parse(d) as Alert)
    .sort((a: Alert, b: Alert) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
