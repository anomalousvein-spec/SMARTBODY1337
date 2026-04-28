import {
  WAIST_RATIO_CATEGORIES,
  ACTIVITY_MULTIPLIERS,
  INCHES_TO_CM,
  KG_TO_LBS,
} from "../config/constants";

/**
 * Calculates BMR using the Mifflin-St Jeor Equation
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
): number {
  const genderOffset = gender === "male" ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset;
}

/**
 * Advanced BMR calculation using averaged Navy + RFM body fat estimate
 * and Katch-McArdle formula based on Lean Body Mass
 */
export interface AdvancedBMRResult {
  bmr: number;
  rfmBodyFat: number;
  navyBodyFat: number;
  avgBodyFat: number;
  leanBodyMass: number;
  waistToHeightRatio: number;
}

export interface AdvancedMacroTargets {
  proteinMin: number;
  proteinMax: number;
  fatMin: number;
  carbs: number;
  remainingCalories: number;
}

export function calculateAdvancedBMR(
  weightKg: number,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm: number | undefined,
  gender: "male" | "female",
): AdvancedBMRResult {
  // Step A: Calculate RFM Body Fat
  const rfmBodyFat =
    gender === "male"
      ? 64 - 20 * (heightCm / waistCm)
      : 76 - 20 * (heightCm / waistCm);

  // Step B: Calculate Navy Body Fat
  let navyBodyFat: number;
  if (gender === "male") {
    navyBodyFat =
      495 /
        (1.0324 -
          0.19077 * Math.log10(waistCm - neckCm) +
          0.15456 * Math.log10(heightCm)) -
      450;
  } else {
    // Female requires hip measurement
    if (hipCm === undefined || hipCm <= 0) {
      // Fallback to male formula if hip not provided (shouldn't happen in UI)
      navyBodyFat =
        495 /
          (1.0324 -
            0.19077 * Math.log10(waistCm - neckCm) +
            0.15456 * Math.log10(heightCm)) -
        450;
    } else {
      navyBodyFat =
        495 /
          (1.29579 -
            0.35004 * Math.log10(waistCm + hipCm - neckCm) +
            0.221 * Math.log10(heightCm)) -
        450;
    }
  }

  // Step C: Average Body Fat
  const avgBodyFat = (rfmBodyFat + navyBodyFat) / 2;

  // Cap body fat at realistic minimums to prevent unsafe BMR calculations
  const cappedAvgBodyFat = Math.max(avgBodyFat, gender === "male" ? 3 : 8);

  // Step 3: Calculate LBM and BMR using Katch-McArdle
  const leanBodyMass = weightKg * (1 - cappedAvgBodyFat / 100);
  const bmr = 370 + 21.6 * leanBodyMass;

  // Calculate Waist-to-Height Ratio
  const waistToHeightRatio = waistCm / heightCm;

  return {
    bmr,
    rfmBodyFat,
    navyBodyFat,
    avgBodyFat: cappedAvgBodyFat,
    leanBodyMass,
    waistToHeightRatio,
  };
}

/**
 * Calculate advanced macro targets based on LBM and goal weight
 */
export function calculateAdvancedMacros(
  leanBodyMassKg: number,
  goalWeightLbs: number | undefined,
  bmr: number,
  tdee: number,
  targetCalories: number,
): AdvancedMacroTargets {
  // Protein: 2.0g to 2.5g per kg of LBM
  const proteinMin = leanBodyMassKg * 2.0;
  const proteinMax = leanBodyMassKg * 2.5;

  // Fat Floor: 0.3g per lb of goal weight
  // If goal weight not provided, estimate a healthy weight based on LBM and 15% body fat
  const effectiveGoalWeight =
    goalWeightLbs || (leanBodyMassKg * KG_TO_LBS) / (1 - 0.15);
  const fatMin = effectiveGoalWeight * 0.3;

  // Calculate remaining calories after protein and fat floors
  const proteinCalories = proteinMin * 4; // 4 cal per gram
  const fatCalories = fatMin * 9; // 9 cal per gram
  const remainingCalories = Math.max(targetCalories - proteinCalories - fatCalories, 0);

  // Carbs: Allocate remaining calories to carbs
  const carbs = remainingCalories / 4;

  return {
    proteinMin,
    proteinMax,
    fatMin,
    carbs,
    remainingCalories: 0, // Now fully allocated to carbs
  };
}

export function calculateTDEE(
  bmr: number,
  activityLevel: keyof typeof ACTIVITY_MULTIPLIERS,
): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Calculates Waist-to-Height Ratio
 */
export function calculateWaistToHeightRatio(
  waist: number,
  height: number,
): number {
  if (height === 0) return 0;
  return waist / height;
}

/**
 * Calculates a simple moving average using an optimized approach.
 * Complexity: O(n) instead of O(n*w)
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number,
): number[] {
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
      color: "text-yellow-400",
      description: WAIST_RATIO_CATEGORIES.UNDERWEIGHT.description,
    };
  }
  if (ratio < WAIST_RATIO_CATEGORIES.HEALTHY_LOW.threshold) {
    return {
      category: WAIST_RATIO_CATEGORIES.HEALTHY_LOW.label,
      color: "text-green-600 dark:text-green-400",
      description: WAIST_RATIO_CATEGORIES.HEALTHY_LOW.description,
    };
  }
  if (ratio < WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.threshold) {
    return {
      category: WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.label,
      color: "text-orange-600 dark:text-orange-400",
      description: WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.description,
    };
  }
  if (ratio < WAIST_RATIO_CATEGORIES.OBESE_1.threshold) {
    return {
      category: WAIST_RATIO_CATEGORIES.OBESE_1.label,
      color: "text-red-400",
      description: WAIST_RATIO_CATEGORIES.OBESE_1.description,
    };
  }
  return {
    category: WAIST_RATIO_CATEGORIES.OBESE_2_PLUS.label,
    color: "text-red-400",
    description: WAIST_RATIO_CATEGORIES.OBESE_2_PLUS.description,
  };
}

/**
 * Normalizes measurements to a single unit (defaulting to cm for internal calculations)
 */
export function normalizeMeasurement(value: number, unit: "in" | "cm"): number {
  return unit === "in" ? value * INCHES_TO_CM : value;
}

/**
 * Dynamic Phase Labeling system
 * Determines user's current phase based on TDEE settings
 */
export interface PhaseInfo {
  type: "cutting" | "maintenance" | "surplus";
  label: string;
  colorClass: string;
  bgClass: string;
}

export function getUserPhase(
  currentWeight: number | undefined,
  targetWeight: number | undefined,
  targetLossRate: number | undefined,
): PhaseInfo {
  // Default to cutting if no data available
  if (
    currentWeight === undefined ||
    targetWeight === undefined ||
    targetLossRate === undefined
  ) {
    return {
      type: "cutting",
      label: "Deficit Target",
      colorClass: "text-theme-accent",
      bgClass: "bg-theme-accent/10",
    };
  }

  // Maintenance: targetLossRate === 0 OR weights are within 0.5 lbs
  const isWeightDiffNegligible = Math.abs(currentWeight - targetWeight) < 0.5;
  if (targetLossRate === 0 || isWeightDiffNegligible) {
    return {
      type: "maintenance",
      label: "Maintenance Target",
      colorClass: "text-success",
      bgClass: "bg-success/10",
    };
  }

  // Surplus: negative loss rate (means gain) OR target > current
  if (targetLossRate < 0 || targetWeight > currentWeight) {
    return {
      type: "surplus",
      label: "Surplus Target",
      colorClass: "text-blue-500",
      bgClass: "bg-blue-500/10",
    };
  }

  // Cutting: targetWeight < currentWeight AND targetLossRate > 0
  return {
    type: "cutting",
    label: "Deficit Target",
    colorClass: "text-theme-accent",
    bgClass: "bg-theme-accent/10",
  };
}
