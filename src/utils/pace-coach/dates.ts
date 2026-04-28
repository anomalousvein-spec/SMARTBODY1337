/**
 * Date utilities for Pace Coach
 */

export function isCheckInDue(lastCheckInDate?: string, reminderDays: number = 10): boolean {
  if (!lastCheckInDate) return true;
  const lastDate = new Date(lastCheckInDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= reminderDays;
}

export function getNextCheckInDate(lastCheckInDate?: string, reminderDays: number = 14): Date {
  const lastDate = lastCheckInDate ? new Date(lastCheckInDate) : new Date();
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + reminderDays);
  return nextDate;
}

export function getDaysUntilCheckIn(lastCheckInDate?: string, reminderDays: number = 14): number {
  if (!lastCheckInDate) return 0;
  const lastDate = new Date(lastCheckInDate);
  const now = new Date();
  const diffTime = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = reminderDays - diffDays;
  return Math.max(0, daysRemaining);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

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
