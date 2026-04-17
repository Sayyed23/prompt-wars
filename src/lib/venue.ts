import { VenueZone, ZoneType } from '../types/venue';

/**
 * Mock Venue Registry
 * In a production system, this data would come from a database.
 */
const MOCK_ZONES: Record<string, VenueZone> = {
  'zone-north-1': {
    id: 'zone-north-1',
    name: 'North Stand Lower',
    type: ZoneType.SEATING_BOWL,
    capacity: 5000,
    coordinates: [], // Optional for basic ingestion
  },
  'zone-south-1': {
    id: 'zone-south-1',
    name: 'South Stand Lower',
    type: ZoneType.SEATING_BOWL,
    capacity: 5000,
    coordinates: [],
  },
  'zone-food-1': {
    id: 'zone-food-1',
    name: 'Main Food Concourse',
    type: ZoneType.FOOD_STALL,
    capacity: 1000,
    coordinates: [],
  },
  'zone-entry-1': {
    id: 'zone-entry-1',
    name: 'Main West Entry',
    type: ZoneType.ENTRY_GATE,
    capacity: 2000,
    coordinates: [],
  },
};

/**
 * Fetches a zone by its ID.
 * (Requirement 11.1)
 */
export function getZone(zoneId: string): VenueZone | null {
  return MOCK_ZONES[zoneId] || null;
}

/**
 * Fetches all managed zones.
 */
export function getAllZones(): VenueZone[] {
  return Object.values(MOCK_ZONES);
}
