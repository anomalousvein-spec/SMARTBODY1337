import React, { useState, useEffect } from "react";
import { Card, Skeleton } from "../../components";
import {
  InputField,
  SelectField,
  FormMessage,
  SubmitButton,
} from "../../components/Form";
import {
  calculateBMR,
  calculateTDEE,
  calculateAdvancedBMR,
  calculateAdvancedMacros,
  AdvancedBMRResult,
  AdvancedMacroTargets,
  getUserPhase,
} from "../../utils/calculations";
import {
  ACTIVITY_MULTIPLIERS,
  INCHES_TO_CM,
  LBS_TO_KG,
  KG_TO_LBS,
  MIN_AGE,
  MAX_AGE,

} from "../../config/constants";
import {
  validateAge,
  validateWeight,
  validateHeight,
} from "../../utils/validation";
import { useTDEESettings } from "../../hooks/useTDEESettings";
import { TDEESettings } from "../../db/models";
import { PaceCoachSettings } from "../pace-coach/PaceCoachSettings";
import { AdvancedResultsView } from "./components/AdvancedResultsView";
import { StandardResultsView } from "./components/StandardResultsView";
import { useApp } from "../../context/AppContext";
import { calculatePercentageLoss } from "../../utils/percentageLoss";
import { PercentageLossSlider } from "../../components/Form/PercentageLossSlider";

export function TDEECalculator() {
  const { user } = useApp();
  const userId = user.id;
  const {
    settings: fullSettings,
    isLoading,
    updateSettings,
  } = useTDEESettings(userId);

  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"in" | "cm">("in");
  const [weight, setWeight] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">("lbs");
  const [activityLevel, setActivityLevel] =
    useState<TDEESettings["activityLevel"]>("moderately_active");
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [targetLossRate, setTargetLossRate] = useState<string>("0.5");

  // Advanced Mode State
  const [useAdvancedMode, setUseAdvancedMode] = useState(false);
  const [waist, setWaist] = useState<string>("");
  const [neck, setNeck] = useState<string>("");
  const [hip, setHip] = useState<string>("");
  const [measurementUnit, setMeasurementUnit] = useState<"in" | "cm">("in");

  const [results, setResults] = useState<{
    bmr: number;
    tdee: number;
    cuttingCalories: number;
  } | null>(null);
  const [advancedResults, setAdvancedResults] =
    useState<AdvancedBMRResult | null>(null);
  const [macroTargets, setMacroTargets] = useState<AdvancedMacroTargets | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Live calculation for the slider safety checks
  const weightValue = parseFloat(weight) || 0;
  const heightValue = parseFloat(height) || 0;
  const ageValue = parseInt(age) || 30;

  const liveBmr = calculateBMR(
    weightUnit === "lbs" ? weightValue * LBS_TO_KG : weightValue,
    heightUnit === "in" ? heightValue * INCHES_TO_CM : heightValue,
    ageValue,
    gender,
  );
  const liveTdee = calculateTDEE(liveBmr, activityLevel);

  useEffect(() => {
    if (fullSettings) {
      setAge(fullSettings.age.toString());
      setGender(fullSettings.gender);
      setHeight(fullSettings.height.toString());
      setHeightUnit(fullSettings.heightUnit || "in");
      setWeight(fullSettings.currentWeight?.toString() || "");
      setWeightUnit(fullSettings.weightUnit || "lbs");
      setActivityLevel(fullSettings.activityLevel);
      setTargetWeight(fullSettings.targetWeight?.toString() || "");
      setTargetLossRate(fullSettings.targetLossRate?.toString() || "0.5");
      setUseAdvancedMode(fullSettings.calculationMode === "advanced");
      setWaist(fullSettings.waist?.toString() || "");
      setNeck(fullSettings.neck?.toString() || "");
      setHip(fullSettings.hip?.toString() || "");
      setMeasurementUnit(fullSettings.measurementUnit || "in");

      setResults({
        bmr: fullSettings.bmr || 0,
        tdee: fullSettings.tdee || 0,
        cuttingCalories: fullSettings.cuttingCalories || 0,
      });
    }
  }, [fullSettings]);

  const handleHeightUnitChange = (val: string) => {
    const newUnit = val as "in" | "cm";
    if (newUnit === heightUnit) return;

    const currentHeight = parseFloat(height);
    if (!isNaN(currentHeight)) {
      const converted =
        newUnit === "cm"
          ? (currentHeight * INCHES_TO_CM).toFixed(1)
          : (currentHeight / INCHES_TO_CM).toFixed(1);
      setHeight(converted);
    }
    setHeightUnit(newUnit);
  };

  const handleWeightUnitChange = (val: string) => {
    const newUnit = val as "lbs" | "kg";
    if (newUnit === weightUnit) return;

    const currentWeight = parseFloat(weight);
    if (!isNaN(currentWeight)) {
      const converted =
        newUnit === "kg"
          ? (currentWeight * LBS_TO_KG).toFixed(1)
          : (currentWeight / LBS_TO_KG).toFixed(1);
      setWeight(converted);
    }

    const currentTarget = parseFloat(targetWeight);
    if (!isNaN(currentTarget)) {
      const converted =
        newUnit === "kg"
          ? (currentTarget * LBS_TO_KG).toFixed(1)
          : (currentTarget / LBS_TO_KG).toFixed(1);
      setTargetWeight(converted);
    }

    setWeightUnit(newUnit);
  };

  const handleMeasurementUnitChange = (val: string) => {
    const newUnit = val as "in" | "cm";
    if (newUnit === measurementUnit) return;

    const convert = (v: string) => {
      const num = parseFloat(v);
      if (isNaN(num)) return "";
      return newUnit === "cm"
        ? (num * INCHES_TO_CM).toFixed(1)
        : (num / INCHES_TO_CM).toFixed(1);
    };

    setWaist(convert(waist));
    setNeck(convert(neck));
    setHip(convert(hip));
    setMeasurementUnit(newUnit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Strict Validation
    const ageVal = validateAge(age);
    if (!ageVal.valid) {
      setError(ageVal.error!);
      return;
    }

    const weightValRes = validateWeight(weightUnit === "kg" ? (parseFloat(weight) * KG_TO_LBS).toString() : weight);
    if (!weightValRes.valid) {
      setError(weightValRes.error!);
      return;
    }

    const heightValRes = validateHeight(height, heightUnit);
    if (!heightValRes.valid) {
      setError(heightValRes.error!);
      return;
    }

    setIsSaving(true);

    try {
      const weightValue = parseFloat(weight);
      const heightValue = parseFloat(height);
      const ageValue = parseInt(age);
      const targetWeightValue = parseFloat(targetWeight) || undefined;
      const targetLossRateValue = parseFloat(targetLossRate);

      const weightKg = weightUnit === "lbs" ? weightValue * LBS_TO_KG : weightValue;
      const heightCm = heightUnit === "in" ? heightValue * INCHES_TO_CM : heightValue;

      let bmr: number;
      let advResults: AdvancedBMRResult | null = null;

      if (useAdvancedMode) {
        const waistValue = parseFloat(waist);
        const neckValue = parseFloat(neck);
        const hipValue = parseFloat(hip);

        const waistCm = measurementUnit === "in" ? waistValue * INCHES_TO_CM : waistValue;
        const neckCm = measurementUnit === "in" ? neckValue * INCHES_TO_CM : neckValue;
        const hipCm =
          hipValue !== undefined && hipValue > 0
            ? measurementUnit === "in"
              ? hipValue * INCHES_TO_CM
              : hipValue
            : undefined;

        advResults = calculateAdvancedBMR(
          weightKg,
          heightCm,
          waistCm,
          neckCm,
          hipCm,
          gender,
        );
        bmr = advResults.bmr;
      } else {
        bmr = calculateBMR(weightKg, heightCm, ageValue, gender);
      }

      const tdee = calculateTDEE(bmr, activityLevel);

      const lossResults = calculatePercentageLoss(
        weightValue,
        weightUnit,
        targetLossRateValue,
        tdee,
        bmr,
        gender,
      );
      const targetCalories = Math.round(lossResults.proposedIntake);

      let macroTargetsResult: AdvancedMacroTargets | null = null;
      if (advResults && useAdvancedMode) {
        const goalWeightLbs = targetWeightValue
          ? weightUnit === "kg"
            ? targetWeightValue * KG_TO_LBS
            : targetWeightValue
          : undefined;

        macroTargetsResult = calculateAdvancedMacros(
          advResults.leanBodyMass,
          goalWeightLbs,
          bmr,
          tdee,
          targetCalories,
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
        calculationMode: useAdvancedMode ? "advanced" : "standard",
        waist: useAdvancedMode ? parseFloat(waist) : undefined,
        neck: useAdvancedMode ? parseFloat(neck) : undefined,
        hip:
          useAdvancedMode && gender === "female" ? parseFloat(hip) : undefined,
        measurementUnit: useAdvancedMode ? measurementUnit : undefined,
      });

      setSuccess(true);
      setResults({ bmr, tdee, cuttingCalories: targetCalories });
      setAdvancedResults(advResults);
      setMacroTargets(macroTargetsResult);
    } catch (err) {
      console.error("Failed to save TDEE settings:", err);
      setError("Failed to save settings.");
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
    fullSettings?.targetLossRate,
  );

  return (
    <Card>
      <h2 className="text-xl font-bold text-theme-text-primary mb-6">
        TDEE & Profile Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="flex p-1 bg-theme-bg-tertiary/50 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setUseAdvancedMode(false)}
            className={cn("flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300", !useAdvancedMode ? "bg-theme-accent text-white shadow-lg shadow-theme-accent/20" : "text-theme-text-tertiary hover:text-theme-text-primary hover:bg-white/5")}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setUseAdvancedMode(true)}
            className={cn("flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300", useAdvancedMode ? "bg-theme-accent text-white shadow-lg shadow-theme-accent/20" : "text-theme-text-tertiary hover:text-theme-text-primary hover:bg-white/5")}
          >
            Advanced
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Age"
            type="number"
            value={age}
            onChange={setAge}
            min={MIN_AGE}
            max={MAX_AGE}
            required
            error={error && error.includes("Age") ? error : undefined}
          />
          <SelectField
            label="Gender"
            value={gender}
            onChange={(val) => setGender(val as "male" | "female")}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Height"
            type="number"
            value={height}
            onChange={setHeight}
            step="0.1"
            required
            error={error && error.includes("Height") ? error : undefined}
          />
          <SelectField
            label="Unit"
            value={heightUnit}
            onChange={handleHeightUnitChange}
            options={[
              { value: "in", label: "inches" },
              { value: "cm", label: "cm" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Current Weight"
            type="number"
            value={weight}
            onChange={setWeight}
            step="0.1"
            required
            error={error && error.includes("Weight") ? error : undefined}
          />
          <SelectField
            label="Unit"
            value={weightUnit}
            onChange={handleWeightUnitChange}
            options={[
              { value: "lbs", label: "lbs" },
              { value: "kg", label: "kg" },
            ]}
          />
        </div>

        <SelectField
          label="Activity Level"
          value={activityLevel}
          onChange={(val) =>
            setActivityLevel(val as TDEESettings["activityLevel"])
          }
          options={Object.keys(ACTIVITY_MULTIPLIERS).map(k => ({ value: k, label: k.replace(/_/g, " ") }))}
        />

        <div className="grid grid-cols-1 gap-4">
          <InputField
            label="Target Weight (optional)"
            type="number"
            value={targetWeight}
            onChange={setTargetWeight}
            step="0.1"
            placeholder="160"
          />
        </div>

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

        {useAdvancedMode && (
          <div className="mt-4 p-5 rounded-2xl bg-theme-bg-tertiary/40 border border-white/5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">
                Advanced Biometrics
              </h4>
              <SelectField
                label=""
                value={measurementUnit}
                onChange={handleMeasurementUnitChange}
                options={[
                  { value: "in", label: "IN" },
                  { value: "cm", label: "CM" },
                ]}
                className="w-24"
              />
            </div>
            <p className="text-[11px] font-medium text-theme-text-tertiary leading-relaxed italic">
              💡 Uses Lean Body Mass (LBM) to calculate BMR. Best for users with
              higher-than-average muscle mass.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Waist (at navel)"
                type="number"
                value={waist}
                onChange={setWaist}
                step="0.1"
                required
                placeholder={measurementUnit === "in" ? "e.g., 34" : "e.g., 86"}
              />
              <InputField
                label="Neck (below Adam's apple)"
                type="number"
                value={neck}
                onChange={setNeck}
                step="0.1"
                required
                placeholder={measurementUnit === "in" ? "e.g., 15" : "e.g., 38"}
              />
            </div>

            {gender === "female" && (
              <InputField
                label="Hip (at widest point)"
                type="number"
                value={hip}
                onChange={setHip}
                step="0.1"
                required
                placeholder={measurementUnit === "in" ? "e.g., 38" : "e.g., 97"}
              />
            )}
          </div>
        )}

        {error && <FormMessage type="error" message={error} />}
        {success && <FormMessage type="success" message="Profile updated!" />}

        <SubmitButton
          isSubmitting={isSaving}
          idleText={fullSettings ? "Update Profile" : "Calculate TDEE"}
        />

        {fullSettings && (
          <PaceCoachSettings
            settings={fullSettings}
            onUpdate={(updated: Partial<TDEESettings>) => updateSettings(updated)}
          />
        )}
      </form>

      {results && (
        <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-6 ml-1">
            Your Results
          </h3>

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
