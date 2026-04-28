import { db } from '../../db/database';
import { WeeklyMetrics } from '../../db/models';
import { getISOWeekDates, getISOWeek } from './dates';
import { PACE_COACH_COMPLIANCE_THRESHOLD, PACE_COACH_MIN_LOGGED_DAYS } from '../../config/constants';

export async function calculateWeeklyCompliance(userId: string, isoWeek: string, targetCalories: number): Promise<WeeklyMetrics> {
  const { start, end } = getISOWeekDates(isoWeek);
  const macroLogs = await db.macro_logs.where('[user_id+date]').between([userId, start.toISOString()], [userId, end.toISOString()], true, true).toArray();
  const weightLogs = await db.weights.where('[user_id+date]').between([userId, start.toISOString()], [userId, end.toISOString()], true, true).toArray();
  const loggedDaysSet = new Set(macroLogs.map(log => new Date(log.date).toDateString()));
  const totalCalories = macroLogs.reduce((sum, log) => sum + log.calories, 0);
  const compliantDays = macroLogs.filter(log => Math.abs(log.calories - targetCalories) <= 100).length;
  const loggedDays = loggedDaysSet.size;
  const complianceScore = loggedDays > 0 ? compliantDays / loggedDays : 0;
  const isCompliant = complianceScore >= PACE_COACH_COMPLIANCE_THRESHOLD && loggedDays >= PACE_COACH_MIN_LOGGED_DAYS;
  const adjustmentEligible = isCompliant && weightLogs.length >= 2;
  return {
    user_id: userId, iso_week: isoWeek, logged_days: loggedDays, compliant_days: compliantDays,
    compliance_score: Math.round(complianceScore * 100) / 100,
    avg_calories_logged: loggedDays > 0 ? Math.round(totalCalories / loggedDays) : 0,
    target_calories: targetCalories, weight_logs_count: weightLogs.length,
    adjustment_eligible: adjustmentEligible,
    hold_reason: !isCompliant ? 'NON_COMPLIANT_HOLD' : (!adjustmentEligible ? 'INSUFFICIENT_DATA_HOLD' : null),
    created_at: new Date().toISOString()
  };
}

export async function processWeeklyMetricsForUsers(userIds: string[], targetCaloriesMap: Map<string, number>): Promise<WeeklyMetrics[]> {
  const priorWeekDate = new Date(); priorWeekDate.setDate(priorWeekDate.getDate() - 7);
  const priorIsoWeek = getISOWeek(priorWeekDate);
  const results: WeeklyMetrics[] = [];
  for (const userId of userIds) {
    const targetCalories = targetCaloriesMap.get(userId);
    if (!targetCalories) continue;
    if (await db.weekly_metrics.where('[user_id+iso_week]').equals([userId, priorIsoWeek]).first()) continue;
    try {
      const metrics = await calculateWeeklyCompliance(userId, priorIsoWeek, targetCalories);
      await db.weekly_metrics.add(metrics);
      results.push(metrics);
    } catch (e) { console.error(e); }
  }
  return results;
}
