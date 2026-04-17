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
  totalOccupancy: number;
  zones: ZoneDensity[];
}

export interface Trend {
  startTime: string;
  endTime: string;
  densityChangePercentage: number;
}
