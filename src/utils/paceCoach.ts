/**
 * Pace Coach calculation logic
 */

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
