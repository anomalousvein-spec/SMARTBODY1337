import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { Skeleton } from '../../components';

interface MacroSummaryProps {
  /** User ID for fetching logs */
  userId: string;
  /** Optional calorie target for comparison */
  targetCalories?: number;
  /** Optional protein target for comparison */
  targetProtein?: number;
  /** Optional carbs target for comparison */
  targetCarbs?: number;
  /** Optional fats target for comparison */
  targetFats?: number;
}

/**
 * Component providing weekly macro averages and distribution analysis
 */
export function MacroSummary({ 
  userId, 
  targetCalories, 
  targetProtein, 
  targetCarbs, 
  targetFats 
}: MacroSummaryProps) {
  const [weeklyAverages, setWeeklyAverages] = useState<{
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFats: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeeklyAverages() {
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const entries = await db.macro_logs
          .where('user_id')
          .equals(userId)
          .filter(entry => new Date(entry.date) >= oneWeekAgo)
          .toArray();

        if (entries.length > 0) {
          const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
          const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);
          const totalCarbs = entries.reduce((sum, e) => sum + e.carbs, 0);
          const totalFats = entries.reduce((sum, e) => sum + e.fats, 0);

          setWeeklyAverages({
            avgCalories: totalCalories / entries.length,
            avgProtein: totalProtein / entries.length,
            avgCarbs: totalCarbs / entries.length,
            avgFats: totalFats / entries.length,
          });
        }
      } catch (err) {
        console.error('Error loading macro averages:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWeeklyAverages();
  }, [userId]);

  if (loading) {
    return (
      <div className="glass card-hover rounded-2xl p-6 shadow-xl">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!weeklyAverages) {
    return (
      <div className="glass card-hover rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-theme-text-primary mb-4">
          Weekly Macro Summary
        </h2>
        <p className="text-center text-theme-text-tertiary py-8">No data logged this week yet.</p>
      </div>
    );
  }

  // Calculate percentages of targets
  const caloriePercent = targetCalories ? (weeklyAverages.avgCalories / targetCalories * 100).toFixed(1) : null;
  const proteinPercent = targetProtein ? (weeklyAverages.avgProtein / targetProtein * 100).toFixed(1) : null;
  const carbsPercent = targetCarbs ? (weeklyAverages.avgCarbs / targetCarbs * 100).toFixed(1) : null;
  const fatsPercent = targetFats ? (weeklyAverages.avgFats / targetFats * 100).toFixed(1) : null;

  return (
    <div className="glass card-hover rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        Weekly Macro Summary
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-theme-accent/10 rounded-lg p-4">
          <p className="text-sm text-theme-text-tertiary mb-1">Avg Calories</p>
          <p className="text-2xl font-bold text-theme-accent">
            {Math.round(weeklyAverages.avgCalories)}
          </p>
          {caloriePercent && (
            <p className={`text-xs mt-1 ${parseFloat(caloriePercent) > 100 ? 'text-red-500' : 'text-green-500'}`}>
              {caloriePercent}% of target ({targetCalories})
            </p>
          )}
        </div>

        <div className="bg-purple-500/10 rounded-lg p-4">
          <p className="text-sm text-theme-text-tertiary mb-1">Avg Protein</p>
          <p className="text-2xl font-bold text-purple-400">
            {Math.round(weeklyAverages.avgProtein)}g
          </p>
          {proteinPercent && (
            <p className={`text-xs mt-1 ${parseFloat(proteinPercent) < 100 ? 'text-orange-500' : 'text-green-500'}`}>
              {proteinPercent}% of target ({targetProtein}g)
            </p>
          )}
        </div>

        <div className="bg-green-500/10 rounded-lg p-4">
          <p className="text-sm text-theme-text-tertiary mb-1">Avg Carbs</p>
          <p className="text-2xl font-bold text-green-400">
            {Math.round(weeklyAverages.avgCarbs)}g
          </p>
          {carbsPercent && (
            <p className="text-xs mt-1 text-theme-text-tertiary">
              {carbsPercent}% of target ({targetCarbs}g)
            </p>
          )}
        </div>

        <div className="bg-yellow-500/10 rounded-lg p-4">
          <p className="text-sm text-theme-text-tertiary mb-1">Avg Fats</p>
          <p className="text-2xl font-bold text-yellow-400">
            {Math.round(weeklyAverages.avgFats)}g
          </p>
          {fatsPercent && (
            <p className="text-xs mt-1 text-theme-text-tertiary">
              {fatsPercent}% of target ({targetFats}g)
            </p>
          )}
        </div>
      </div>

      {/* Macro Distribution Pie Chart Placeholder */}
      <div className="mt-6 pt-6 border-t border-white/5">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
          Macro Distribution
        </h3>
        <div className="flex items-center justify-center space-x-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-green-500 to-yellow-500 relative shadow-inner" role="img" aria-label="Macro distribution chart showing protein, carbs, and fats">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm drop-shadow-md">7d Avg</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm text-theme-text-tertiary">
                Protein: {Math.round((weeklyAverages.avgProtein * 4) / ((weeklyAverages.avgProtein * 4) + (weeklyAverages.avgCarbs * 4) + (weeklyAverages.avgFats * 9)) * 100)}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm text-theme-text-tertiary">
                Carbs: {Math.round((weeklyAverages.avgCarbs * 4) / ((weeklyAverages.avgProtein * 4) + (weeklyAverages.avgCarbs * 4) + (weeklyAverages.avgFats * 9)) * 100)}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-theme-text-tertiary">
                Fats: {Math.round((weeklyAverages.avgFats * 9) / ((weeklyAverages.avgProtein * 4) + (weeklyAverages.avgCarbs * 4) + (weeklyAverages.avgFats * 9)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
