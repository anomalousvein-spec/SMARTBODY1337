import {
  MIN_WEIGHT_LBS,
  MAX_WEIGHT_LBS,
  MIN_CALORIES,
  MAX_CALORIES,
  MIN_MACRO_G,
  MAX_MACRO_G,
  MIN_WAIST_IN,
  MAX_WAIST_IN,
  MIN_AGE,
  MAX_AGE,
  MIN_HEIGHT_IN,
  MAX_HEIGHT_IN,
  MIN_HEIGHT_CM,
  MAX_HEIGHT_CM,
} from "../config/constants";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateWeight(weightStr: string): ValidationResult {
  const weight = parseFloat(weightStr);
  if (isNaN(weight) || weight <= 0)
    return { valid: false, error: "Please enter a valid weight" };
  if (weight < MIN_WEIGHT_LBS || weight > MAX_WEIGHT_LBS)
    return {
      valid: false,
      error: `Weight must be between ${MIN_WEIGHT_LBS} and ${MAX_WEIGHT_LBS} lbs`,
    };
  return { valid: true };
}

export function validateWaist(measurementStr: string): ValidationResult {
  const measurement = parseFloat(measurementStr);
  if (isNaN(measurement) || measurement <= 0)
    return { valid: false, error: "Please enter a valid measurement" };
  if (measurement < MIN_WAIST_IN || measurement > MAX_WAIST_IN)
    return {
      valid: false,
      error: `Waist measurement must be between ${MIN_WAIST_IN} and ${MAX_WAIST_IN} inches`,
    };
  return { valid: true };
}

export function validateCalories(calorieStr: string): ValidationResult {
  const calories = parseFloat(calorieStr);
  if (isNaN(calories) || calories < 0)
    return { valid: false, error: "Please enter valid calories" };
  if (calories < MIN_CALORIES || calories > MAX_CALORIES)
    return {
      valid: false,
      error: `Calories must be between ${MIN_CALORIES} and ${MAX_CALORIES} kcal`,
    };
  return { valid: true };
}

export function validateMacro(
  macroStr: string,
  name: string,
): ValidationResult {
  const macro = parseFloat(macroStr);
  if (isNaN(macro) || macro < 0)
    return { valid: false, error: `Please enter valid ${name} grams` };
  if (macro < MIN_MACRO_G || macro > MAX_MACRO_G)
    return {
      valid: false,
      error: `${name} must be between ${MIN_MACRO_G} and ${MAX_MACRO_G}g`,
    };
  return { valid: true };
}

export function validateAge(ageStr: string): ValidationResult {
  const age = parseInt(ageStr);
  if (isNaN(age) || age < MIN_AGE || age > MAX_AGE)
    return {
      valid: false,
      error: `Age must be between ${MIN_AGE} and ${MAX_AGE}`,
    };
  return { valid: true };
}

export function validateHeight(
  heightStr: string,
  unit: "in" | "cm",
): ValidationResult {
  const height = parseFloat(heightStr);
  const min = unit === "in" ? MIN_HEIGHT_IN : MIN_HEIGHT_CM;
  const max = unit === "in" ? MAX_HEIGHT_IN : MAX_HEIGHT_CM;
  if (isNaN(height) || height < min || height > max)
    return {
      valid: false,
      error: `Height must be between ${min} and ${max} ${unit}`,
    };
  return { valid: true };
}
