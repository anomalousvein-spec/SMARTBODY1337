import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Metrics } from '../../hooks/useMetrics';
import { Card } from '../../components';

interface WeeklyAveragesProps {
  metrics: Metrics | null;
}

export const WeeklyAverages = memo(({ metrics }: WeeklyAveragesProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="card-hover">
        <h3 className="text-lg font-bold text-theme-text-primary mb-4">Weekly Averages</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">Avg Calories</span>
            <span className="font-bold text-theme-text-primary">{metrics?.weeklyAvgCalories ?? 0} cal</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">Avg Protein</span>
            <span className="font-bold text-theme-text-primary">{metrics?.weeklyAvgProtein ?? 0}g</span>
          </div>
          {metrics && metrics.weeklyAvgCalories > 0 && metrics.cuttingCalories > 0 && (
            <div className="pt-3 border-t border-white/5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">vs Target</span>
                <span className={`font-bold ${metrics.weeklyAvgCalories <= metrics.cuttingCalories ? 'text-success' : 'text-warning'}`}>
                  {metrics.weeklyAvgCalories > metrics.cuttingCalories ? '+' : ''}{metrics.weeklyAvgCalories - metrics.cuttingCalories} cal/day
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
});
