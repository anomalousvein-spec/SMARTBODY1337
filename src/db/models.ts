export interface WeightEntry {
  id?: number;
  user_id: string;
  date: string; // ISO string
  weight: number;
  unit: 'lbs' | 'kg';
  notes?: string;
}

export interface WaistEntry {
  id?: number;
  user_id: string;
  date: string; // ISO string
  measurement: number;
  unit: 'in' | 'cm';
  notes?: string;
}

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';

export interface TDEESettings {
  id: string; // 'global'
  user_id: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  heightUnit: 'in' | 'cm';
  activityLevel: ActivityLevel;
  targetWeight?: number;
  targetLossRate?: number; // lbs/week
  currentWeight?: number; // For macro recommendations
  tdee?: number; // Maintenance calories
  cuttingCalories?: number; // Deficit calories
  lastUpdated: string;
  // Pace Coach settings
  paceCoachEnabled?: boolean;
  paceCoachReminderDays?: number;
  lastSuggestedIntake?: number;
}

export interface MacroEntry {
  id?: number;
  user_id: string;
  date: string; // ISO string
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  notes?: string;
}

export interface PaceCoachCheckIn {
  id?: number;
  user_id: string;
  date: string; // ISO string
  averageIntake: number;
  targetLossRate: number;
  suggestedIntake: number;
  calculatedTDEE: number;
  weightSlopeLbsPerDay?: number;
}

export interface WeeklyMetrics {
  id?: number;
  user_id: string;
  iso_week: string; // ISO week format: "YYYY-Www" (e.g., "2024-W01")
  logged_days: number; // Number of days with calorie logs
  compliant_days: number; // Days within ±100 kcal of target
  compliance_score: number; // compliant_days / logged_days (0-1)
  avg_calories_logged: number;
  target_calories: number;
  weight_logs_count: number;
  adjustment_eligible: boolean;
  hold_reason?: 'NON_COMPLIANT_HOLD' | 'INSUFFICIENT_DATA_HOLD' | null;
  created_at: string; // ISO string
}
