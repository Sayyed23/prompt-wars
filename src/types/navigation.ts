import { Coordinates } from './venue';

export interface Waypoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  instruction: string;
  zoneId: string;
}

export interface Route {
  id: string;
  origin: Coordinates;
  destination: Coordinates;
  waypoints: Waypoint[];
  estimatedTimeMinutes: number;
  distanceMetres: number;
  timestamp: string;
}
