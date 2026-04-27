import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Metrics } from '../../hooks/useMetrics';
import { Card } from '../../components';

interface CalorieOverviewProps {
  metrics: Metrics | null;
}

export const CalorieOverview = memo(({ metrics }: CalorieOverviewProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className="card-hover">
        <h3 className="text-lg font-bold text-theme-text-primary mb-4">Calorie Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-theme-bg-tertiary/50 rounded-lg">
            <div className="text-xs text-theme-text-tertiary mb-1">Maintenance</div>
            <div className="text-xl font-bold text-theme-text-primary">{Math.round(metrics?.maintenanceCalories ?? 2000)}</div>
            <div className="text-xs text-theme-text-tertiary">cal/day</div>
          </div>
          <div className="text-center p-3 bg-theme-accent/10 rounded-lg">
            <div className="text-xs text-theme-accent mb-1">Cutting Target</div>
            <div className="text-xl font-bold text-theme-accent">{Math.round(metrics?.cuttingCalories ?? 1500)}</div>
            <div className="text-xs text-theme-accent">cal/day</div>
          </div>
        </div>
        {metrics?.todayMacros && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center"><span className="text-sm text-theme-text-tertiary">Today's Intake</span><span className="text-lg font-bold text-theme-text-primary">{metrics.todayMacros.calories} cal</span></div>
            <div className="flex justify-between items-center mt-2"><span className="text-sm text-theme-text-tertiary">Protein</span><span className="text-sm font-medium text-theme-text-primary">{metrics.todayMacros.protein}g</span></div>
          </div>
        )}
        {!metrics?.todayMacros && (
          <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-400" /><span className="text-sm text-yellow-700 dark:text-yellow-400">No macros logged today</span></div>
        )}
      </Card>
    </motion.div>
  );
});
