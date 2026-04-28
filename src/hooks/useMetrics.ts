import { useCallback, useMemo } from 'react';
import { WeightEntry, WaistEntry, MacroEntry } from '../db/models';
import { DEFAULT_USER_ID, INCHES_TO_CM, DEFAULT_MAINTENANCE_CALORIES, DEFAULT_CUTTING_CALORIES, MIN_CHECKINS_FOR_METABOLISM } from '../config/constants';
import { useWeights } from './useWeights';
import { useWaistMeasurements } from './useWaistMeasurements';
import { useMacroLogs } from './useMacroLogs';
import { useTDEESettings } from './useTDEESettings';
import { usePaceCoach } from './usePaceCoach';

export interface Metrics {
  latestWeight: WeightEntry | null;
  latestWaist: WaistEntry | null;
  weightChange: number;
  waistRatio: number;
  maintenanceCalories: number;
  cuttingCalories: number;
  todayMacros: MacroEntry | null;
  weeklyAvgCalories: number;
  weeklyAvgProtein: number;
  targetWeight?: number;
  targetLossRate?: number;
  currentWeight?: number;
  // Pace Coach calculated values (when available)
  paceCoachMaintenance?: number;
  paceCoachTarget?: number;
  hasPaceCoachData?: boolean;
  checkInCount?: number;
}

/**
 * Custom hook to fetch and calculate user metrics for the dashboard.
 * Composed of granular hooks for better modularity.
 */
export function useMetrics(userId: string = DEFAULT_USER_ID) {
  const { weights, isLoading: weightsLoading, refresh: refreshWeights } = useWeights(userId);
  const { measurements: waist, isLoading: waistLoading, refresh: refreshWaist } = useWaistMeasurements(userId);
  const { logs: macros, isLoading: macrosLoading, refresh: refreshMacros } = useMacroLogs(userId);
  const { settings, isLoading: settingsLoading, refresh: refreshSettings, error: settingsError } = useTDEESettings(userId);
  const { lastCheckIn, checkInCount } = usePaceCoach(userId);

  const isLoading = weightsLoading || waistLoading || macrosLoading || settingsLoading;

  const refresh = useCallback(async () => {
    await Promise.all([
      refreshWeights(),
      refreshWaist(),
      refreshMacros(),
      refreshSettings()
    ]);
  }, [refreshWeights, refreshWaist, refreshMacros, refreshSettings]);

  const metrics = useMemo<Metrics | null>(() => {
    if (isLoading) return null;

    const latestWeight = weights[weights.length - 1] || null;
    const latestWaist = waist[waist.length - 1] || null;

    // Calculate weight change this week
    let weightChange = 0;
    if (weights.length > 1) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekWeight = [...weights].reverse().find((w: WeightEntry) => new Date(w.date) <= lastWeek);
      if (lastWeekWeight && latestWeight) {
        weightChange = latestWeight.weight - lastWeekWeight.weight;
      }
    }

    // Calculate waist-to-height ratio
    let waistRatio = 0;
    if (latestWaist && settings?.height) {
      const h = settings.heightUnit === 'in' ? settings.height : settings.height / INCHES_TO_CM;
      const w = latestWaist.unit === 'in' ? latestWaist.measurement : latestWaist.measurement / INCHES_TO_CM;
      waistRatio = w / h;
    }

    // Today's macros
    const today = new Date().toISOString().split('T')[0];
    const todayMacros = macros.find((m: MacroEntry) => m.date.startsWith(today)) || null;

    // Weekly averages
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentMacros = macros.filter((m: MacroEntry) => new Date(m.date) >= last7Days);
    const weeklyAvgCalories = recentMacros.length > 0
      ? Math.round(recentMacros.reduce((sum: number, m: MacroEntry) => sum + m.calories, 0) / recentMacros.length)
      : 0;
    const weeklyAvgProtein = recentMacros.length > 0
      ? Math.round(recentMacros.reduce((sum: number, m: MacroEntry) => sum + m.protein, 0) / recentMacros.length)
      : 0;

    // Pace Coach calculated values (when sufficient data exists)
    const hasPaceCoachData = settings?.paceCoachEnabled && checkInCount >= MIN_CHECKINS_FOR_METABOLISM && lastCheckIn != null;
    const paceCoachMaintenance = hasPaceCoachData ? lastCheckIn!.calculatedTDEE : undefined;
    const paceCoachTarget = hasPaceCoachData ? settings.lastSuggestedIntake : undefined;

    return {
      latestWeight,
      latestWaist,
      weightChange,
      waistRatio,
      maintenanceCalories: settings?.tdee || DEFAULT_MAINTENANCE_CALORIES,
      cuttingCalories: settings?.cuttingCalories || DEFAULT_CUTTING_CALORIES,
      todayMacros,
      weeklyAvgCalories,
      weeklyAvgProtein,
      targetWeight: settings?.targetWeight,
      targetLossRate: settings?.targetLossRate,
      currentWeight: settings?.currentWeight,
      paceCoachMaintenance,
      paceCoachTarget,
      hasPaceCoachData,
      checkInCount
    };
  }, [weights, waist, macros, settings, isLoading, lastCheckIn, checkInCount]);

  return { metrics, isLoading, error: settingsError, refresh };
}
