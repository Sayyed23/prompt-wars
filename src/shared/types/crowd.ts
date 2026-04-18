export enum DensityLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ZoneDensity {
  zoneId: string;
  occupancy: number;
  capacity: number;
  densityPercentage: number;
  level: DensityLevel;
  timestamp: string;
}

export interface DensitySnapshot {
  timestamp: string;
  lastUpdated: string;
  totalOccupancy: number;
  zones: Record<string, ZoneDensity>;
}

export interface Trend {
  startTime: string;
  endTime: string;
  densityChangePercentage: number;
}
