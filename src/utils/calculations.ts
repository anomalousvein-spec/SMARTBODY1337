import {
  WAIST_RATIO_CATEGORIES,
  WAIST_RATIO_DISPLAY_CATEGORIES,
  ACTIVITY_MULTIPLIERS,
  INCHES_TO_CM
} from '../config/constants';

/**
 * Calculates BMR using the Mifflin-St Jeor Equation
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number {
  const genderOffset = gender === 'male' ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + genderOffset;
}

export function calculateTDEE(
  bmr: number,
  activityLevel: keyof typeof ACTIVITY_MULTIPLIERS
): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Calculates Waist-to-Height Ratio
 */
export function calculateWaistToHeightRatio(waist: number, height: number): number {
  if (height === 0) return 0;
  return waist / height;
}

/**
 * Calculates a simple moving average using an optimized approach.
 * Complexity: O(n) instead of O(n*w)
 */
export function calculateMovingAverage(data: number[], windowSize: number): number[] {
  if (data.length === 0) return [];
  if (windowSize <= 0) return [...data];

  const result: number[] = new Array(data.length);
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i];

    if (i >= windowSize) {
      sum -= data[i - windowSize];
    }

    const count = Math.min(i + 1, windowSize);
    result[i] = sum / count;
  }

  return result;
}

export interface HealthCategory {
  category: string;
  color: string;
  description: string;
}

/**
 * Health Category based on Waist-to-Height Ratio (centralized logic)
 */
export function getWaistToHeightCategory(ratio: number): HealthCategory {
  if (ratio < WAIST_RATIO_CATEGORIES.UNDERWEIGHT.threshold) {
    return { 
      category: WAIST_RATIO_CATEGORIES.UNDERWEIGHT.label,
      color: 'text-yellow-400',
      description: WAIST_RATIO_CATEGORIES.UNDERWEIGHT.description
    };
  }
  if (ratio < WAIST_RATIO_CATEGORIES.HEALTHY_LOW.threshold) {
    return { 
      category: WAIST_RATIO_CATEGORIES.HEALTHY_LOW.label,
      color: 'text-green-600 dark:text-green-400',
      description: WAIST_RATIO_CATEGORIES.HEALTHY_LOW.description
    };
  }
  if (ratio < WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.threshold) {
    return { 
      category: WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.label,
      color: 'text-orange-600 dark:text-orange-400',
      description: WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.description
    };
  }
  if (ratio < WAIST_RATIO_CATEGORIES.OBESE_1.threshold) {
    return { 
      category: WAIST_RATIO_CATEGORIES.OBESE_1.label,
      color: 'text-red-400',
      description: WAIST_RATIO_CATEGORIES.OBESE_1.description
    };
  }
  return { 
    category: WAIST_RATIO_CATEGORIES.OBESE_2_PLUS.label,
    color: 'text-red-400',
    description: WAIST_RATIO_CATEGORIES.OBESE_2_PLUS.description
  };
}

/**
 * Simplified display category for dashboard widgets
 */
export function getWaistToHeightDisplayCategory(ratio: number): { label: string; color: string } {
  if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.SLIM.threshold) return { label: 'Slim', color: 'text-blue-400' };
  if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.HEALTHY.threshold) return { label: 'Healthy', color: 'text-green-400' };
  if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.OVERWEIGHT.threshold) return { label: 'Overweight', color: 'text-yellow-400' };
  return { label: 'High Risk', color: 'text-red-400' };
}

/**
 * Normalizes measurements to a single unit (defaulting to cm for internal calculations)
 */
export function normalizeMeasurement(value: number, unit: 'in' | 'cm'): number {
  return unit === 'in' ? value * INCHES_TO_CM : value;
}
