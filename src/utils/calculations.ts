import {
  WAIST_RATIO_CATEGORIES,
  ACTIVITY_MULTIPLIERS,
  INCHES_TO_CM,
  KG_TO_LBS,
} from "../config/constants";

/**
 * Calculates BMR using the Mifflin-St Jeor Equation
 * Enforces a safety floor to prevent impossible values
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
): number {
  // Defensive checks for invalid inputs
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 1200;

  const genderOffset = gender === "male" ? 5 : -161;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset;

  // Safety floor: 1200 for females, 1500 for males (typical base metabolic needs)
  return Math.max(bmr, gender === "male" ? 1500 : 1200);
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
  // Defensive checks to prevent division by zero or NaN
  const safeWaist = Math.max(waistCm, 1);
  const safeHeight = Math.max(heightCm, 1);
  const safeNeck = Math.max(neckCm, 1);
  const safeWeight = Math.max(weightKg, 1);

  // Step A: Calculate RFM Body Fat
  const rfmBodyFat =
    gender === "male"
      ? 64 - 20 * (safeHeight / safeWaist)
      : 76 - 20 * (safeHeight / safeWaist);

  // Step B: Calculate Navy Body Fat
  let navyBodyFat: number;
  const navyDenominator = Math.max(safeWaist - safeNeck, 0.1);

  if (gender === "male") {
    navyBodyFat =
      495 /
        (1.0324 -
          0.19077 * Math.log10(navyDenominator) +
          0.15456 * Math.log10(safeHeight)) -
      450;
  } else {
    // Female requires hip measurement
    const safeHip = Math.max(hipCm || 0, 1);
    const femaleNavyDenominator = Math.max(safeWaist + safeHip - safeNeck, 0.1);

    navyBodyFat =
      495 /
        (1.29579 -
          0.35004 * Math.log10(femaleNavyDenominator) +
          0.221 * Math.log10(safeHeight)) -
      450;
  }

  // Step C: Average Body Fat
  // Cap body fat at realistic ranges (3% to 60%)
  const rawAvgBodyFat = (rfmBodyFat + navyBodyFat) / 2;
  const cappedAvgBodyFat = Math.min(Math.max(rawAvgBodyFat, gender === "male" ? 3 : 8), 60);

  // Step 3: Calculate LBM and BMR using Katch-McArdle
  const leanBodyMass = safeWeight * (1 - cappedAvgBodyFat / 100);
  const bmr = 370 + 21.6 * leanBodyMass;

  // Calculate Waist-to-Height Ratio
  const waistToHeightRatio = safeWaist / safeHeight;

  // Final BMR safety floor
  const finalBmr = Math.max(bmr, gender === "male" ? 1500 : 1200);

  return {
    bmr: finalBmr,
    rfmBodyFat: Math.max(rfmBodyFat, 0),
    navyBodyFat: Math.max(navyBodyFat, 0),
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
  const proteinMin = Math.max(leanBodyMassKg * 2.0, 0);
  const proteinMax = Math.max(leanBodyMassKg * 2.5, 0);

  // Fat Floor: 0.3g per lb of goal weight
  const effectiveGoalWeight =
    goalWeightLbs || (leanBodyMassKg * KG_TO_LBS) / (1 - 0.15);
  const fatMin = Math.max(effectiveGoalWeight * 0.3, 0);

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
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.max(bmr * multiplier, bmr);
}

/**
 * Calculates Waist-to-Height Ratio
 */
export function calculateWaistToHeightRatio(
  waist: number,
  height: number,
): number {
  if (height <= 0) return 0;
  return waist / height;
}

/**
 * Calculates a simple moving average using an optimized approach.
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

  const isWeightDiffNegligible = Math.abs(currentWeight - targetWeight) < 0.5;
  if (targetLossRate === 0 || isWeightDiffNegligible) {
    return {
      type: "maintenance",
      label: "Maintenance Target",
      colorClass: "text-success",
      bgClass: "bg-success/10",
    };
  }

  if (targetLossRate < 0 || targetWeight > currentWeight) {
    return {
      type: "surplus",
      label: "Surplus Target",
      colorClass: "text-blue-500",
      bgClass: "bg-blue-500/10",
    };
  }

  return {
    type: "cutting",
    label: "Deficit Target",
    colorClass: "text-theme-accent",
    bgClass: "bg-theme-accent/10",
  };
}
