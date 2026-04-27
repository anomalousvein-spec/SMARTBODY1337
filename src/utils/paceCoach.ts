/**
 * Pace Coach calculation logic
 */

import { WeeklyMetrics } from '../db/models';

/**
 * Calculates the slope of weight change using linear regression.
 * Returns the average weight change per day.
 * IMPORTANT: Weights must be normalized to lbs before calling this function.
 *
 * @param weights Array of smoothed weight values (must be in lbs)
 * @returns lbs/day slope (negative = weight loss, positive = weight gain)
 */
export function calculateTrendSlope(weights: number[]): number {
  if (weights.length < 2) return 0;

  const n = weights.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = weights[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

/**
 * Calculates TDEE based on energy balance equation:
 * TDEE = average_intake + deficit
 * Deficit = daily_loss_rate * 3500
 * 
 * Note: When slope is negative (weight loss), subtracting a negative adds the deficit,
 * correctly yielding TDEE > intake. When slope is positive (weight gain), the deficit
 * is subtracted, correctly yielding TDEE < intake.
 *
 * @param averageIntake User reported average daily calorie intake
 * @param dailyWeightChange Average weight change per day in lbs/day (negative for loss, positive for gain)
 * @returns Back-calculated TDEE
 */
export function calculateBackCalculatedTDEE(averageIntake: number, dailyWeightChange: number): number {
  // 3500 calories per lb of body weight
  // If losing weight (negative slope): TDEE = intake + |deficit|
  // If gaining weight (positive slope): TDEE = intake - surplus
  const dailyEnergyBalance = dailyWeightChange * 3500;
  return averageIntake - dailyEnergyBalance;
}

/**
 * Suggests a calorie intake target based on back-calculated TDEE and goal loss rate.
 * Includes safety guardrails.
 */
export function calculateSuggestedIntake(params: {
  currentTDEE: number;
  goalLbsPerWeek: number;
  lastSuggestedIntake?: number;
  bmr?: number;
  gender?: 'male' | 'female';
  currentWeight?: number;
}): number {
  const { currentTDEE, goalLbsPerWeek, lastSuggestedIntake, bmr, gender, currentWeight } = params;

  const goalDailyLoss = goalLbsPerWeek / 7;
  const targetDeficit = goalDailyLoss * 3500;
  let suggestion = Math.round(currentTDEE - targetDeficit);

  // Safety Guardrails

  // 1. Floor: Minimum safe intake
  let floor = 1200;
  if (gender === 'male') floor = 1500;
  if (bmr) floor = Math.max(floor, bmr * 0.8);

  suggestion = Math.max(suggestion, floor);

  // 2. Max rate ceiling
  if (currentWeight && (goalLbsPerWeek / currentWeight) > 0.01) {
    const maxSafeLossPerWeek = currentWeight * 0.01;
    const maxSafeDeficit = (maxSafeLossPerWeek / 7) * 3500;
    suggestion = Math.max(suggestion, Math.round(currentTDEE - maxSafeDeficit));
  }

  // 3. Adjustment throttle
  if (lastSuggestedIntake) {
    const diff = suggestion - lastSuggestedIntake;
    const MAX_STEP = 150;
    if (Math.abs(diff) > MAX_STEP) {
      suggestion = lastSuggestedIntake + (diff > 0 ? MAX_STEP : -MAX_STEP);
    }
  }

  return suggestion;
}

/**
 * Checks if a new check-in is due based on the last check-in date and reminder frequency.
 */
export function isCheckInDue(lastCheckInDate?: string, reminderDays: number = 10): boolean {
  if (!lastCheckInDate) return true;

  const lastDate = new Date(lastCheckInDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= reminderDays;
}

/**
 * Calculates the next check-in date based on last check-in and frequency.
 */
export function getNextCheckInDate(lastCheckInDate?: string, reminderDays: number = 14): Date {
  const lastDate = lastCheckInDate ? new Date(lastCheckInDate) : new Date();
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + reminderDays);
  return nextDate;
}

/**
 * Gets the number of days until the next check-in is due.
 * Returns 0 if already due or overdue.
 */
export function getDaysUntilCheckIn(lastCheckInDate?: string, reminderDays: number = 14): number {
  if (!lastCheckInDate) return 0;

  const lastDate = new Date(lastCheckInDate);
  const now = new Date();
  const diffTime = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const daysRemaining = reminderDays - diffDays;
  return Math.max(0, daysRemaining);
}

/**
 * Formats a date for display (e.g., "Jan 15, 2024").
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Gets the ISO week number for a given date.
 * Returns format: "YYYY-Www" (e.g., "2024-W01")
 */
export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Gets the start and end dates of an ISO week.
 * @param isoWeek ISO week format: "YYYY-Www"
 * @returns Object with start and end dates of the week
 */
export function getISOWeekDates(isoWeek: string): { start: Date; end: Date } {
  const [year, week] = isoWeek.split('-W').map(Number);
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setUTCDate(ISOweekStart.getUTCDate() + 6);
  return { start: ISOweekStart, end: ISOweekEnd };
}

/**
 * Calculates average daily calorie intake from macro logs over a specified period.
 * @param macroLogs Array of macro log entries
 * @param daysToAverage Number of days to average over (default: 14)
 * @returns Object with average calories and whether there's sufficient data
 */
export function calculateAverageIntakeFromLogs(
  macroLogs: Array<{ date: string; calories: number }>,
  daysToAverage: number = 14
): { averageCalories: number; hasSufficientData: boolean; daysLogged: number } {
  if (macroLogs.length === 0) {
    return { averageCalories: 0, hasSufficientData: false, daysLogged: 0 };
  }

  // Sort logs by date (most recent first)
  const sortedLogs = [...macroLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get the most recent date
  const mostRecentDate = new Date(sortedLogs[0].date);
  
  // Filter logs within the time window
  const cutoffDate = new Date(mostRecentDate);
  cutoffDate.setDate(cutoffDate.getDate() - daysToAverage);

  const recentLogs = sortedLogs.filter(log => new Date(log.date) >= cutoffDate);
  
  if (recentLogs.length === 0) {
    return { averageCalories: 0, hasSufficientData: false, daysLogged: 0 };
  }

  // Calculate average
  const totalCalories = recentLogs.reduce((sum, log) => sum + log.calories, 0);
  const averageCalories = Math.round(totalCalories / recentLogs.length);

  // Consider sufficient data if we have at least 10 days of logs in the window
  const hasSufficientData = recentLogs.length >= 10;

  return {
    averageCalories,
    hasSufficientData,
    daysLogged: recentLogs.length
  };
}

/**
 * Calculates weekly compliance metrics for a given ISO week.
 * Implements Module 4 compliance scoring from the original spec.
 * 
 * @param userId User ID
 * @param isoWeek ISO week format: "YYYY-Www"
 * @param targetCalories Daily calorie target for the week
 * @returns WeeklyMetrics object ready for storage
 */
export async function calculateWeeklyCompliance(
  userId: string,
  isoWeek: string,
  targetCalories: number
): Promise<WeeklyMetrics> {
  const { db } = await import('../db/database');
  const { getISOWeekDates } = await import('./paceCoach');
  
  const { start, end } = getISOWeekDates(isoWeek);
  
  // Get macro logs for the week
  const macroLogs = await db.macro_logs
    .where('[user_id+date]')
    .between([userId, start.toISOString()], [userId, end.toISOString()], true, true)
    .toArray();
  
  // Get weight logs for the week
  const weightLogs = await db.weights
    .where('[user_id+date]')
    .between([userId, start.toISOString()], [userId, end.toISOString()], true, true)
    .toArray();
  
  // Calculate compliance
  let compliantDays = 0;
  let totalCalories = 0;
  const loggedDaysSet = new Set<string>();
  
  macroLogs.forEach(log => {
    const logDate = new Date(log.date).toDateString();
    loggedDaysSet.add(logDate);
    totalCalories += log.calories;
    
    // Check if within ±100 kcal of target
    if (Math.abs(log.calories - targetCalories) <= 100) {
      compliantDays++;
    }
  });
  
  const loggedDays = loggedDaysSet.size;
  const complianceScore = loggedDays > 0 ? compliantDays / loggedDays : 0;
  const avgCaloriesLogged = loggedDays > 0 ? Math.round(totalCalories / loggedDays) : 0;
  
  // Determine eligibility per Module 4 spec
  // Compliant if: score >= 0.8 AND logged_days >= 4
  const isCompliant = complianceScore >= 0.8 && loggedDays >= 4;
  const hasMinWeighIns = weightLogs.length >= 2; // Minimum for Tier 2
  
  let adjustmentEligible = false;
  let holdReason: 'NON_COMPLIANT_HOLD' | 'INSUFFICIENT_DATA_HOLD' | null = null;
  
  if (!isCompliant) {
    holdReason = 'NON_COMPLIANT_HOLD';
  } else if (!hasMinWeighIns) {
    holdReason = 'INSUFFICIENT_DATA_HOLD';
  } else {
    adjustmentEligible = true;
  }
  
  return {
    user_id: userId,
    iso_week: isoWeek,
    logged_days: loggedDays,
    compliant_days: compliantDays,
    compliance_score: Math.round(complianceScore * 100) / 100,
    avg_calories_logged: avgCaloriesLogged,
    target_calories: targetCalories,
    weight_logs_count: weightLogs.length,
    adjustment_eligible: adjustmentEligible,
    hold_reason: holdReason,
    created_at: new Date().toISOString()
  };
}

/**
 * Processes all active users and generates weekly metrics for the prior ISO week.
 * Should be called weekly (e.g., Monday at 00:05 UTC).
 * 
 * @param userIds Array of user IDs to process
 * @param targetCaloriesMap Map of user_id -> target calories
 * @returns Array of generated WeeklyMetrics
 */
export async function processWeeklyMetricsForUsers(
  userIds: string[],
  targetCaloriesMap: Map<string, number>
): Promise<WeeklyMetrics[]> {
  const { db } = await import('../db/database');
  const { getISOWeek } = await import('./paceCoach');
  
  // Get prior week's ISO week identifier
  const today = new Date();
  const priorWeekDate = new Date(today);
  priorWeekDate.setDate(today.getDate() - 7);
  const priorIsoWeek = getISOWeek(priorWeekDate);
  
  const results: WeeklyMetrics[] = [];
  
  for (const userId of userIds) {
    const targetCalories = targetCaloriesMap.get(userId);
    if (!targetCalories) continue;
    
    // Check if already processed
    const existing = await db.weekly_metrics
      .where('[user_id+iso_week]')
      .equals([userId, priorIsoWeek])
      .first();
    
    if (existing) continue; // Skip if already processed
    
    try {
      const metrics = await calculateWeeklyCompliance(userId, priorIsoWeek, targetCalories);
      await db.weekly_metrics.add(metrics);
      results.push(metrics);
    } catch (error) {
      console.error(`Error processing weekly metrics for user ${userId}:`, error);
    }
  }
  
  return results;
}
