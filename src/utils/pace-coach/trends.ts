import { db } from '../../db/database';
import { getISOWeekDates, getISOWeek } from './dates';

export async function calculateTrendRateWithTier(userId: string, currentWeekIsoWeek: string): Promise<{ trendRateLbsPerWeek: number; tier: 1 | 2; canCalculate: boolean; reason?: string }> {
  const currentWeekDates = getISOWeekDates(currentWeekIsoWeek);
  const priorWeekDate = new Date(currentWeekDates.start); priorWeekDate.setDate(priorWeekDate.getDate() - 7);
  const priorIsoWeek = getISOWeek(priorWeekDate);
  const priorWeekDates = getISOWeekDates(priorIsoWeek);
  const currentWeights = await db.weights.where('[user_id+date]').between([userId, currentWeekDates.start.toISOString()], [userId, currentWeekDates.end.toISOString()], true, true).toArray();
  const priorWeights = await db.weights.where('[user_id+date]').between([userId, priorWeekDates.start.toISOString()], [userId, priorWeekDates.end.toISOString()], true, true).toArray();
  currentWeights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  priorWeights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const compliantWeeks = await db.weekly_metrics.where('[user_id+iso_week]').below([userId, currentWeekIsoWeek]).filter(m => m.adjustment_eligible).toArray();
  const useTier2 = compliantWeeks.length >= 2;
  if (!useTier2) {
    if (currentWeights.length === 0 || priorWeights.length === 0) return { trendRateLbsPerWeek: 0, tier: 1, canCalculate: false, reason: 'INSUFFICIENT_WEIGHT_DATA' };
    return { trendRateLbsPerWeek: currentWeights[currentWeights.length - 1].weight - priorWeights[priorWeights.length - 1].weight, tier: 1, canCalculate: true };
  }
  if (currentWeights.length < 2 || priorWeights.length < 2) return { trendRateLbsPerWeek: 0, tier: 2, canCalculate: false, reason: 'INSUFFICIENT_WEIGH_INS_FOR_TIER2' };
  const currentAvg = currentWeights.reduce((s, w) => s + w.weight, 0) / currentWeights.length;
  const priorAvg = priorWeights.reduce((s, w) => s + w.weight, 0) / priorWeights.length;
  return { trendRateLbsPerWeek: currentAvg - priorAvg, tier: 2, canCalculate: true };
}
