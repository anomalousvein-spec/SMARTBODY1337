import Dexie, { Table } from 'dexie';
import { WeightEntry, WaistEntry, TDEESettings, MacroEntry, PaceCoachCheckIn } from './models';

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

  constructor() {
    super('SmartBodyDatabase');

    // Version 3: Added composite indices [user_id+date] for efficient range queries
    this.version(3).stores({
      weights: '++id, date, user_id, [user_id+date]',
      waist_measurements: '++id, date, user_id, [user_id+date]',
      tdee_settings: 'id, user_id',
      macro_logs: '++id, date, user_id, [user_id+date]',
      pace_coach_checkins: '++id, date, user_id, [user_id+date]'
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
