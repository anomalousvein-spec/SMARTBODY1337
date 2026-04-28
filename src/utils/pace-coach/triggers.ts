import { db } from '../../db/database';
import { PACE_COACH_DATA_GAP_DAYS, PACE_COACH_LOW_COMPLIANCE_THRESHOLD, PACE_COACH_COMPLIANCE_THRESHOLD } from '../../config/constants';

export interface SmartTrigger { type: 'COMPLIANCE_LOW' | 'COMPLIANCE_SLIPPING' | 'MILESTONE' | 'DATA_GAP'; priority: 'HIGH' | 'MEDIUM' | 'LOW'; message: string; meta: Record<string, unknown>; }
export interface NotificationPayload { title: string; body: string; actionType: string; }

export async function evaluateSmartTriggers(userId: string): Promise<SmartTrigger[]> {
  const triggers: SmartTrigger[] = [];
  const weeklyMetrics = await db.weekly_metrics.where('user_id').equals(userId).reverse().limit(3).toArray();
  weeklyMetrics.sort((a, b) => a.iso_week > b.iso_week ? -1 : 1);
  if (weeklyMetrics.length >= 2) {
    const [recent, previous] = weeklyMetrics;
    if (recent.compliance_score < PACE_COACH_LOW_COMPLIANCE_THRESHOLD && previous.compliance_score < PACE_COACH_LOW_COMPLIANCE_THRESHOLD)
      triggers.push({ type: 'COMPLIANCE_LOW', priority: 'HIGH', message: `Your compliance has been below ${Math.round(PACE_COACH_LOW_COMPLIANCE_THRESHOLD * 100)}% for 2 consecutive weeks. Let's get back on track!`, meta: { recentScore: recent.compliance_score, previousScore: previous.compliance_score, weeks: [recent.iso_week, previous.iso_week] } });
  }
  if (weeklyMetrics.length >= 1 && weeklyMetrics[0].compliance_score >= PACE_COACH_LOW_COMPLIANCE_THRESHOLD && weeklyMetrics[0].compliance_score < PACE_COACH_COMPLIANCE_THRESHOLD)
    triggers.push({ type: 'COMPLIANCE_SLIPPING', priority: 'MEDIUM', message: `You're at ${Math.round(weeklyMetrics[0].compliance_score * 100)}% compliance this week. Aim for ${Math.round(PACE_COACH_COMPLIANCE_THRESHOLD * 100)}%+ to unlock adjustments!`, meta: { score: weeklyMetrics[0].compliance_score, week: weeklyMetrics[0].iso_week } });
  const profile = await db.user_profiles.where('user_id').equals(userId).first();
  if (profile && profile.consecutive_compliant_weeks > 0 && profile.consecutive_compliant_weeks % 4 === 0)
    triggers.push({ type: 'MILESTONE', priority: 'LOW', message: `🎉 Congratulations! You've hit ${profile.consecutive_compliant_weeks} compliant weeks in a row!`, meta: { streak: profile.consecutive_compliant_weeks, milestone: profile.consecutive_compliant_weeks / 4 } });
  const gapDaysAgo = new Date(); gapDaysAgo.setDate(gapDaysAgo.getDate() - PACE_COACH_DATA_GAP_DAYS);
  const recentWeights = await db.weights.where('[user_id+date]').between([userId, gapDaysAgo.toISOString()], [userId, new Date().toISOString()], true, true).toArray();
  if (recentWeights.length === 0)
    triggers.push({ type: 'DATA_GAP', priority: 'MEDIUM', message: `We haven't seen a weigh-in from you in over ${PACE_COACH_DATA_GAP_DAYS} days. Log your weight to keep your data fresh!`, meta: { daysSinceLastLog: PACE_COACH_DATA_GAP_DAYS, lastLogDate: null } });
  return triggers;
}

export function shouldSendNotificationForTrigger(trigger: SmartTrigger, lastSentDate: Date | null): boolean {
  if (!lastSentDate) return true;
  const diffDays = (new Date().getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24);
  if (trigger.priority === 'HIGH') return diffDays >= 3;
  if (trigger.priority === 'MEDIUM') return diffDays >= 5;
  if (trigger.type === 'MILESTONE') return true;
  return diffDays >= 7;
}

export function formatTriggerAsNotification(trigger: SmartTrigger): NotificationPayload {
  const mapping = { COMPLIANCE_LOW: ['⚠️ Compliance Alert', 'VIEW_COMPLIANCE'], COMPLIANCE_SLIPPING: ['📊 Keep Pushing', 'VIEW_PROGRESS'], MILESTONE: ['🎉 Achievement Unlocked!', 'CELEBRATE'], DATA_GAP: ['⏰ Time to Weigh In', 'LOG_WEIGHT'] };
  const [title, actionType] = mapping[trigger.type] || ['Pace Coach Update', 'VIEW_DASHBOARD'];
  return { title, body: trigger.message, actionType };
}
