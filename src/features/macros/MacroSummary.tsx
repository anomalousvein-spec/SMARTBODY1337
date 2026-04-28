import React from "react";
import { useMacroLogs } from "../../hooks/useMacroLogs";
import { useTDEESettings } from "../../hooks/useTDEESettings";
import { Card, Skeleton } from "../../components";
import { useApp } from "../../context/AppContext";
import {
  calculateAdvancedBMR,
  calculateAdvancedMacros,
  AdvancedMacroTargets,
} from "../../utils/calculations";
import { LBS_TO_KG, INCHES_TO_CM, KG_TO_LBS } from "../../config/constants";

export const MacroSummary = React.memo(function MacroSummary() {
  const { user } = useApp();
  const userId = user.id;
  const { logs, isLoading: logsLoading } = useMacroLogs(userId);
  const { settings, isLoading: settingsLoading } = useTDEESettings(userId);

  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((l) => l.date.startsWith(today));

  const totals = todayLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fats: acc.fats + log.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

  let advancedTargets: AdvancedMacroTargets | null = null;
  if (
    settings &&
    settings.calculationMode === "advanced" &&
    settings.waist &&
    settings.neck
  ) {
    const wKg =
      (settings.currentWeight || 0) *
      (settings.heightUnit === "in" ? LBS_TO_KG : 1);
    const hCm =
      settings.height * (settings.heightUnit === "in" ? INCHES_TO_CM : 1);
    const wCm =
      settings.measurementUnit === "in"
        ? settings.waist * INCHES_TO_CM
        : settings.waist;
    const nCm =
      settings.measurementUnit === "in"
        ? settings.neck * INCHES_TO_CM
        : settings.neck;
    const hiCm = settings.hip
      ? settings.measurementUnit === "in"
        ? settings.hip * INCHES_TO_CM
        : settings.hip
      : undefined;

    const adv = calculateAdvancedBMR(wKg, hCm, wCm, nCm, hiCm, settings.gender);
    const goalWeightLbs = settings.targetWeight
      ? settings.heightUnit === "cm"
        ? settings.targetWeight * KG_TO_LBS
        : settings.targetWeight
      : undefined;

    if (settings.tdee && settings.cuttingCalories) {
      advancedTargets = calculateAdvancedMacros(
        adv.leanBodyMass,
        goalWeightLbs,
        adv.bmr,
        settings.tdee,
        settings.cuttingCalories,
      );
    }
  }

  if (logsLoading || settingsLoading)
    return (
      <Card className="card-hover">
        <Skeleton className="h-48" />
      </Card>
    );

  return (
    <Card className="card-hover">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-theme-text-primary">
          Today's Summary
        </h2>
        {settings?.cuttingCalories && (
          <span className="text-xs font-bold text-theme-text-tertiary bg-theme-bg-tertiary/50 px-2 py-1 rounded-md">
            Goal: {Math.round(settings.cuttingCalories)} kcal
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-theme-bg-tertiary/40 border border-white/5 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
            Calories
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-theme-text-primary">
              {totals.calories}
            </p>
            {settings?.cuttingCalories && (
              <p className="text-[10px] text-theme-text-tertiary">
                / {Math.round(settings.cuttingCalories)}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 bg-theme-bg-tertiary/40 border border-white/5 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
            Protein
          </p>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-blue-400">
                {totals.protein}g
              </p>
              {advancedTargets && (
                <p className="text-[10px] text-theme-text-tertiary">
                  / {Math.round(advancedTargets.proteinMin)}g+
                </p>
              )}
            </div>
            {advancedTargets && (
              <p className="text-[8px] font-bold text-theme-text-tertiary uppercase tracking-tighter mt-1">
                Target: {Math.round(advancedTargets.proteinMin)}-
                {Math.round(advancedTargets.proteinMax)}g
              </p>
            )}
          </div>
        </div>

        <div className="p-4 bg-theme-bg-tertiary/40 border border-white/5 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
            Carbs
          </p>
          <p className="text-2xl font-bold text-success">{totals.carbs}g</p>
        </div>

        <div className="p-4 bg-theme-bg-tertiary/40 border border-white/5 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
            Fats
          </p>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-warning">{totals.fats}g</p>
              {advancedTargets && (
                <p className="text-[10px] text-theme-text-tertiary">
                  / {Math.round(advancedTargets.fatMin)}g+
                </p>
              )}
            </div>
            {advancedTargets && (
              <p className="text-[8px] font-bold text-theme-text-tertiary uppercase tracking-tighter mt-1">
                Floor: {Math.round(advancedTargets.fatMin)}g
              </p>
            )}
          </div>
        </div>
      </div>

      {advancedTargets && (
        <div className="mt-4 p-3 bg-theme-accent/5 border border-theme-accent/10 rounded-lg">
          <p className="text-[10px] text-theme-text-tertiary leading-tight">
            💡{" "}
            <span className="font-bold text-theme-accent">
              Advanced Strategy:
            </span>{" "}
            Focus on hitting your{" "}
            <span className="text-blue-400">Protein target</span> and{" "}
            <span className="text-warning">Fat floor</span>. The remaining{" "}
            <span className="text-theme-text-primary">
              {Math.round(advancedTargets.remainingCalories)} calories
            </span>{" "}
            can be distributed between Carbs and Fats based on your energy
            needs.
          </p>
        </div>
      )}
    </Card>
  );
});
