import { useState, useCallback, useEffect, useMemo } from 'react';
import { db } from '../db/database';
import { WeightEntry, WaistEntry, MacroEntry, TDEESettings } from '../db/models';
import { DEFAULT_USER_ID, INCHES_TO_CM, DEFAULT_MAINTENANCE_CALORIES, DEFAULT_CUTTING_CALORIES } from '../config/constants';

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
}

/**
 * Custom hook to fetch and calculate user metrics for the dashboard.
 * Optimized to minimize re-computations via useMemo and efficient data processing.
 * @param userId - The ID of the user
 * @returns Object containing metrics, loading state, error, and refresh function
 */
export function useMetrics(userId: string = DEFAULT_USER_ID) {
  const [data, setData] = useState<{
    weights: WeightEntry[];
    waist: WaistEntry[];
    settings: TDEESettings | undefined;
    macros: MacroEntry[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [weights, waist, settings, macros] = await Promise.all([
        db.weights.where('user_id').equals(userId).reverse().toArray(),
        db.waist_measurements.where('user_id').equals(userId).reverse().toArray(),
        db.tdee_settings.get('global'),
        db.macro_logs.where('user_id').equals(userId).reverse().toArray()
      ]);

      setData({ weights, waist, settings, macros });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('Error loading analytics:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo<Metrics | null>(() => {
    if (!data) return null;

    const { weights, waist, settings, macros } = data;
    const latestWeight = weights[0] || null;
    const latestWaist = waist[0] || null;

    // Calculate weight change this week
    let weightChange = 0;
    if (weights.length > 1) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekWeight = weights.find(w => new Date(w.date) <= lastWeek);
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
    const todayMacros = macros.find(m => m.date.startsWith(today)) || null;

    // Weekly averages
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentMacros = macros.filter(m => new Date(m.date) >= last7Days);
    const weeklyAvgCalories = recentMacros.length > 0
      ? Math.round(recentMacros.reduce((sum, m) => sum + m.calories, 0) / recentMacros.length)
      : 0;
    const weeklyAvgProtein = recentMacros.length > 0
      ? Math.round(recentMacros.reduce((sum, m) => sum + m.protein, 0) / recentMacros.length)
      : 0;

    return {
      latestWeight,
      latestWaist,
      weightChange,
      waistRatio,
      maintenanceCalories: settings?.tdee || DEFAULT_MAINTENANCE_CALORIES,
      cuttingCalories: settings?.cuttingCalories || DEFAULT_CUTTING_CALORIES,
      todayMacros,
      weeklyAvgCalories,
      weeklyAvgProtein
    };
  }, [data]);

  return { metrics, isLoading, error, refresh: loadData };
}
