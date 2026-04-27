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
import { calculateBMR, calculateTDEE, getUserPhase, calculateAdvancedBMR, calculateAdvancedMacros, AdvancedBMRResult, AdvancedMacroTargets } from '../../utils/calculations';
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

  // Advanced mode state
  const [useAdvancedMode, setUseAdvancedMode] = useState(false);
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState<'in' | 'cm'>('in');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState<{ bmr: number; tdee: number; cuttingCalories: number } | null>(null);
  const [advancedResults, setAdvancedResults] = useState<AdvancedBMRResult | null>(null);
  const [macroTargets, setMacroTargets] = useState<AdvancedMacroTargets | null>(null);

  useEffect(() => {
    if (fullSettings) {
      setAge(fullSettings.age.toString());
      setGender(fullSettings.gender);
      setHeight(fullSettings.height.toString());
      setHeightUnit(fullSettings.heightUnit);
      setWeight(fullSettings.currentWeight?.toString() || '');
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

  const handleMeasurementUnitChange = (unit: string) => {
    const waistVal = parseFloat(waist);
    const neckVal = parseFloat(neck);
    const hipVal = parseFloat(hip);
    
    if (!isNaN(waistVal)) {
      setWaist(unit === 'cm' ? (waistVal * 2.54).toFixed(1) : (waistVal / 2.54).toFixed(1));
    }
    if (!isNaN(neckVal)) {
      setNeck(unit === 'cm' ? (neckVal * 2.54).toFixed(1) : (neckVal / 2.54).toFixed(1));
    }
    if (!isNaN(hipVal)) {
      setHip(unit === 'cm' ? (hipVal * 2.54).toFixed(1) : (hipVal / 2.54).toFixed(1));
    }
    setMeasurementUnit(unit as 'in' | 'cm');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const weightVal = validateWeight(weight);
    if (!weightVal.valid) { setError(weightVal.error!); return; }

    // Validate advanced mode inputs if enabled
    if (useAdvancedMode) {
      if (!waist || parseFloat(waist) <= 0) {
        setError('Please enter a valid waist measurement.');
        return;
      }
      if (!neck || parseFloat(neck) <= 0) {
        setError('Please enter a valid neck measurement.');
        return;
      }
      if (gender === 'female' && (!hip || parseFloat(hip) <= 0)) {
        setError('Please enter a valid hip measurement (required for females).');
        return;
      }
    }

    setIsSaving(true);
    try {
      const weightValue = parseFloat(weight);
      const heightValue = parseFloat(height);
      const ageValue = parseInt(age);
      const targetWeightValue = targetWeight ? parseFloat(targetWeight) : undefined;
      const targetLossRateValue = targetLossRate ? parseFloat(targetLossRate) : undefined;

      const weightKg = weightUnit === 'lbs' ? weightValue * LBS_TO_KG : weightValue;
      const heightCm = heightUnit === 'in' ? heightValue * INCHES_TO_CM : heightValue;
      
      let bmr: number;
      let advResults: AdvancedBMRResult | null = null;

      if (useAdvancedMode) {
        // Advanced mode: use Navy + RFM average with Katch-McArdle
        const waistValue = parseFloat(waist);
        const neckValue = parseFloat(neck);
        const hipValue = hip ? parseFloat(hip) : undefined;
        
        const waistCm = measurementUnit === 'in' ? waistValue * INCHES_TO_CM : waistValue;
        const neckCm = measurementUnit === 'in' ? neckValue * INCHES_TO_CM : neckValue;
        const hipCm = hipValue !== undefined 
          ? (measurementUnit === 'in' ? hipValue * INCHES_TO_CM : hipValue)
          : undefined;

        advResults = calculateAdvancedBMR(weightKg, heightCm, waistCm, neckCm, hipCm, gender);
        bmr = advResults.bmr;
      } else {
        // Standard mode: Mifflin-St Jeor
        bmr = calculateBMR(weightKg, heightCm, ageValue, gender);
      }

      const tdee = calculateTDEE(bmr, activityLevel);
      
      const targetCalories = Math.round(tdee - (targetLossRateValue || 0) * 500);

      // Calculate advanced macro targets if in advanced mode
      let macroTargetsResult: AdvancedMacroTargets | null = null;
      if (advResults && useAdvancedMode) {
        // Convert target weight to lbs if provided, otherwise use undefined for estimation
        const goalWeightLbs = targetWeightValue 
          ? (weightUnit === 'kg' ? targetWeightValue * 2.20462 : targetWeightValue)
          : undefined;
        
        macroTargetsResult = calculateAdvancedMacros(
          advResults.leanBodyMass,
          goalWeightLbs,
          bmr,
          tdee,
          targetCalories
        );
      }

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
      setAdvancedResults(advResults);
      setMacroTargets(macroTargetsResult);
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

        {/* Advanced Mode Toggle */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={() => setUseAdvancedMode(!useAdvancedMode)}
            className="flex items-center justify-between w-full text-left p-3 rounded-lg bg-theme-bg-tertiary/30 hover:bg-theme-bg-tertiary/50 transition-colors"
          >
            <span className="text-sm font-semibold text-theme-text-primary">Advanced BMR Calculation</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-theme-text-tertiary">Uses Navy + RFM average with Katch-McArdle</span>
              <svg 
                className={`w-5 h-5 transform transition-transform ${useAdvancedMode ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {useAdvancedMode && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs text-theme-text-tertiary italic">
                💡 Uses Lean Body Mass (LBM) to calculate BMR. Best for users with higher-than-average muscle mass.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Waist (at navel)" 
                  type="number" 
                  value={waist} 
                  onChange={setWaist} 
                  step="0.1" 
                  required 
                  placeholder={measurementUnit === 'in' ? 'e.g., 34' : 'e.g., 86'}
                />
                <InputField 
                  label="Neck (below Adam's apple)" 
                  type="number" 
                  value={neck} 
                  onChange={setNeck} 
                  step="0.1" 
                  required 
                  placeholder={measurementUnit === 'in' ? 'e.g., 15' : 'e.g., 38'}
                />
              </div>
              
              {gender === 'female' && (
                <InputField 
                  label="Hip (at widest point)" 
                  type="number" 
                  value={hip} 
                  onChange={setHip} 
                  step="0.1" 
                  required 
                  placeholder={measurementUnit === 'in' ? 'e.g., 38' : 'e.g., 97'}
                />
              )}
              
              <div className="flex items-center gap-2">
                <SelectField 
                  label="Measurement Unit" 
                  value={measurementUnit} 
                  onChange={handleMeasurementUnitChange} 
                  options={[{ value: 'in', label: 'inches' }, { value: 'cm', label: 'cm' }]} 
                />
              </div>
            </div>
          )}
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
          
          {/* Advanced Mode Body Fat Display */}
          {advancedResults && (
            <div className="mb-6 p-4 bg-theme-bg-tertiary/30 border border-white/5 rounded-xl">
              <h4 className="text-sm font-semibold text-theme-text-primary mb-3">Body Composition Analysis (Advanced)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">RFM Body Fat</p>
                  <p className="text-lg font-bold text-blue-400">{advancedResults.rfmBodyFat.toFixed(1)}%</p>
                </div>
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Navy Body Fat</p>
                  <p className="text-lg font-bold text-purple-400">{advancedResults.navyBodyFat.toFixed(1)}%</p>
                </div>
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-accent mb-1">Avg Body Fat</p>
                  <p className="text-lg font-bold text-theme-accent">{advancedResults.avgBodyFat.toFixed(1)}%</p>
                </div>
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Lean Body Mass</p>
                  <p className="text-lg font-bold text-green-400">{advancedResults.leanBodyMass.toFixed(1)} kg</p>
                </div>
              </div>
              
              {/* Waist-to-Height Ratio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Waist-to-Height Ratio</p>
                  <p className="text-lg font-bold text-cyan-400">{advancedResults.waistToHeightRatio.toFixed(2)}</p>
                  <p className="text-xs text-theme-text-tertiary mt-1">
                    {advancedResults.waistToHeightRatio < 0.5 ? '✓ Healthy Range' : '⚠ Consider Reduction'}
                  </p>
                </div>
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">LBM in lbs</p>
                  <p className="text-lg font-bold text-green-400">{(advancedResults.leanBodyMass * 2.20462).toFixed(1)} lbs</p>
                </div>
              </div>
              
              {/* Advanced Macro Targets */}
              {macroTargets && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <h5 className="text-sm font-semibold text-theme-text-primary mb-3">Daily Nutrition Targets</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Protein Target</p>
                      <p className="text-base font-bold text-orange-400">{Math.round(macroTargets.proteinMin)}-{Math.round(macroTargets.proteinMax)}g</p>
                      <p className="text-[10px] text-theme-text-tertiary mt-1">Based on LBM</p>
                    </div>
                    <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Minimum Fat</p>
                      <p className="text-base font-bold text-yellow-400">{Math.round(macroTargets.fatMin)}g</p>
                      <p className="text-[10px] text-theme-text-tertiary mt-1">Hormonal Floor</p>
                    </div>
                    <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Remaining Cals</p>
                      <p className="text-base font-bold text-pink-400">{Math.round(macroTargets.remainingCalories)}</p>
                      <p className="text-[10px] text-theme-text-tertiary mt-1">For Carbs/Extra Fat</p>
                    </div>
                    <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">BMR (Katch-McArdle)</p>
                      <p className="text-base font-bold text-theme-accent">{Math.round(advancedResults.bmr)}</p>
                      <p className="text-[10px] text-theme-text-tertiary mt-1">cal/day</p>
                    </div>
                  </div>
                  <p className="text-xs text-theme-text-tertiary mt-3 italic">
                    💡 Meeting your Protein and Fat floors ensures muscle retention and hormonal health. Adjust Carbs based on your daily activity.
                  </p>
                </div>
              )}
            </div>
          )}
          
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
                  <p className={`text-2xl font-bold ${phase.colorClass}`}>{Math.round(results.cuttingCalories)} <span className="text-xs font-normal text-theme-text-tertiary uppercase">cal/day</span></p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
}
