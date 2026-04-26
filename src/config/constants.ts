/**
 * Application configuration constants
 */

// Default user ID for single-user mode
export const DEFAULT_USER_ID = 'user-1';

// App metadata
export const APP_NAME = 'SMARTBODY1337';
export const APP_VERSION = '1.0.0';

// Database settings
export const DB_NAME = 'smartbody1337-db';
export const DB_VERSION = 3; // Must match database.ts schema version

// Weight tracking settings
export const DEFAULT_WEIGHT_UNIT: 'lbs' | 'kg' = 'lbs';
export const DEFAULT_HEIGHT_UNIT: 'in' | 'cm' = 'in';

// Macro tracking defaults
export const DEFAULT_PROTEIN_RATIO = 0.4;
export const DEFAULT_CARBS_RATIO = 0.35;
export const DEFAULT_FAT_RATIO = 0.25;

// Calorie constants
export const CALORIES_PER_LB_FAT = 3500;
export const DEFAULT_CALORIC_DEFICIT = 500;

// Recommendation thresholds
export const PLATEAU_THRESHOLD_LBS = 0.3;
export const RAPID_LOSS_THRESHOLD_LBS_PER_WEEK = 2.5;
export const STALL_DETECTION_DAYS = 14;
export const STALL_THRESHOLD_LBS = 0.5;

// Validation Ranges
export const MIN_WEIGHT_LBS = 50;
export const MAX_WEIGHT_LBS = 1000;
export const MIN_WAIST_IN = 20;
export const MAX_WAIST_IN = 100;
export const MIN_CALORIES = 500;
export const MAX_CALORIES = 5000;
export const MIN_MACRO_G = 0;
export const MAX_MACRO_G = 500;

// Analysis Constants
export const MIN_WEIGHT_ENTRIES_FOR_CHECKIN = 5;
export const MIN_CHECKINS_FOR_METABOLISM = 2;
export const TREND_CALCULATION_DAYS = 14;
export const DEFAULT_REMINDER_DAYS = 10;
export const MOVING_AVERAGE_DAYS = 7;
export const MONTHLY_AVERAGE_DAYS = 30;

// Waist-to-Height Ratio Health Categories
export const WAIST_RATIO_CATEGORIES = {
  UNDERWEIGHT: { threshold: 0.42, label: 'Underweight', description: 'Below healthy range' },
  HEALTHY_LOW: { threshold: 0.48, label: 'Healthy', description: 'Optimal health range' },
  HEALTHY_HIGH: { threshold: 0.53, label: 'Overweight', description: 'Increased health risk' },
  OBESE_1: { threshold: 0.58, label: 'Obese Class I', description: 'High health risk' },
  OBESE_2_PLUS: { label: 'Obese Class II+', description: 'Very high health risk' },
} as const;

// Quick log display categories (simplified for dashboard)
export const WAIST_RATIO_DISPLAY_CATEGORIES = {
  SLIM: { threshold: 0.43, label: 'Slim' },
  HEALTHY: { threshold: 0.53, label: 'Healthy' },
  OVERWEIGHT: { threshold: 0.58, label: 'Overweight' },
  HIGH_RISK: { label: 'High Risk' },
} as const;

// Activity level multipliers for TDEE calculation
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
} as const;

// Unit conversion constants
export const INCHES_TO_CM = 2.54;
export const KG_TO_LBS = 2.20462;

// Protein intake recommendations (grams per lb of bodyweight)
export const MIN_PROTEIN_PER_LB = 0.7;
export const MAX_PROTEIN_PER_LB = 1.0;

// Calorie adjustment factor (calories per 1 lb/week weight change)
export const CALORIE_ADJUSTMENT_FACTOR = 500;

// Deviation thresholds for recommendations
export const WEIGHT_DEVIATION_THRESHOLD = 0.5;
export const CALORIE_OVER_DEVIATION_PERCENT = 15;
export const CALORIE_UNDER_DEVIATION_PERCENT = 20;

// Minimum data requirements
export const MIN_WEIGHT_ENTRIES_FOR_ANALYSIS = 7;
export const RECENT_MACROS_DAYS = 7;
export const DEFAULT_MAINTENANCE_CALORIES = 2000;
export const DEFAULT_CUTTING_CALORIES = 1500;
