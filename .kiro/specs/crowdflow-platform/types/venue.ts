export interface Coordinates {
  x: number;
  y: number;
}

export type Polygon = Coordinates[];

export enum ZoneType {
  ENTRY_GATE = 'entry_gate',
  FOOD_STALL = 'food_stall',
  SEATING_BOWL = 'seating_bowl',
  CONCOURSE = 'concourse',
  RESTROOMS = 'restrooms',
  EXIT = 'exit'
}

export interface VenueZone {
  id: string;
  name: string;
  type: ZoneType;
  capacity: number;
  coordinates: Polygon;
}
