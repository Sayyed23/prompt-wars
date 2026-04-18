export interface Waypoint {
  id: string;
  name: string;
  zoneId: string;
  coordinates: { x: number; y: number };
  instruction: string;
  originalDensityPercentage?: number;
}

export interface Route {
  id: string;
  origin: { x: number; y: number };
  destination: { x: number; y: number };
  waypoints: Waypoint[];
  estimatedTimeMinutes: number;
  distanceMetres: number;
  timestamp: string;
}
