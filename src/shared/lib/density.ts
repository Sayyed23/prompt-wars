import { DensityLevel } from '../types/crowd';
import { DESIGN_TOKENS } from './design-tokens';

/**
 * Calculates the density level based on occupancy and capacity.
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
 */
export function getDensityColor(level: DensityLevel): string {
  switch (level) {
    case DensityLevel.LOW:
      return DESIGN_TOKENS.density.low;
    case DensityLevel.MODERATE:
      return DESIGN_TOKENS.density.moderate;
    case DensityLevel.HIGH:
      return DESIGN_TOKENS.density.high;
    case DensityLevel.CRITICAL:
      return DESIGN_TOKENS.density.critical;
    default:
      return DESIGN_TOKENS.colors.stealth[300];
  }
}
