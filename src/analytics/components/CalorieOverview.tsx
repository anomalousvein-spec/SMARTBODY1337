import React, { memo } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Metrics } from "../../hooks/useMetrics";
import { Card } from "../../components";
import { getUserPhase } from "../../utils/calculations";

interface CalorieOverviewProps {
  metrics: Metrics | null;
}

export const CalorieOverview = memo(({ metrics }: CalorieOverviewProps) => {
  // Calculate dynamic phase based on user's TDEE settings
  const phase = getUserPhase(
    metrics?.currentWeight,
    metrics?.targetWeight,
    metrics?.targetLossRate,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="card-hover">
        <h3 className="text-lg font-bold text-theme-text-primary mb-4">
          Calorie Overview
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-theme-bg-tertiary/40 border border-white/5 rounded-xl transition-colors hover:bg-theme-bg-tertiary/60">
            <div className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
              Maintenance
            </div>
            <div className="text-xl font-bold text-theme-text-primary">
              {Math.round(metrics?.maintenanceCalories ?? 2000)}
            </div>
            <div className="text-[10px] font-bold text-theme-text-tertiary uppercase tracking-wide">
              cal/day
            </div>
          </div>
          <div
            className={`text-center p-4 ${phase.bgClass} border border-white/5 rounded-xl transition-colors`}
          >
            <div
              className={`text-[10px] font-black uppercase tracking-widest ${phase.colorClass} mb-1`}
            >
              {phase.label}
            </div>
            <div className={`text-xl font-bold ${phase.colorClass}`}>
              {Math.round(metrics?.cuttingCalories ?? 1500)}
            </div>
            <div
              className={`text-[10px] font-bold ${phase.colorClass} uppercase tracking-wide`}
            >
              cal/day
            </div>
          </div>
        </div>
        {metrics?.todayMacros && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">
                Today's Intake
              </span>
              <span className="text-lg font-bold text-theme-text-primary">
                {metrics.todayMacros.calories} cal
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">
                Protein
              </span>
              <span className="text-sm font-bold text-theme-text-primary">
                {metrics.todayMacros.protein}g
              </span>
            </div>
          </div>
        )}
        {!metrics?.todayMacros && (
          <div className="mt-4 p-3 bg-warning/10 rounded-xl border border-warning/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span className="text-[10px] font-black uppercase tracking-widest text-warning">
              No macros logged today
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
});
