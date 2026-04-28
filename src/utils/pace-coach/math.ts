import {
  BMR_FLOOR_MALE,
  BMR_FLOOR_FEMALE,
  calculatePercentageLoss,
} from "../percentageLoss";
import { PACE_COACH_MAX_ADJUSTMENT_STEP } from "../../config/constants";

export function calculateTrendSlope(weights: number[]): number {
  if (weights.length < 2) return 0;
  const n = weights.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i,
      y = weights[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
}

export function calculateBackCalculatedTDEE(
  averageIntake: number,
  dailyWeightChange: number,
): number {
  return averageIntake - dailyWeightChange * 3500;
}

export function calculateSuggestedIntake(params: {
  currentTDEE: number;
  goalLbsPerWeek: number;
  lastSuggestedIntake?: number;
  bmr?: number;
  gender?: "male" | "female";
  currentWeight?: number;
}): number {
  const {
    currentTDEE,
    goalLbsPerWeek,
    lastSuggestedIntake,
    bmr,
    gender,
    currentWeight,
  } = params;

  const staticFloor = (gender === "male" ? BMR_FLOOR_MALE : BMR_FLOOR_FEMALE);
  const effectiveBmrFloor = Math.max(bmr || 0, staticFloor);

  if (currentWeight && currentWeight > 0) {
    let percentage = (goalLbsPerWeek / currentWeight) * 100;
    // Cap aggressive goals at 1% for auto-suggestions to avoid massive drops
    const effectivePercentage = Math.min(percentage, 1.0);

    const result = calculatePercentageLoss(
      currentWeight,
      "lbs",
      effectivePercentage,
      currentTDEE,
      effectiveBmrFloor,
      gender || "female",
    );

    let suggestion = Math.round(result.proposedIntake);

    if (lastSuggestedIntake) {
      const diff = suggestion - lastSuggestedIntake;
      const MAX_STEP = PACE_COACH_MAX_ADJUSTMENT_STEP;
      if (Math.abs(diff) > MAX_STEP)
        suggestion = lastSuggestedIntake + (diff > 0 ? MAX_STEP : -MAX_STEP);
    }
    return suggestion;
  }

  const targetDeficit = (goalLbsPerWeek / 7) * 3500;
  let suggestion = Math.round(currentTDEE - targetDeficit);

  suggestion = Math.max(suggestion, effectiveBmrFloor);

  if (lastSuggestedIntake) {
    const diff = suggestion - lastSuggestedIntake;
    const MAX_STEP = PACE_COACH_MAX_ADJUSTMENT_STEP;
    if (Math.abs(diff) > MAX_STEP)
      suggestion = lastSuggestedIntake + (diff > 0 ? MAX_STEP : -MAX_STEP);
  }
  return suggestion;
}

export function calculateAverageIntakeFromLogs(
  macroLogs: Array<{ date: string; calories: number }>,
  daysToAverage: number = 14,
): { averageCalories: number; hasSufficientData: boolean; daysLogged: number } {
  if (macroLogs.length === 0)
    return { averageCalories: 0, hasSufficientData: false, daysLogged: 0 };
  const sortedLogs = [...macroLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const cutoffDate = new Date(sortedLogs[0].date);
  cutoffDate.setDate(cutoffDate.getDate() - daysToAverage);
  const recentLogs = sortedLogs.filter(
    (log) => new Date(log.date) >= cutoffDate,
  );
  if (recentLogs.length === 0)
    return { averageCalories: 0, hasSufficientData: false, daysLogged: 0 };
  const averageCalories = Math.round(
    recentLogs.reduce((sum, log) => sum + log.calories, 0) / recentLogs.length,
  );
  return {
    averageCalories,
    hasSufficientData: recentLogs.length >= 10,
    daysLogged: recentLogs.length,
  };
}
