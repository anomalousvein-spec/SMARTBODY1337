import Dexie, { Table } from 'dexie';
import { WeightEntry, WaistEntry, TDEESettings, MacroEntry, PaceCoachCheckIn, WeeklyMetrics, UserProfile } from './models';

/**
 * SmartBody IndexedDB implementation using Dexie.js
 * Optimized schema with composite indices for faster user-specific data retrieval
 */
export class SmartBodyDatabase extends Dexie {
  weights!: Table<WeightEntry>;
  waist_measurements!: Table<WaistEntry>;
  tdee_settings!: Table<TDEESettings>;
  macro_logs!: Table<MacroEntry>;
  pace_coach_checkins!: Table<PaceCoachCheckIn>;
  weekly_metrics!: Table<WeeklyMetrics>;
  user_profiles!: Table<UserProfile>;

  constructor() {
    super('SmartBodyDatabase');

    // Version 5: Added user_profiles table for tracking compliance streaks and check-in state
    this.version(5).stores({
      weights: '++id, date, user_id, [user_id+date]',
      waist_measurements: '++id, date, user_id, [user_id+date]',
      tdee_settings: 'id, user_id',
      macro_logs: '++id, date, user_id, [user_id+date]',
      pace_coach_checkins: '++id, date, user_id, [user_id+date]',
      weekly_metrics: '++id, [user_id+iso_week], iso_week',
      user_profiles: 'user_id'
    });

    // Keeping version 2 for compatibility during upgrade if needed
    this.version(2).stores({
      weights: '++id, date, user_id',
      waist_measurements: '++id, date, user_id',
      tdee_settings: 'id, user_id',
      macro_logs: '++id, date, user_id',
      pace_coach_checkins: '++id, date, user_id'
    });
  }
}

export const db = new SmartBodyDatabase();
