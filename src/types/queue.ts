export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INSUFFICIENT = 'insufficient',
}

export enum FacilityType {
  FOOD_STALL = 'food_stall',
  ENTRY_GATE = 'entry_gate',
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  zoneId: string;
}

export interface QueuePrediction {
  facilityId: string;
  waitTimeMinutes: number;
  confidence: ConfidenceLevel;
  timestamp: string;
}
