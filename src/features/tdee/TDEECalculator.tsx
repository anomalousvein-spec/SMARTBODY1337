import React, { useState, useEffect } from 'react';
import { InputField, SelectField, FormMessage, SubmitButton } from '../../components/Form';
import { Card, Skeleton } from '../../components';
import { useTDEESettings } from '../../hooks/useTDEESettings';
import { TDEESettings } from '../../db/models';
import {
  MIN_AGE,
  MAX_AGE,
  LBS_TO_KG,
  INCHES_TO_CM
} from '../../config/constants';
import { calculateBMR, calculateTDEE, getUserPhase } from '../../utils/calculations';
import { validateWeight } from '../../utils/validation';
import { useApp } from '../../context/AppContext';
import { PaceCoachSettings } from '../pace-coach/PaceCoachSettings';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Little/No Exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (6-7 days/week)' },
  { value: 'extra_active', label: 'Extra Active (Professional Athlete)' },
];

/**
 * TDEE Calculator and Profile Settings component
 * Integrated with the centralized form components
 */
export function TDEECalculator() {
  const { user } = useApp();
  const userId = user.id;
  const { settings: fullSettings, isLoading, updateSettings } = useTDEESettings(userId);

  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'in' | 'cm'>('in');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [activityLevel, setActivityLevel] = useState<TDEESettings['activityLevel']>('moderately_active');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetLossRate, setTargetLossRate] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState<{ bmr: number; tdee: number; cuttingCalories: number } | null>(null);

  useEffect(() => {
    if (fullSettings) {
      setAge(fullSettings.age.toString());
      setGender(fullSettings.gender);
      setHeight(fullSettings.height.toString());
      setHeightUnit(fullSettings.heightUnit);
      setWeight(fullSettings.currentWeight.toString());
      setActivityLevel(fullSettings.activityLevel);
      setTargetWeight(fullSettings.targetWeight?.toString() || '');
      setTargetLossRate(fullSettings.targetLossRate?.toString() || '');

      if (fullSettings.tdee && fullSettings.cuttingCalories) {
        setResults({
          bmr: fullSettings.tdee / 1.5, // Approximation for initial view
          tdee: fullSettings.tdee,
          cuttingCalories: fullSettings.cuttingCalories
        });
      }
    }
  }, [fullSettings]);

  const handleHeightUnitChange = (unit: string) => {
    const val = parseFloat(height);
    if (!isNaN(val)) {
      setHeight(unit === 'cm' ? (val * 2.54).toFixed(1) : (val / 2.54).toFixed(1));
    }
    setHeightUnit(unit as 'in' | 'cm');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const weightVal = validateWeight(weight);
    if (!weightVal.valid) { setError(weightVal.error!); return; }

    setIsSaving(true);
    try {
      const weightValue = parseFloat(weight);
      const heightValue = parseFloat(height);
      const ageValue = parseInt(age);
      const targetWeightValue = targetWeight ? parseFloat(targetWeight) : undefined;
      const targetLossRateValue = targetLossRate ? parseFloat(targetLossRate) : undefined;

      const weightKg = weightUnit === 'lbs' ? weightValue * LBS_TO_KG : weightValue;
      const heightCm = heightUnit === 'in' ? heightValue * INCHES_TO_CM : heightValue;
      const bmr = calculateBMR(weightKg, heightCm, ageValue, gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      
      const targetCalories = Math.round(tdee - (targetLossRateValue || 0) * 500);

      await updateSettings({
        age: ageValue,
        gender,
        height: heightValue,
        heightUnit,
        activityLevel,
        currentWeight: weightValue,
        targetWeight: targetWeightValue,
        targetLossRate: targetLossRateValue,
        tdee,
        cuttingCalories: targetCalories
      });

      setSuccess(true);
      setResults({ bmr, tdee, cuttingCalories: targetCalories });
    } catch (err) {
      console.error('Failed to save TDEE settings:', err);
      setError('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Card className="card-hover"><Skeleton className="h-96" /></Card>;

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
          <SelectField label="Unit" value={weightUnit} onChange={(val) => setWeightUnit(val as 'lbs' | 'kg')} options={[{ value: 'lbs', label: 'lbs' }, { value: 'kg', label: 'kg' }]} />
        </div>

        <SelectField label="Activity Level" value={activityLevel} onChange={(val) => setActivityLevel(val as TDEESettings['activityLevel'])} options={ACTIVITY_LEVELS} />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Target Weight (optional)" type="number" value={targetWeight} onChange={setTargetWeight} step="0.1" placeholder="160" />
          <InputField label="Target Loss Rate (lbs/week)" type="number" value={targetLossRate} onChange={setTargetLossRate} step="0.1" min="0.1" max="2.5" placeholder="1" />
        </div>

        {error && <FormMessage type="error" message={error} />}
        {success && <FormMessage type="success" message="Profile updated!" />}

        <SubmitButton isSubmitting={isSaving} idleText={fullSettings ? 'Update Profile' : 'Calculate TDEE'} />

        {fullSettings && (
          <PaceCoachSettings
            settings={fullSettings}
            onUpdate={(updated) => updateSettings(updated)}
          />
        )}
      </form>

      {results && (
        <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Your Results</h3>
          {(() => {
            const phase = getUserPhase(
              fullSettings?.currentWeight,
              fullSettings?.targetWeight,
              fullSettings?.targetLossRate
            );
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">BMR</p>
                  <p className="text-2xl font-bold text-theme-accent">{Math.round(results.bmr)} <span className="text-xs font-normal text-theme-text-tertiary uppercase">cal/day</span></p>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">TDEE</p>
                  <p className="text-2xl font-bold text-success">{Math.round(results.tdee)} <span className="text-xs font-normal text-success uppercase">cal/day</span></p>
                </div>
                <div className={`${phase.bgClass} border border-white/5 rounded-xl p-4`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${phase.colorClass} mb-1`}>{phase.label}</p>
                  <p className={`text-2xl font-bold ${phase.colorClass}`}>{Math.round(results.cuttingCalories)} <span className="text-xs font-normal ${phase.colorClass} uppercase">cal/day</span></p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
}
