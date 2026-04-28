/**
 * Calculate daily calorie deficit based on percentage of body weight loss per week
 */

export const CALORIES_PER_LB = 3500;
export const CALORIES_PER_KG = 7700;

// BMR safety floors
export const BMR_FLOOR_FEMALE = 1200;
export const BMR_FLOOR_MALE = 1500;

// Slider configuration
export const SLIDER_CONFIG = {
  min: 0.25,
  max: 1.5,
  step: 0.05,
  default: 0.75,
} as const;

// Color-coded zones
export type SliderZone = 'conservative' | 'recommended' | 'aggressive' | 'notRecommended';

export interface SliderZoneConfig {
  min: number;
  max: number;
  color: string;
  label: string;
  trackColorClass: string;
  textColorClass: string;
}

export const SLIDER_ZONES: SliderZoneConfig[] = [
  { 
    min: 0.25, 
    max: 0.49, 
    color: 'blue', 
    label: 'Conservative',
    trackColorClass: 'bg-blue-500',
    textColorClass: 'text-blue-400'
  },
  { 
    min: 0.5, 
    max: 0.75, 
    color: 'green', 
    label: 'Recommended',
    trackColorClass: 'bg-emerald-500',
    textColorClass: 'text-success'
  },
  { 
    min: 0.751,
    max: 1.0, 
    color: 'yellow', 
    label: 'Aggressive',
    trackColorClass: 'bg-yellow-500',
    textColorClass: 'text-warning'
  },
  { 
    min: 1.001,
    max: 1.5, 
    color: 'orange', 
    label: 'Not Recommended',
    trackColorClass: 'bg-orange-500',
    textColorClass: 'text-error'
  },
];

export interface PercentageLossResult {
  weeklyLossLbs: number;
  weeklyLossKg: number;
  dailyDeficit: number;
  proposedIntake: number;
  isBelowBmrFloor: boolean;
  safePercentage: number;
  zone: SliderZone;
  zoneLabel: string;
  warningMessage?: string;
  showProteinNudge: boolean;
}

/**
 * Get the slider zone for a given percentage
 */
export function getSliderZone(pct: number): SliderZoneConfig {
  // Use a small epsilon for floating point comparison at boundaries
  const epsilon = 0.0001;

  // Find the zone where the percentage fits
  for (const zone of SLIDER_ZONES) {
    if (pct >= zone.min - epsilon && pct <= zone.max + epsilon) {
      return zone;
    }
  }
  // Default to recommended if out of range
  return SLIDER_ZONES[1];
}

/**
 * Calculate calorie deficit and related metrics based on percentage of body weight loss
 */
export function calculatePercentageLoss(
  currentWeight: number,
  weightUnit: 'lbs' | 'kg',
  percentage: number,
  tdee: number,
  bmr: number,
  gender: 'male' | 'female'
): PercentageLossResult {
  // Determine BMR floor
  const bmrFloor = gender === 'male' ? BMR_FLOOR_MALE : BMR_FLOOR_FEMALE;
  const effectiveBmrFloor = Math.max(bmr, bmrFloor);

  // Convert weight to both units for calculations
  const weightLbs = weightUnit === 'lbs' ? currentWeight : currentWeight * 2.20462262;
  const weightKg = weightUnit === 'kg' ? currentWeight : currentWeight * 0.45359237;

  // Calculate weekly loss
  const weeklyLossLbs = weightLbs * (percentage / 100);
  const weeklyLossKg = weightKg * (percentage / 100);

  // Calculate daily deficit
  const dailyDeficitLbs = (weightLbs * (percentage / 100) * CALORIES_PER_LB) / 7;
  const dailyDeficitKg = (weightKg * (percentage / 100) * CALORIES_PER_KG) / 7;
  const dailyDeficit = weightUnit === 'lbs' ? dailyDeficitLbs : dailyDeficitKg;

  // Calculate proposed intake
  const proposedIntake = tdee - dailyDeficit;

  // Check if below BMR floor
  const isBelowBmrFloor = proposedIntake < effectiveBmrFloor;

  // Calculate safe percentage if needed
  let safePercentage = percentage;
  let warningMessage: string | undefined;

  if (isBelowBmrFloor) {
    // Back-calculate the maximum safe percentage
    const maxSafeDeficit = tdee - effectiveBmrFloor;
    
    // Recalculate percentage from max safe deficit
    const weightForCalc = weightUnit === 'lbs' ? weightLbs : weightKg;
    const calPerUnit = weightUnit === 'lbs' ? CALORIES_PER_LB : CALORIES_PER_KG;
    
    safePercentage = ((maxSafeDeficit * 7) / (weightForCalc * calPerUnit)) * 100;
    
    // Round down to nearest step (0.05) to stay safe
    safePercentage = Math.floor(safePercentage * 20) / 20;
    
    // Ensure it's within bounds
    safePercentage = Math.max(SLIDER_CONFIG.min, Math.min(SLIDER_CONFIG.max, safePercentage));

    warningMessage = `At this pace, your daily target would drop to ${Math.round(proposedIntake)} kcal — below the safe minimum of ${Math.round(effectiveBmrFloor)} kcal. We've nudged your goal to ${safePercentage.toFixed(2)}% to keep you safe. To lose faster, increase your activity level to raise your TDEE.`;
  }

  // Get zone info
  const zoneConfig = getSliderZone(percentage);
  
  // Show protein nudge for 0.75% and above
  const showProteinNudge = percentage >= 0.75;

  return {
    weeklyLossLbs,
    weeklyLossKg,
    dailyDeficit,
    proposedIntake,
    isBelowBmrFloor,
    safePercentage,
    zone: zoneConfig.color as SliderZone,
    zoneLabel: zoneConfig.label,
    warningMessage,
    showProteinNudge,
  };
}

/**
 * Generate dynamic label text based on percentage and weight
 */
export function getDynamicLabelText(
  percentage: number,
  weightLbs: number
): string {
  const weeklyLoss = weightLbs * (percentage / 100);
  
  if (percentage < 0.5) {
    return `Slow & Steady — ${weeklyLoss.toFixed(1)} lb/week · Recommended for long-term results`;
  } else if (percentage <= 0.75) {
    return `Moderate — ${weeklyLoss.toFixed(1)} lb/week · Good sustainable pace`;
  } else if (percentage <= 1.0) {
    return `Aggressive — ${weeklyLoss.toFixed(1)} lb/week · Upper safe limit`;
  } else {
    return `⚠️ Above Safe Limit — ${weeklyLoss.toFixed(1)} lb/week · Not recommended without medical supervision`;
  }
}

/**
 * Check if user is very heavy (for special messaging)
 */
export function isVeryHeavyUser(weightLbs: number): boolean {
  return weightLbs >= 350;
}

/**
 * Get special message for very heavy users
 */
export function getHeavyUserMessage(weightLbs: number): string | null {
  if (isVeryHeavyUser(weightLbs)) {
    return `At your current weight, this is a safe and well-supported target.`;
  }
  return null;
}
