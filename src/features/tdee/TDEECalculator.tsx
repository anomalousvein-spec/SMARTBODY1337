import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../db/database';
import { TDEESettings } from '../../db/models';
import { calculateBMR, calculateTDEE } from '../../utils/calculations';
import { InputField, SelectField, FormMessage, SubmitButton } from '../../components/Form';
import { Card } from '../../components';
import { validateAge, validateHeight, validateWeight } from '../../utils/validation';
import {
  MIN_AGE, MAX_AGE,
  INCHES_TO_CM, CM_TO_IN,
  LBS_TO_KG, KG_TO_LBS
} from '../../config/constants';
import { PaceCoachSettings } from '../pace-coach/PaceCoachSettings';

interface TDEECalculatorProps {
  userId: string;
  currentWeight?: number;
}

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Office job, little exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (1-2 days/week exercise)' },
  { value: 'moderately_active', label: 'Moderately Active (3-5 days/week exercise)' },
  { value: 'very_active', label: 'Very Active (6-7 days/week heavy exercise)' },
  { value: 'extra_active', label: 'Extra Active (Professional athlete, physical job)' },
];

export function TDEECalculator({ userId, currentWeight }: TDEECalculatorProps) {
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('70');
  const [heightUnit, setHeightUnit] = useState<'in' | 'cm'>('in');
  const [weight, setWeight] = useState('180');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [activityLevel, setActivityLevel] = useState<TDEESettings['activityLevel']>('moderately_active');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetLossRate, setTargetLossRate] = useState('1');

  const [isSaving, setIsSaving] = useState(false);
  const [hasSettings, setHasSettings] = useState(false);
  const [fullSettings, setFullSettings] = useState<TDEESettings | null>(null);
  const [results, setResults] = useState<{ bmr: number; tdee: number; cuttingCalories: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const s = await db.tdee_settings.get('global');
      if (s) {
        setAge(s.age.toString());
        setGender(s.gender);
        setHeight(s.height.toString());
        setHeightUnit(s.heightUnit);
        setWeight(s.currentWeight?.toString() || '180');
        setWeightUnit(s.heightUnit === 'in' ? 'lbs' : 'kg');
        setActivityLevel(s.activityLevel);
        setTargetWeight(s.targetWeight?.toString() || '');
        setTargetLossRate(s.targetLossRate?.toString() || '1');
        setHasSettings(true);
        setFullSettings(s);

        const currentWeightVal = s.currentWeight || 180;
        const weightKg = s.heightUnit === 'in' ? currentWeightVal * LBS_TO_KG : currentWeightVal;
        const heightCm = s.heightUnit === 'in' ? s.height * INCHES_TO_CM : s.height;
        const bmr = calculateBMR(weightKg, heightCm, s.age, s.gender);
        const tdee = calculateTDEE(bmr, s.activityLevel);
        const cuttingCalories = s.cuttingCalories || (tdee - 500);
        setResults({ bmr, tdee, cuttingCalories });
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (currentWeight && hasSettings) {
      setWeight(currentWeight.toString());
    }
  }, [currentWeight, hasSettings]);

  const handleWeightUnitChange = useCallback((newUnit: string) => {
    const val = parseFloat(weight);
    if (!isNaN(val)) {
      if (newUnit === 'kg' && weightUnit === 'lbs') {
        setWeight((val * LBS_TO_KG).toFixed(1));
      } else if (newUnit === 'lbs' && weightUnit === 'kg') {
        setWeight((val * KG_TO_LBS).toFixed(1));
      }
    }
    setWeightUnit(newUnit as 'lbs' | 'kg');
  }, [weight, weightUnit]);

  const handleHeightUnitChange = useCallback((newUnit: string) => {
    const val = parseFloat(height);
    if (!isNaN(val)) {
      if (newUnit === 'cm' && heightUnit === 'in') {
        setHeight((val * INCHES_TO_CM).toFixed(1));
      } else if (newUnit === 'in' && heightUnit === 'cm') {
        setHeight((val * CM_TO_IN).toFixed(1));
      }
    }
    setHeightUnit(newUnit as 'in' | 'cm');
  }, [height, heightUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const ageVal = validateAge(age);
    if (!ageVal.valid) { setError(ageVal.error!); return; }
    const heightVal = validateHeight(height, heightUnit);
    if (!heightVal.valid) { setError(heightVal.error!); return; }
    const weightVal = validateWeight(weight);
    if (!weightVal.valid) { setError(weightVal.error!); return; }

    setIsSaving(true);
    try {
      const weightValue = parseFloat(weight);
      const heightValue = parseFloat(height);
      const ageValue = parseInt(age);
      const targetWeightValue = targetWeight ? parseFloat(targetWeight) : undefined;
      const targetLossRateValue = targetLossRate ? parseFloat(targetLossRate) : undefined;

      const settings: TDEESettings = {
        ...fullSettings,
        id: 'global',
        user_id: userId,
        age: ageValue,
        gender,
        height: heightValue,
        heightUnit,
        activityLevel,
        currentWeight: weightValue,
        targetWeight: targetWeightValue,
        targetLossRate: targetLossRateValue,
        lastUpdated: new Date().toISOString(),
      };

      await db.tdee_settings.put(settings);
      setFullSettings(settings);
      setHasSettings(true);
      setSuccess(true);

      const weightKg = weightUnit === 'lbs' ? weightValue * LBS_TO_KG : weightValue;
      const heightCm = heightUnit === 'in' ? heightValue * INCHES_TO_CM : heightValue;
      const bmr = calculateBMR(weightKg, heightCm, ageValue, gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      const cuttingCalories = tdee - 500;
      setResults({ bmr, tdee, cuttingCalories });
    } catch (err) {
      console.error('Failed to save TDEE settings:', err);
      setError('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="card-hover">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">Profile & TDEE</h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Age" type="number" value={age} onChange={setAge} min={MIN_AGE} max={MAX_AGE} required />
          <SelectField label="Gender" value={gender} onChange={(val) => setGender(val as 'male' | 'female')} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Height" type="number" value={height} onChange={setHeight} step="0.1" required />
          <SelectField label="Unit" value={heightUnit} onChange={handleHeightUnitChange} options={[{ value: 'in', label: 'inches' }, { value: 'cm', label: 'cm' }]} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Current Weight" type="number" value={weight} onChange={setWeight} step="0.1" required />
          <SelectField label="Unit" value={weightUnit} onChange={handleWeightUnitChange} options={[{ value: 'lbs', label: 'lbs' }, { value: 'kg', label: 'kg' }]} />
        </div>

        <SelectField label="Activity Level" value={activityLevel} onChange={(val) => setActivityLevel(val as TDEESettings['activityLevel'])} options={ACTIVITY_LEVELS} />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Target Weight (optional)" type="number" value={targetWeight} onChange={setTargetWeight} step="0.1" placeholder="160" />
          <InputField label="Target Loss Rate (lbs/week)" type="number" value={targetLossRate} onChange={setTargetLossRate} step="0.1" min="0.1" max="2.5" placeholder="1" />
        </div>

        {error && <FormMessage type="error" message={error} />}
        {success && <FormMessage type="success" message="Profile updated!" />}

        <SubmitButton isSubmitting={isSaving} idleText={hasSettings ? 'Update Profile' : 'Calculate TDEE'} />

        {fullSettings && <PaceCoachSettings settings={fullSettings} onUpdate={setFullSettings} />}
      </form>

      {results && (
        <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Your Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-theme-accent/10 rounded-lg p-4">
              <p className="text-sm text-theme-text-tertiary">BMR</p>
              <p className="text-2xl font-bold text-theme-accent">{Math.round(results.bmr)} <span className="text-sm font-normal">cal/day</span></p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-theme-text-tertiary">TDEE</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round(results.tdee)} <span className="text-sm font-normal">cal/day</span></p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-sm text-theme-text-tertiary">Cutting</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Math.round(results.cuttingCalories)} <span className="text-sm font-normal">cal/day</span></p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
