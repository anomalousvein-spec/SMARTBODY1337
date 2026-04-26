import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { TDEESettings } from '../../db/models';
import { calculateBMR, calculateTDEE } from '../../utils/calculations';
import { PaceCoachSettings } from '../pace-coach/PaceCoachSettings';

interface TDEECalculatorProps {
  userId: string;
  currentWeight?: number;
}

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Office job, little exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (1-2 days/week exercise)' },
  { value: 'moderately_active', label: 'Moderately Active (3-5 days/week exercise)' },
  { value: 'very_active', label: 'Very Active (6-7 days/week exercise)' },
  { value: 'extra_active', label: 'Extra Active (Physical job + exercise)' },
] as const;

export function TDEECalculator({ userId, currentWeight }: TDEECalculatorProps) {
  const [age, setAge] = useState('25');
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

  useEffect(() => {
    const loadSettings = async () => {
      const s = await db.tdee_settings.get('global');
      if (s) {
        setAge(s.age.toString());
        setGender(s.gender);
        setHeight(s.height.toString());
        setHeightUnit(s.heightUnit);
        setWeight(s.currentWeight?.toString() || '180');
        setWeightUnit(s.heightUnit === 'in' ? 'lbs' : 'kg'); // Guessing unit based on height unit if not stored
        setActivityLevel(s.activityLevel);
        setTargetWeight(s.targetWeight?.toString() || '');
        setTargetLossRate(s.targetLossRate?.toString() || '1');
        setHasSettings(true);
        setFullSettings(s);

        // Auto-calculate initial results
        const currentWeightVal = s.currentWeight || 180;
        const weightKg = s.heightUnit === 'in' ? currentWeightVal * 0.453592 : currentWeightVal;
        const heightCm = s.heightUnit === 'in' ? s.height * 2.54 : s.height;
        const bmr = calculateBMR(weightKg, heightCm, s.age, s.gender);
        const tdee = calculateTDEE(bmr, s.activityLevel);
        const cuttingCalories = s.cuttingCalories || (tdee - 500);
        setResults({ bmr, tdee, cuttingCalories });
      }
    };
    loadSettings();
  }, []);

  // Auto-update weight if provided from weight tracking
  useEffect(() => {
    if (currentWeight && hasSettings) {
      setWeight(currentWeight.toString());
    }
  }, [currentWeight, hasSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Calculate and display results
      const weightKg = weightUnit === 'lbs' ? weightValue * 0.453592 : weightValue;
      const heightCm = heightUnit === 'in' ? heightValue * 2.54 : heightValue;
      const bmr = calculateBMR(weightKg, heightCm, ageValue, gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      const cuttingCalories = tdee - 500;

      setResults({ bmr, tdee, cuttingCalories });
    } catch (err) {
      console.error('Error saving TDEE settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass card-hover rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        Profile & TDEE
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tdee-age" className="block text-sm font-medium text-theme-text-secondary mb-1">
              Age
            </label>
            <input
              id="tdee-age"
              type="number"
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="tdee-gender" className="block text-sm font-medium text-theme-text-secondary mb-1">
              Gender
            </label>
            <select
              id="tdee-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female')}
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tdee-height" className="block text-sm font-medium text-theme-text-secondary mb-1">
              Height
            </label>
            <input
              id="tdee-height"
              type="number"
              step="0.1"
              min="0"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="70"
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="tdee-height-unit" className="block text-sm font-medium text-theme-text-secondary mb-1">
              Unit
            </label>
            <select
              id="tdee-height-unit"
              value={heightUnit}
              onChange={(e) => setHeightUnit(e.target.value as 'in' | 'cm')}
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="in">inches</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tdee-weight" className="block text-sm font-medium text-theme-text-secondary mb-1">
              Current Weight
            </label>
            <input
              id="tdee-weight"
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="180"
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="tdee-weight-unit" className="block text-sm font-medium text-theme-text-secondary mb-1">
              Unit
            </label>
            <select
              id="tdee-weight-unit"
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as 'lbs' | 'kg')}
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tdee-activity" className="block text-sm font-medium text-theme-text-secondary mb-1">
            Activity Level
          </label>
          <select
            id="tdee-activity"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as TDEESettings['activityLevel'])}
            className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tdee-target-weight" className="block text-sm font-medium text-theme-text-secondary mb-1">
              Target Weight (optional)
            </label>
            <input
              id="tdee-target-weight"
              type="number"
              step="0.1"
              min="0"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="160"
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="tdee-loss-rate" className="block text-sm font-medium text-theme-text-secondary mb-1">
              Target Loss Rate (lbs/week)
            </label>
            <input
              id="tdee-loss-rate"
              type="number"
              step="0.1"
              min="0.1"
              max="2.5"
              value={targetLossRate}
              onChange={(e) => setTargetLossRate(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="w-full py-3 px-4 bg-theme-accent hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isSaving ? 'Saving...' : hasSettings ? 'Update Profile' : 'Calculate TDEE'}
        </button>

        {fullSettings && (
          <PaceCoachSettings
            settings={fullSettings}
            onUpdate={setFullSettings}
          />
        )}
      </form>

      {results && (
        <div role="region" aria-label="TDEE Calculation Results" className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
            Your Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-theme-accent/10 rounded-lg p-4">
              <p className="text-sm text-theme-text-tertiary">BMR (Basal Metabolic Rate)</p>
              <p className="text-2xl font-bold text-theme-accent">
                {Math.round(results.bmr)} <span className="text-sm font-normal">cal/day</span>
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-theme-text-tertiary">TDEE (Maintenance)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round(results.tdee)} <span className="text-sm font-normal">cal/day</span>
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-sm text-theme-text-tertiary">Cutting Calories</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(results.cuttingCalories)} <span className="text-sm font-normal">cal/day</span>
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-theme-text-tertiary italic">
            * Cutting calories based on a 500 calorie/day deficit for approximately 1 lb/week loss.
            Adjust based on your target loss rate and progress.
          </p>
        </div>
      )}
    </div>
  );
}
