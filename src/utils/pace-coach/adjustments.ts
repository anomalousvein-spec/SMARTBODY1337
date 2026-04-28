import { db } from '../../db/database';
import { getISOWeek } from './dates';
import { calculateSuggestedIntake } from './math';
import { calculateTrendRateWithTier } from './trends';
import { evaluateSmartTriggers, SmartTrigger } from './triggers';
import { BMR_FLOOR_MALE, BMR_FLOOR_FEMALE, calculatePercentageLoss } from '../percentageLoss';
import { PACE_COACH_ADJUSTMENT_STEP, PACE_COACH_MAX_ADJUSTMENT_STEP, PACE_COACH_RATE_TOLERANCE_LBS } from '../../config/constants';

export interface CheckInResult { newTarget: number; adjustmentAmount: number; trendRate: number; triggers: SmartTrigger[]; }

export function determineAdjustment(params: { trendRateLbsPerWeek: number; goalRateLbsPerWeek: number; currentTarget: number; adjustmentStep?: number; }): { adjustmentKcal: number; reason: 'TOO_SLOW' | 'ON_TRACK' | 'TOO_FAST' } {
  const { trendRateLbsPerWeek, goalRateLbsPerWeek, adjustmentStep = PACE_COACH_ADJUSTMENT_STEP } = params;
  const tol = PACE_COACH_RATE_TOLERANCE_LBS;
  if (goalRateLbsPerWeek < 0) {
    if (trendRateLbsPerWeek > goalRateLbsPerWeek + tol) return { adjustmentKcal: -adjustmentStep, reason: 'TOO_SLOW' };
    if (trendRateLbsPerWeek < goalRateLbsPerWeek - tol) return { adjustmentKcal: adjustmentStep, reason: 'TOO_FAST' };
  } else if (goalRateLbsPerWeek > 0) {
    if (trendRateLbsPerWeek < goalRateLbsPerWeek - tol) return { adjustmentKcal: -adjustmentStep, reason: 'TOO_SLOW' };
    if (trendRateLbsPerWeek > goalRateLbsPerWeek + tol) return { adjustmentKcal: adjustmentStep, reason: 'TOO_FAST' };
  } else if (Math.abs(trendRateLbsPerWeek) > tol) {
    return { adjustmentKcal: trendRateLbsPerWeek < 0 ? adjustmentStep : -adjustmentStep, reason: trendRateLbsPerWeek < 0 ? 'TOO_FAST' : 'TOO_SLOW' };
  }
  return { adjustmentKcal: 0, reason: 'ON_TRACK' };
}

export async function calculateEnhancedCheckInSuggestion(params: { userId: string; currentIsoWeek: string; averageIntake: number; goalRateLbsPerWeek: number; currentTarget: number; currentTDEE: number; bmr?: number; gender?: 'male' | 'female'; currentWeight?: number; }): Promise<{ suggestedIntake: number; adjustmentKcal: number; trendRateLbsPerWeek: number; tier: 1 | 2; adjustmentReason: string; canAdjust: boolean; holdReason?: string; }> {
  const { userId, currentIsoWeek, goalRateLbsPerWeek, currentTarget, currentTDEE, bmr, gender, currentWeight } = params;
  const trend = await calculateTrendRateWithTier(userId, currentIsoWeek);
  if (!trend.canCalculate) return { suggestedIntake: calculateSuggestedIntake({ currentTDEE, goalLbsPerWeek: Math.abs(goalRateLbsPerWeek), lastSuggestedIntake: currentTarget, bmr, gender, currentWeight }), adjustmentKcal: 0, trendRateLbsPerWeek: 0, tier: trend.tier, adjustmentReason: trend.reason || 'INSUFFICIENT_DATA', canAdjust: false, holdReason: trend.reason };
  const metrics = await db.weekly_metrics.where('[user_id+iso_week]').equals([userId, currentIsoWeek]).first();
  if (metrics && !metrics.adjustment_eligible) return { suggestedIntake: calculateSuggestedIntake({ currentTDEE, goalLbsPerWeek: Math.abs(goalRateLbsPerWeek), lastSuggestedIntake: currentTarget, bmr, gender, currentWeight }), adjustmentKcal: 0, trendRateLbsPerWeek: trend.trendRateLbsPerWeek, tier: trend.tier, adjustmentReason: 'COMPLIANCE_HOLD', canAdjust: false, holdReason: metrics.hold_reason || undefined };
  const adj = determineAdjustment({ trendRateLbsPerWeek: trend.trendRateLbsPerWeek, goalRateLbsPerWeek, currentTarget });
  let newTarget = currentTarget + adj.adjustmentKcal;
  const bmrFloor = Math.max(bmr || 0, gender === 'male' ? BMR_FLOOR_MALE : BMR_FLOOR_FEMALE);
  newTarget = Math.max(newTarget, bmrFloor);
  if (currentWeight && currentWeight > 0) newTarget = Math.max(newTarget, Math.round(calculatePercentageLoss(currentWeight, 'lbs', 1.0, currentTDEE, bmrFloor, gender || 'female').proposedIntake));
  const diff = newTarget - currentTarget;
  if (Math.abs(diff) > PACE_COACH_MAX_ADJUSTMENT_STEP) newTarget = currentTarget + (diff > 0 ? PACE_COACH_MAX_ADJUSTMENT_STEP : -PACE_COACH_MAX_ADJUSTMENT_STEP);
  return { suggestedIntake: newTarget, adjustmentKcal: adj.adjustmentKcal, trendRateLbsPerWeek: trend.trendRateLbsPerWeek, tier: trend.tier, adjustmentReason: adj.reason, canAdjust: true };
}

export async function processEnhancedCheckIn(userId: string, data: { weight: number; notes?: string }): Promise<CheckInResult> {
  if (!data.weight || data.weight <= 0) throw new Error('Invalid weight value provided');
  const profile = await db.user_profiles.where('user_id').equals(userId).first();
  const settings = await db.tdee_settings.where('user_id').equals(userId).first();
  if (!settings) throw new Error('User TDEE settings not found');
  const currentTarget = profile?.current_target_calories || settings.cuttingCalories || 2000;
  const goalRate = profile?.goal_rate_lbs_per_week || settings.targetLossRate || -1;
  const gender = settings.gender || 'female';
  await db.weights.add({ user_id: userId, date: new Date().toISOString(), weight: data.weight, unit: 'lbs', notes: data.notes });
  const isoWeek = getISOWeek(new Date());
  const trend = await calculateTrendRateWithTier(userId, isoWeek);
  let adjKcal = 0, newTarget = currentTarget;
  if (trend.canCalculate) {
    const adj = determineAdjustment({ trendRateLbsPerWeek: trend.trendRateLbsPerWeek, goalRateLbsPerWeek: goalRate, currentTarget });
    adjKcal = adj.adjustmentKcal; newTarget = currentTarget + adjKcal;
    const bmrFloor = gender === 'male' ? BMR_FLOOR_MALE : BMR_FLOOR_FEMALE;
    newTarget = Math.max(newTarget, bmrFloor);
    newTarget = Math.max(newTarget, Math.round(calculatePercentageLoss(data.weight, 'lbs', 1.0, settings.tdee || 2000, bmrFloor, gender).proposedIntake));
    const diff = newTarget - currentTarget;
    if (Math.abs(diff) > PACE_COACH_MAX_ADJUSTMENT_STEP) { newTarget = currentTarget + (diff > 0 ? PACE_COACH_MAX_ADJUSTMENT_STEP : -PACE_COACH_MAX_ADJUSTMENT_STEP); adjKcal = newTarget - currentTarget; }
  } else {
    newTarget = calculateSuggestedIntake({ currentTDEE: settings.tdee || 2000, goalLbsPerWeek: Math.abs(goalRate), lastSuggestedIntake: currentTarget, gender: settings.gender, currentWeight: data.weight });
    adjKcal = newTarget - currentTarget;
  }
  const now = new Date().toISOString();
  if (profile) {
    const metrics = await db.weekly_metrics.where('[user_id+iso_week]').equals([userId, isoWeek]).first();
    const newStreak = metrics?.adjustment_eligible ? profile.consecutive_compliant_weeks + 1 : (metrics && !metrics.adjustment_eligible ? 0 : profile.consecutive_compliant_weeks);
    await db.user_profiles.update(userId, { current_target_calories: newTarget, last_check_in_date: now, consecutive_compliant_weeks: newStreak, updated_at: now });
  } else await db.user_profiles.add({ user_id: userId, consecutive_compliant_weeks: 0, last_check_in_date: now, current_target_calories: newTarget, goal_rate_lbs_per_week: goalRate, created_at: now, updated_at: now });
  return { newTarget, adjustmentAmount: adjKcal, trendRate: trend.trendRateLbsPerWeek, triggers: await evaluateSmartTriggers(userId) };
}
