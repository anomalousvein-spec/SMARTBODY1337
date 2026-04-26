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
}
