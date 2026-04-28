import React, { useState, useEffect } from 'react';
import { InputField, SelectField, FormMessage, SubmitButton, PercentageLossSlider } from '../../components/Form';
import { Card, Skeleton } from '../../components';
import { useTDEESettings } from '../../hooks/useTDEESettings';
import { TDEESettings } from '../../db/models';
import {
  MIN_AGE,
  MAX_AGE,
  LBS_TO_KG,
  INCHES_TO_CM,
  KG_TO_LBS,
  CM_TO_IN
} from '../../config/constants';
import {
  calculateBMR,
  calculateTDEE,
  getUserPhase,
  calculateAdvancedBMR,
  calculateAdvancedMacros,
  AdvancedBMRResult,
  AdvancedMacroTargets
} from '../../utils/calculations';
import { validateWeight } from '../../utils/validation';
import { useApp } from '../../context/AppContext';
import { PaceCoachSettings } from '../pace-coach/PaceCoachSettings';
import { StandardResultsView } from './components/StandardResultsView';
import { AdvancedResultsView } from './components/AdvancedResultsView';
import { SLIDER_CONFIG, calculatePercentageLoss } from '../../utils/percentageLoss';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Little/No Exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (6-7 days/week)' },
  { value: 'extra_active', label: 'Extra Active (Professional Athlete)' },
];

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
  const [targetLossRate, setTargetLossRate] = useState(SLIDER_CONFIG.default.toString());

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
  
  // Compute BMR and TDEE in real-time for the slider preview
  const liveWeightValue = weight ? parseFloat(weight) : 0;
  const liveWeightKg = weightUnit === 'lbs' ? liveWeightValue * LBS_TO_KG : liveWeightValue;
  const liveHeightValue = height ? parseFloat(height) : 0;
  const liveHeightCm = heightUnit === 'in' ? liveHeightValue * INCHES_TO_CM : liveHeightValue;
  
  let liveBmr = results?.bmr || (gender === 'male' ? 1500 : 1200);
  let liveTdee = results?.tdee || 2000;
  
  if (liveWeightValue > 0 && liveHeightValue > 0 && age) {
    const ageValue = parseInt(age);
    if (useAdvancedMode && waist && neck) {
      const waistCm = measurementUnit === 'in' ? parseFloat(waist) * INCHES_TO_CM : parseFloat(waist);
      const neckCm = measurementUnit === 'in' ? parseFloat(neck) * INCHES_TO_CM : parseFloat(neck);
      const hipCm = gender === 'female' && hip 
        ? (measurementUnit === 'in' ? parseFloat(hip) * INCHES_TO_CM : parseFloat(hip))
        : undefined;
      const advBmr = calculateAdvancedBMR(liveWeightKg, liveHeightCm, waistCm, neckCm, hipCm, gender);
      liveBmr = advBmr.bmr;
    } else {
      liveBmr = calculateBMR(liveWeightKg, liveHeightCm, ageValue, gender);
    }
    liveTdee = calculateTDEE(liveBmr, activityLevel);
  }

  useEffect(() => {
    if (fullSettings) {
      setAge(fullSettings.age.toString());
      setGender(fullSettings.gender);
      setHeight(fullSettings.height.toString());
      setHeightUnit(fullSettings.heightUnit);
      setWeight(fullSettings.currentWeight?.toString() || '');
      setWeightUnit(fullSettings.heightUnit === 'in' ? 'lbs' : 'kg');
      setActivityLevel(fullSettings.activityLevel);
      setTargetWeight(fullSettings.targetWeight?.toString() || '');
      const savedPercentage = fullSettings.targetLossRate ?? SLIDER_CONFIG.default;
      setTargetLossRate(savedPercentage.toString());

      const mode = fullSettings.calculationMode || 'standard';
      setUseAdvancedMode(mode === 'advanced');
      setWaist(fullSettings.waist?.toString() || '');
      setNeck(fullSettings.neck?.toString() || '');
      setHip(fullSettings.hip?.toString() || '');
      setMeasurementUnit(fullSettings.measurementUnit || 'in');

      if (fullSettings.tdee && fullSettings.cuttingCalories) {
        const wKg = (fullSettings.currentWeight || 0) * (fullSettings.heightUnit === 'in' ? LBS_TO_KG : 1);
        const hCm = fullSettings.height * (fullSettings.heightUnit === 'in' ? INCHES_TO_CM : 1);

        let bmrValue = 0;
        let adv: AdvancedBMRResult | null = null;
        let macros: AdvancedMacroTargets | null = null;

        if (mode === 'advanced' && fullSettings.waist && fullSettings.neck) {
           const wCm = (fullSettings.measurementUnit === 'in' ? fullSettings.waist * INCHES_TO_CM : fullSettings.waist);
           const nCm = (fullSettings.measurementUnit === 'in' ? fullSettings.neck * INCHES_TO_CM : fullSettings.neck);
           const hiCm = fullSettings.hip ? (fullSettings.measurementUnit === 'in' ? fullSettings.hip * INCHES_TO_CM : fullSettings.hip) : undefined;

           adv = calculateAdvancedBMR(wKg, hCm, wCm, nCm, hiCm, fullSettings.gender);
           setAdvancedResults(adv);
           bmrValue = adv.bmr;

           const goalWeightLbs = fullSettings.targetWeight ? (fullSettings.heightUnit === 'cm' ? fullSettings.targetWeight * KG_TO_LBS : fullSettings.targetWeight) : undefined;
           macros = calculateAdvancedMacros(adv.leanBodyMass, goalWeightLbs, adv.bmr, fullSettings.tdee, fullSettings.cuttingCalories);
           setMacroTargets(macros);
        } else {
           bmrValue = calculateBMR(wKg, hCm, fullSettings.age, fullSettings.gender);
        }

        setResults({
          bmr: bmrValue,
          tdee: fullSettings.tdee,
          cuttingCalories: fullSettings.cuttingCalories
        });
      }
    }
  }, [fullSettings]);

  const handleHeightUnitChange = (unit: string) => {
    const val = parseFloat(height);
    if (!isNaN(val)) {
      setHeight(unit === 'cm' ? (val * INCHES_TO_CM).toFixed(1) : (val * CM_TO_IN).toFixed(1));
    }
    setHeightUnit(unit as 'in' | 'cm');
  };

  const handleWeightUnitChange = (unit: string) => {
    const val = parseFloat(weight);
    if (!isNaN(val)) {
      setWeight(unit === 'kg' ? (val * LBS_TO_KG).toFixed(1) : (val * KG_TO_LBS).toFixed(1));
    }
    setWeightUnit(unit as 'lbs' | 'kg');
  };

  const handleMeasurementUnitChange = (unit: string) => {
    const waistVal = parseFloat(waist);
    const neckVal = parseFloat(neck);
    const hipVal = parseFloat(hip);
    
    if (!isNaN(waistVal)) {
      setWaist(unit === 'cm' ? (waistVal * INCHES_TO_CM).toFixed(1) : (waistVal * CM_TO_IN).toFixed(1));
    }
    if (!isNaN(neckVal)) {
      setNeck(unit === 'cm' ? (neckVal * INCHES_TO_CM).toFixed(1) : (neckVal * CM_TO_IN).toFixed(1));
    }
    if (!isNaN(hipVal)) {
      setHip(unit === 'cm' ? (hipVal * INCHES_TO_CM).toFixed(1) : (hipVal * CM_TO_IN).toFixed(1));
    }
    setMeasurementUnit(unit as 'in' | 'cm');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const weightVal = validateWeight(weight);
    if (!weightVal.valid) { setError(weightVal.error!); return; }

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
      const targetLossRateValue = targetLossRate ? parseFloat(targetLossRate) : SLIDER_CONFIG.default;

      const weightKg = weightUnit === 'lbs' ? weightValue * LBS_TO_KG : weightValue;
      const heightCm = heightUnit === 'in' ? heightValue * INCHES_TO_CM : heightValue;
      
      let bmr: number;
      let advResults: AdvancedBMRResult | null = null;

      if (useAdvancedMode) {
        const waistValue = parseFloat(waist);
        const neckValue = parseFloat(neck);
        const hipValue = hip ? parseFloat(hip) : undefined;
        
        const waistCm = measurementUnit === 'in' ? waistValue * INCHES_TO_CM : waistValue;
        const neckCm = measurementUnit === 'in' ? neckValue * INCHES_TO_CM : neckValue;
        const hipCm = (hipValue !== undefined && hipValue > 0)
          ? (measurementUnit === 'in' ? hipValue * INCHES_TO_CM : hipValue)
          : undefined;

        advResults = calculateAdvancedBMR(weightKg, heightCm, waistCm, neckCm, hipCm, gender);
        bmr = advResults.bmr;
      } else {
        bmr = calculateBMR(weightKg, heightCm, ageValue, gender);
      }

      const tdee = calculateTDEE(bmr, activityLevel);
      
      // Use the utility for calorie math consistency
      const lossResults = calculatePercentageLoss(
        weightValue,
        weightUnit,
        targetLossRateValue,
        tdee,
        bmr,
        gender
      );
      const targetCalories = Math.round(lossResults.proposedIntake);

      let macroTargetsResult: AdvancedMacroTargets | null = null;
      if (advResults && useAdvancedMode) {
        const goalWeightLbs = targetWeightValue 
          ? (weightUnit === 'kg' ? targetWeightValue * KG_TO_LBS : targetWeightValue)
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
        cuttingCalories: targetCalories,
        calculationMode: useAdvancedMode ? 'advanced' : 'standard',
        waist: useAdvancedMode ? parseFloat(waist) : undefined,
        neck: useAdvancedMode ? parseFloat(neck) : undefined,
        hip: useAdvancedMode && gender === 'female' ? parseFloat(hip) : undefined,
        measurementUnit: useAdvancedMode ? measurementUnit : undefined
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

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const currentPhase = getUserPhase(
    fullSettings?.currentWeight,
    fullSettings?.targetWeight,
    fullSettings?.targetLossRate
  );

  return (
    <Card>
      <h2 className="text-xl font-bold text-theme-text-primary mb-6">TDEE & Profile Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Mode Toggle at Top */}
        <div className="flex p-1 bg-theme-bg-tertiary/50 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setUseAdvancedMode(false)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!useAdvancedMode ? 'bg-theme-accent text-white shadow-lg' : 'text-theme-text-tertiary hover:text-theme-text-primary'}`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setUseAdvancedMode(true)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${useAdvancedMode ? 'bg-theme-accent text-white shadow-lg' : 'text-theme-text-tertiary hover:text-theme-text-primary'}`}
          >
            Advanced
          </button>
        </div>

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

        <div className="grid grid-cols-1 gap-4">
          <InputField label="Target Weight (optional)" type="number" value={targetWeight} onChange={setTargetWeight} step="0.1" placeholder="160" />
        </div>

        {/* Percentage-based Loss Rate Slider - replaces flat lbs/week selector */}
        {weight && !isNaN(parseFloat(weight)) ? (
          <PercentageLossSlider
            currentWeight={parseFloat(weight)}
            weightUnit={weightUnit}
            tdee={liveTdee}
            bmr={liveBmr}
            gender={gender}
            value={parseFloat(targetLossRate)}
            onChange={(pct) => setTargetLossRate(pct.toString())}
          />
        ) : (
          <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-sm text-theme-text-tertiary">
              Enter your current weight above to set your loss pace
            </p>
          </div>
        )}

        {/* Advanced Mode Fields - Hidden if Standard */}
        {useAdvancedMode && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-theme-text-primary">Advanced Biometrics</h4>
              <SelectField
                label=""
                value={measurementUnit}
                onChange={handleMeasurementUnitChange}
                options={[{ value: 'in', label: 'IN' }, { value: 'cm', label: 'CM' }]}
                className="w-24"
              />
            </div>
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
          </div>
        )}

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
          
          {useAdvancedMode && advancedResults ? (
            <AdvancedResultsView
              advancedResults={advancedResults}
              macroTargets={macroTargets}
              tdee={results.tdee}
              cuttingCalories={results.cuttingCalories}
              currentPhase={currentPhase}
            />
          ) : (
            <StandardResultsView
              bmr={results.bmr}
              tdee={results.tdee}
              cuttingCalories={results.cuttingCalories}
              currentPhase={currentPhase}
            />
          )}
        </div>
      )}
    </Card>
  );
}
