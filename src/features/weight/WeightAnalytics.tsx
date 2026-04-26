import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../db/database';
import { WeightEntry } from '../../db/models';
import { calculateMovingAverage } from '../../utils/calculations';
import { MOVING_AVERAGE_DAYS, MONTHLY_AVERAGE_DAYS } from '../../config/constants';
import { Skeleton } from '../../components';

interface WeightAnalyticsProps {
  /** User ID for fetching weights */
  userId: string;
  /** Optional target weight for projection */
  targetWeight?: number;
}

/**
 * Component providing detailed weight loss/gain analytics and projections
 */
export function WeightAnalytics({ userId, targetWeight }: WeightAnalyticsProps) {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeights = async () => {
      try {
        const results = await db.weights
          .where('user_id')
          .equals(userId)
          .toArray();
        
        // Sort by date ascending
        const sorted = results.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setWeights(sorted);
      } catch (error) {
        console.error('Error loading weights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeights();
  }, [userId]);

  const analytics = useMemo(() => {
    if (weights.length === 0) {
      return null;
    }

    const startWeight = weights[0].weight;
    const currentWeight = weights[weights.length - 1].weight;
    const totalLoss = startWeight - currentWeight;
    
    // Calculate weekly average loss
    const firstDate = new Date(weights[0].date);
    const lastDate = new Date(weights[weights.length - 1].date);
    const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksDiff = daysDiff / 7;
    const weeklyAvgLoss = totalLoss / weeksDiff;

    // Calculate moving averages
    const weightValues = weights.map(w => w.weight);
    const weeklyMA = calculateMovingAverage(weightValues, MOVING_AVERAGE_DAYS);
    const monthlyMA = calculateMovingAverage(weightValues, MONTHLY_AVERAGE_DAYS);
    const currentWeeklyMA = weeklyMA[weeklyMA.length - 1];
    const currentMonthlyMA = monthlyMA[monthlyMA.length - 1];

    // Project timeline to target
    let projectedWeeks: number | null = null;
    if (targetWeight && weeklyAvgLoss > 0) {
      const remainingLoss = currentWeight - targetWeight;
      projectedWeeks = Math.ceil(remainingLoss / weeklyAvgLoss);
    }

    return {
      startWeight,
      currentWeight,
      totalLoss,
      weeklyAvgLoss,
      currentWeeklyMA,
      currentMonthlyMA,
      projectedWeeks,
      entriesCount: weights.length,
    };
  }, [weights, targetWeight]);

  if (isLoading) {
    return (
      <div className="glass card-hover rounded-2xl p-6 shadow-xl">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass card-hover rounded-2xl p-6 shadow-xl">
        <p className="text-center text-theme-text-tertiary py-8">
          Log your first weight to see analytics!
        </p>
      </div>
    );
  }

  const isPositiveProgress = analytics.totalLoss >= 0;

  return (
    <div className="glass card-hover rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        Weight Analytics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Start Weight */}
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Start Weight</p>
          <p className="text-2xl font-bold text-theme-text-primary">
            {analytics.startWeight.toFixed(1)}
            <span className="text-sm font-normal text-theme-text-tertiary ml-1">lbs</span>
          </p>
        </div>

        {/* Current Weight */}
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Current Weight</p>
          <p className="text-2xl font-bold text-theme-text-primary">
            {analytics.currentWeight.toFixed(1)}
            <span className="text-sm font-normal text-theme-text-tertiary ml-1">lbs</span>
          </p>
        </div>

        {/* Total Loss/Gain */}
        <div className={`p-4 rounded-lg ${
          isPositiveProgress 
            ? 'bg-green-50 dark:bg-green-900/20' 
            : 'bg-red-500/10'
        }`}>
          <p className="text-sm text-theme-text-tertiary mb-1">Total Change</p>
          <p className={`text-2xl font-bold ${
            isPositiveProgress 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-400'
          }`}>
            {isPositiveProgress ? '-' : '+'}{Math.abs(analytics.totalLoss).toFixed(1)}
            <span className="text-sm font-normal ml-1">lbs</span>
          </p>
        </div>

        {/* Weekly Average */}
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Weekly Avg Loss</p>
          <p className="text-2xl font-bold text-theme-accent">
            {analytics.weeklyAvgLoss.toFixed(2)}
            <span className="text-sm font-normal text-theme-text-tertiary ml-1">lbs/wk</span>
          </p>
        </div>

        {/* MOVING_AVERAGE_DAYS-Day Moving Average */}
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">{MOVING_AVERAGE_DAYS}-Day Average</p>
          <p className="text-2xl font-bold text-theme-text-primary">
            {analytics.currentWeeklyMA.toFixed(1)}
            <span className="text-sm font-normal text-theme-text-tertiary ml-1">lbs</span>
          </p>
        </div>

        {/* Entries Count */}
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Total Entries</p>
          <p className="text-2xl font-bold text-theme-text-primary">
            {analytics.entriesCount}
          </p>
        </div>
      </div>

      {/* Target Projection */}
      {targetWeight && analytics.projectedWeeks !== null && (
        <div className="mt-4 p-4 bg-theme-accent/10 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">
            Projected Time to Goal ({targetWeight} lbs)
          </p>
          <p className="text-2xl font-bold text-theme-accent">
            {analytics.projectedWeeks}
            <span className="text-sm font-normal text-theme-text-tertiary ml-1">weeks</span>
          </p>
        </div>
      )}
    </div>
  );
}
