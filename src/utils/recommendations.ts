import { WeightEntry, MacroEntry, TDEESettings } from '../db/models';
import { 
  PLATEAU_THRESHOLD_LBS, 
  RAPID_LOSS_THRESHOLD_LBS_PER_WEEK, 
  STALL_DETECTION_DAYS,
  STALL_THRESHOLD_LBS,
  MIN_WEIGHT_ENTRIES_FOR_ANALYSIS,
  RECENT_MACROS_DAYS,
  CALORIE_ADJUSTMENT_FACTOR,
  WEIGHT_DEVIATION_THRESHOLD,
  CALORIE_OVER_DEVIATION_PERCENT,
  CALORIE_UNDER_DEVIATION_PERCENT,
  MIN_PROTEIN_PER_LB,
  MAX_PROTEIN_PER_LB,
} from '../config/constants';

export interface Recommendation {
  id: string;
  type: 'calorie_adjustment' | 'macro_adjustment' | 'plateau_alert' | 'rapid_loss_warning' | 'stall_detected' | 'progress_update';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  action?: string;
  timestamp: string;
}

/**
 * Analyzes weight trend and compares to target loss rate
 * @param weights - Array of weight entries
 * @param targetLossRate - Target weight loss rate in lbs/week
 * @param _currentCalories - Current calorie intake (unused but kept for API compatibility)
 * @returns Array of recommendations based on weight trend analysis
 */
export function analyzeWeightTrend(
  weights: WeightEntry[],
  targetLossRate: number,
  _currentCalories: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  if (weights.length < MIN_WEIGHT_ENTRIES_FOR_ANALYSIS) {
    return recommendations; // Need at least a week of data
  }

  // Sort by date
  const sortedWeights = [...weights].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get last 7 days average vs previous 7 days
  const recentWeek = sortedWeights.slice(-RECENT_MACROS_DAYS);
  const previousWeek = sortedWeights.slice(-14, -7);
  
  if (previousWeek.length === 0) return recommendations;

  const recentAvg = recentWeek.reduce((sum, w) => sum + w.weight, 0) / recentWeek.length;
  const previousAvg = previousWeek.reduce((sum, w) => sum + w.weight, 0) / previousWeek.length;
  
  const actualLossPerWeek = previousAvg - recentAvg; // Positive = loss
  const expectedLossPerWeek = targetLossRate;

  // Detect plateau (no significant change)
  if (Math.abs(actualLossPerWeek) < PLATEAU_THRESHOLD_LBS && expectedLossPerWeek > 0.5) {
    recommendations.push({
      id: `plateau-${Date.now()}`,
      type: 'plateau_alert',
      title: 'Plateau Detected',
      message: `Your weight has remained stable (±${PLATEAU_THRESHOLD_LBS} lbs) over the past week. This is normal, but if it continues for 2+ weeks, consider adjusting your calories.`,
      severity: 'warning',
      action: 'Consider reducing daily calories by 100-200 or increasing activity level.',
      timestamp: new Date().toISOString(),
    });
  }

  // Detect rapid weight loss
  if (actualLossPerWeek > RAPID_LOSS_THRESHOLD_LBS_PER_WEEK) {
    recommendations.push({
      id: `rapid-loss-${Date.now()}`,
      type: 'rapid_loss_warning',
      title: 'Rapid Weight Loss Alert',
      message: `You're losing weight faster than recommended (${actualLossPerWeek.toFixed(1)} lbs/week). Rapid loss can lead to muscle loss and nutritional deficiencies.`,
      severity: 'critical',
      action: 'Increase your daily calorie intake by 200-300 calories to slow down weight loss to a safer rate.',
      timestamp: new Date().toISOString(),
    });
  }

  // Detect stall (no progress for extended period)
  const twoWeeksAgo = sortedWeights.find(w => 
    new Date(w.date) <= new Date(Date.now() - STALL_DETECTION_DAYS * 24 * 60 * 60 * 1000)
  );
  
  if (twoWeeksAgo && Math.abs(twoWeeksAgo.weight - recentAvg) < STALL_THRESHOLD_LBS) {
    recommendations.push({
      id: `stall-${Date.now()}`,
      type: 'stall_detected',
      title: 'Progress Stall Detected',
      message: `Your weight hasn't changed significantly in the past ${STALL_DETECTION_DAYS} weeks. This could indicate metabolic adaptation or water retention.`,
      severity: 'warning',
      action: 'Try a diet break (eat at maintenance for 1 week) or reassess your calorie tracking accuracy.',
      timestamp: new Date().toISOString(),
    });
  }

  // Compare actual vs target and suggest adjustments
  const deviation = actualLossPerWeek - expectedLossPerWeek;
  
  if (deviation < -WEIGHT_DEVIATION_THRESHOLD && actualLossPerWeek < 0) {
    // Losing slower than target
    const calorieAdjustment = Math.round(deviation * CALORIE_ADJUSTMENT_FACTOR); // ~500 cal per 1 lb/week
    recommendations.push({
      id: `adjustment-slow-${Date.now()}`,
      type: 'calorie_adjustment',
      title: 'Adjustment Suggestion',
      message: `You're losing weight slower than your target (${actualLossPerWeek.toFixed(1)} vs ${expectedLossPerWeek} lbs/week).`,
      severity: 'info',
      action: `Consider reducing daily calories by ${Math.abs(calorieAdjustment)} calories or increasing activity.`,
      timestamp: new Date().toISOString(),
    });
  } else if (deviation > WEIGHT_DEVIATION_THRESHOLD && actualLossPerWeek > 0 && actualLossPerWeek < RAPID_LOSS_THRESHOLD_LBS_PER_WEEK) {
    // Losing faster than target but still safe
    const calorieAdjustment = Math.round(deviation * CALORIE_ADJUSTMENT_FACTOR);
    recommendations.push({
      id: `adjustment-fast-${Date.now()}`,
      type: 'calorie_adjustment',
      title: 'On Track!',
      message: `Great progress! You're losing weight at ${actualLossPerWeek.toFixed(1)} lbs/week.`,
      severity: 'info',
      action: calorieAdjustment > 100 
        ? `If you want to slow down slightly, add ${calorieAdjustment} calories to your daily intake.`
        : 'Keep up the great work!',
      timestamp: new Date().toISOString(),
    });
  }

  return recommendations;
}

/**
 * Analyzes macro intake and provides recommendations
 */
export function analyzeMacroIntake(
  macros: MacroEntry[],
  tdeeSettings: TDEESettings | undefined
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (macros.length === 0 || !tdeeSettings) return recommendations;

  const recentMacros = macros.slice(-7); // Last 7 entries
  const avgCalories = recentMacros.reduce((sum, m) => sum + m.calories, 0) / recentMacros.length;
  const avgProtein = recentMacros.reduce((sum, m) => sum + m.protein, 0) / recentMacros.length;

  // Calculate target calories based on TDEE and loss rate
  const targetCalories = tdeeSettings.tdee || tdeeSettings.cuttingCalories;
  
  if (!targetCalories) return recommendations;

  // Calorie adherence check
  const calorieDeviation = ((avgCalories - targetCalories) / targetCalories) * 100;
  
  if (calorieDeviation > CALORIE_OVER_DEVIATION_PERCENT) {
    recommendations.push({
      id: `calorie-over-${Date.now()}`,
      type: 'calorie_adjustment',
      title: 'Calorie Intake High',
      message: `Your average calorie intake (${Math.round(avgCalories)}) is ${calorieDeviation.toFixed(0)}% above your target (${Math.round(targetCalories)}).`,
      severity: 'warning',
      action: 'Review your food logging accuracy and portion sizes. Consider meal prepping for better control.',
      timestamp: new Date().toISOString(),
    });
  } else if (calorieDeviation < -CALORIE_UNDER_DEVIATION_PERCENT) {
    recommendations.push({
      id: `calorie-under-${Date.now()}`,
      type: 'calorie_adjustment',
      title: 'Calorie Intake Very Low',
      message: `Your average calorie intake (${Math.round(avgCalories)}) is significantly below your target. This may not be sustainable.`,
      severity: 'warning',
      action: 'Ensure you\'re eating enough to support your metabolism and energy levels.',
      timestamp: new Date().toISOString(),
    });
  }

  // Protein intake check (recommend 0.7-1g per lb of bodyweight)
  const currentWeight = tdeeSettings.currentWeight || 180; // Fallback
  const minProteinTarget = currentWeight * MIN_PROTEIN_PER_LB;
  const maxProteinTarget = currentWeight * MAX_PROTEIN_PER_LB;

  if (avgProtein < minProteinTarget) {
    recommendations.push({
      id: `protein-low-${Date.now()}`,
      type: 'macro_adjustment',
      title: 'Increase Protein Intake',
      message: `Your average protein intake (${Math.round(avgProtein)}g) is below the recommended range (${Math.round(minProteinTarget)}-${Math.round(maxProteinTarget)}g for your weight).`,
      severity: 'info',
      action: 'Aim for ${MIN_PROTEIN_PER_LB}-${MAX_PROTEIN_PER_LB}g of protein per pound of bodyweight to preserve muscle mass during weight loss.',
      timestamp: new Date().toISOString(),
    });
  }

  return recommendations;
}

/**
 * Generates all recommendations based on user data
 */
export function generateRecommendations(
  weights: WeightEntry[],
  macros: MacroEntry[],
  tdeeSettings: TDEESettings | undefined
): Recommendation[] {
  const weightRecommendations = tdeeSettings?.targetLossRate 
    ? analyzeWeightTrend(weights, tdeeSettings.targetLossRate, 0)
    : [];
  
  const macroRecommendations = analyzeMacroIntake(macros, tdeeSettings);
  
  // Combine and sort by severity (critical first)
  const allRecommendations = [...weightRecommendations, ...macroRecommendations];
  
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  allRecommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  return allRecommendations;
}

/**
 * Gets health category based on metrics
 */
export function getHealthStatus(
  currentRatio: number,
  weightTrend: 'losing' | 'stable' | 'gaining'
): string {
  if (currentRatio < 0.53 && weightTrend === 'stable') {
    return 'Healthy - Maintain';
  } else if (currentRatio >= 0.53 && weightTrend === 'losing') {
    return 'Improving - On Track';
  } else if (currentRatio >= 0.58 && weightTrend === 'stable') {
    return 'Needs Attention';
  } else if (currentRatio >= 0.63) {
    return 'High Risk - Action Needed';
  }
  return 'Monitoring';
}
