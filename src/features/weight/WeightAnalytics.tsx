import React, { useMemo } from 'react';
import { calculateMovingAverage } from '../../utils/calculations';
import { MOVING_AVERAGE_DAYS } from '../../config/constants';
import { useWeights } from '../../hooks/useWeights';
import { Card, Skeleton } from '../../components';
import { WeightEntry } from '../../db/models';
import { useApp } from '../../context/AppContext';
import { useTDEESettings } from '../../hooks/useTDEESettings';

export function WeightAnalytics() {
  const { user } = useApp();
  const userId = user.id;
  const { weights, isLoading: weightsLoading } = useWeights(userId);
  const { settings, isLoading: settingsLoading } = useTDEESettings(userId);

  const targetWeight = settings?.targetWeight;

  const analytics = useMemo(() => {
    if (weights.length === 0) return null;
    const startWeight = weights[0].weight;
    const currentWeight = weights[weights.length - 1].weight;
    const totalLoss = startWeight - currentWeight;
    const daysDiff = Math.max(1, (new Date(weights[weights.length - 1].date).getTime() - new Date(weights[0].date).getTime()) / (1000 * 60 * 60 * 24));
    const weeklyAvgLoss = totalLoss / (daysDiff / 7);
    const weightValues = weights.map((w: WeightEntry) => w.weight);
    const weeklyMA = calculateMovingAverage(weightValues, MOVING_AVERAGE_DAYS);
    return {
      startWeight, currentWeight, totalLoss, weeklyAvgLoss,
      currentWeeklyMA: weeklyMA[weeklyMA.length - 1],
      projectedWeeks: targetWeight && weeklyAvgLoss > 0 ? Math.ceil((currentWeight - targetWeight) / weeklyAvgLoss) : null,
      entriesCount: weights.length,
    };
  }, [weights, targetWeight]);

  if (weightsLoading || settingsLoading) return <Card className="card-hover"><Skeleton className="h-48" /></Card>;
  if (!analytics) return <Card className="card-hover"><p className="text-center text-theme-text-tertiary py-8">Log your first weight to see analytics!</p></Card>;

  const isPositiveProgress = analytics.totalLoss >= 0;

  return (
    <Card className="card-hover">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">Weight Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Start</p>
          <p className="text-2xl font-bold text-theme-text-primary">{analytics.startWeight.toFixed(1)}<span className="text-sm font-normal text-theme-text-tertiary ml-1">lbs</span></p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Current</p>
          <p className="text-2xl font-bold text-theme-text-primary">{analytics.currentWeight.toFixed(1)}<span className="text-sm font-normal text-theme-text-tertiary ml-1">lbs</span></p>
        </div>
        <div className={`p-4 rounded-lg ${isPositiveProgress ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-500/10'}`}>
          <p className="text-sm text-theme-text-tertiary mb-1">Change</p>
          <p className={`text-2xl font-bold ${isPositiveProgress ? 'text-green-600 dark:text-green-400' : 'text-red-400'}`}>{isPositiveProgress ? '-' : '+'}{Math.abs(analytics.totalLoss).toFixed(1)}<span className="text-sm font-normal ml-1">lbs</span></p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Weekly Avg</p>
          <p className="text-2xl font-bold text-theme-accent">{analytics.weeklyAvgLoss.toFixed(2)}<span className="text-sm font-normal text-theme-text-tertiary ml-1">lbs/wk</span></p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">7D Avg</p>
          <p className="text-2xl font-bold text-theme-text-primary">{analytics.currentWeeklyMA.toFixed(1)}<span className="text-sm font-normal text-theme-text-tertiary ml-1">lbs</span></p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Entries</p>
          <p className="text-2xl font-bold text-theme-text-primary">{analytics.entriesCount}</p>
        </div>
      </div>
      {targetWeight && analytics.projectedWeeks !== null && (
        <div className="mt-4 p-4 bg-theme-accent/10 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Projected Weeks to Goal ({targetWeight} lbs)</p>
          <p className="text-2xl font-bold text-theme-accent">{analytics.projectedWeeks}<span className="text-sm font-normal text-theme-text-tertiary ml-1">weeks</span></p>
        </div>
      )}
    </Card>
  );
}
