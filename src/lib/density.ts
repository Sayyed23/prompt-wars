import { DensityLevel } from '../types/crowd';

/**
 * Calculates the density level based on occupancy and capacity.
 *
 * Logic (Requirement 11.1):
 * - Low: 0-40%
 * - Moderate: 41-70%
 * - High: 71-90%
 * - Critical: 91-100% (or above)
 *
 * @param occupancy The current number of people in the zone
 * @param capacity The maximum capacity of the zone
 * @returns The density level
 */
export function calculateDensityLevel(
  occupancy: number,
  capacity: number,
): DensityLevel {
  if (capacity <= 0) return DensityLevel.LOW;

  const percentage = (occupancy / capacity) * 100;

  if (percentage <= 40) return DensityLevel.LOW;
  if (percentage <= 70) return DensityLevel.MODERATE;
  if (percentage <= 90) return DensityLevel.HIGH;
  return DensityLevel.CRITICAL;
}

/**
 * Maps a density level to a CSS color variable or hex code.
 * (Requirement 1.3)
 *
 * @param level The density level
 * @returns A color representation
 */
export function getDensityColor(level: DensityLevel): string {
  switch (level) {
    case DensityLevel.LOW:
      return '#4caf50'; // Green
    case DensityLevel.MODERATE:
      return '#ffeb3b'; // Yellow
    case DensityLevel.HIGH:
      return '#ff9800'; // Orange
    case DensityLevel.CRITICAL:
      return '#f44336'; // Red
    default:
      return '#9e9e9e'; // Grey
  }
}
