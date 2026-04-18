import { VenueZone, ZoneType } from '../types/venue';
import { Facility, FacilityType } from '../types/queue';

/**
 * Enhanced Venue Zone with Adjacency Support for Wayfinding
 */
export interface EnhancedVenueZone extends VenueZone {
  adjacencies: string[]; // IDs of neighboring zones
}

/**
 * Mock Venue Registry
 * In a production system, this data would come from a database.
 */
const MOCK_ZONES: Record<string, EnhancedVenueZone> = {
  'zone-north-1': {
    id: 'zone-north-1',
    name: 'North Stand Lower',
    type: ZoneType.SEATING_BOWL,
    capacity: 5000,
    coordinates: [],
    adjacencies: ['zone-food-1'],
  },
  'zone-south-1': {
    id: 'zone-south-1',
    name: 'South Stand Lower',
    type: ZoneType.SEATING_BOWL,
    capacity: 5000,
    coordinates: [],
    adjacencies: ['zone-food-1'],
  },
  'zone-food-1': {
    id: 'zone-food-1',
    name: 'Main Food Concourse',
    type: ZoneType.FOOD_STALL,
    capacity: 1000,
    coordinates: [],
    adjacencies: ['zone-north-1', 'zone-south-1', 'zone-entry-1'],
  },
  'zone-entry-1': {
    id: 'zone-entry-1',
    name: 'Main West Entry',
    type: ZoneType.ENTRY_GATE,
    capacity: 2000,
    coordinates: [],
    adjacencies: ['zone-food-1'],
  },
};

const MOCK_FACILITIES: Record<string, Facility> = {
  'gate-1': {
    id: 'gate-1',
    name: 'West Gate Primary',
    type: FacilityType.ENTRY_GATE,
    zoneId: 'zone-entry-1',
  },
  'food-1': {
    id: 'food-1',
    name: 'Burger & Brew',
    type: FacilityType.FOOD_STALL,
    zoneId: 'zone-food-1',
  },
};

/**
 * Fetches a zone by its ID.
 * (Requirement 11.1)
 */
export function getZone(zoneId: string): EnhancedVenueZone | null {
  return MOCK_ZONES[zoneId] || null;
}

/**
 * Fetches all managed zones.
 */
export function getAllZones(): EnhancedVenueZone[] {
  return Object.values(MOCK_ZONES);
}

/**
 * Fetches a facility by its ID.
 */
export function getFacility(facilityId: string): Facility | null {
  return MOCK_FACILITIES[facilityId] || null;
}

/**
 * Fetches all facilities, optionally filtered by type.
 */
export function getAllFacilities(type?: FacilityType): Facility[] {
  const facilities = Object.values(MOCK_FACILITIES);
  if (type) {
    return facilities.filter(f => f.type === type);
  }
  return facilities;
}
