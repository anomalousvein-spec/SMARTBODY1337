import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Metrics } from '../../hooks/useMetrics';

interface WeeklyAveragesProps {
  metrics: Metrics | null;
}

/**
 * Optimized component for weekly average statistics
 */
export const WeeklyAverages = memo(({ metrics }: WeeklyAveragesProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass card-hover rounded-2xl p-5 shadow-xl"
    >
      <h3 className="text-lg font-bold text-theme-text-primary mb-4">
        Weekly Averages
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-theme-text-tertiary">Avg Calories</span>
          <span className="font-semibold text-theme-text-primary">
            {metrics?.weeklyAvgCalories ?? 0} cal
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-theme-text-tertiary">Avg Protein</span>
          <span className="font-semibold text-theme-text-primary">
            {metrics?.weeklyAvgProtein ?? 0}g
          </span>
        </div>
        {metrics && metrics.weeklyAvgCalories > 0 && metrics.cuttingCalories > 0 && (
          <div className="pt-3 border-t border-white/5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-theme-text-tertiary">vs Target</span>
              <span className={`font-medium ${
                metrics.weeklyAvgCalories <= metrics.cuttingCalories
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {metrics.weeklyAvgCalories > metrics.cuttingCalories ? '+' : ''}
                {metrics.weeklyAvgCalories - metrics.cuttingCalories} cal/day
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

WeeklyAverages.displayName = 'WeeklyAverages';
