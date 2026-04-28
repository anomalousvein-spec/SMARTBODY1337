import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';
import { Metrics } from '../../hooks/useMetrics';
import { Card } from '../../components';
import { useTDEESettings } from '../../hooks/useTDEESettings';
import { useApp } from '../../context/AppContext';

interface PaceCoachRecommendationsProps {
  metrics: Metrics | null;
}

export const PaceCoachRecommendations = ({ metrics }: PaceCoachRecommendationsProps) => {
  const { user } = useApp();
  const { updateSettings } = useTDEESettings(user.id);

  if (!metrics || !metrics.hasPaceCoachData) return null;
  if (metrics.paceCoachMaintenance === undefined || metrics.paceCoachTarget === undefined) return null;

  const handleApplyTargets = async () => {
    try {
      await updateSettings({
        tdee: Math.round(metrics.paceCoachMaintenance!),
        cuttingCalories: Math.round(metrics.paceCoachTarget!)
      });
    } catch (error) {
      console.error('Failed to apply Pace Coach targets:', error);
    }
  };

  // Calculate difference between TDEE and Pace Coach maintenance
  const tdeeDiff = metrics.paceCoachMaintenance - metrics.maintenanceCalories;
  const targetDiff = metrics.paceCoachTarget - metrics.cuttingCalories;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="card-hover overflow-hidden relative group border-theme-accent/30">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-theme-accent/20 to-theme-accent/10">
              <Sparkles className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-theme-text-primary">Pace Coach Recommendations</h3>
              <p className="text-[10px] text-theme-text-tertiary uppercase tracking-wider font-semibold">Based on Your Actual Data</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Main Recommendations Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Maintenance Calories */}
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wide">Maintenance</span>
                </div>
                <div className="text-2xl font-black text-theme-text-primary">
                  {Math.round(metrics.paceCoachMaintenance)}
                  <span className="text-xs font-medium text-theme-text-tertiary ml-1">kcal</span>
                </div>
                {tdeeDiff !== 0 && (
                  <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${tdeeDiff > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                    {tdeeDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {tdeeDiff > 0 ? '+' : ''}{Math.round(tdeeDiff)} vs TDEE
                  </div>
                )}
              </div>

              {/* Target Calories */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">Target</span>
                </div>
                <div className="text-2xl font-black text-theme-text-primary">
                  {Math.round(metrics.paceCoachTarget)}
                  <span className="text-xs font-medium text-theme-text-tertiary ml-1">kcal</span>
                </div>
                {targetDiff !== 0 && (
                  <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${targetDiff > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                    {targetDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {targetDiff > 0 ? '+' : ''}{Math.round(targetDiff)} vs current
                  </div>
                )}
              </div>
            </div>

            {/* Current TDEE Calculator Values for Comparison */}
            <div className="bg-theme-bg-tertiary/30 rounded-xl p-3 border border-theme-bg-border/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-2">Current Plan (TDEE Formula)</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-theme-text-secondary">Maintenance:</span>
                <span className="font-bold text-theme-text-primary">{Math.round(metrics.maintenanceCalories)} kcal</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-theme-text-secondary">Target:</span>
                <span className="font-bold text-theme-text-primary">{Math.round(metrics.cuttingCalories)} kcal</span>
              </div>
            </div>

            {/* Educational Message */}
            <div className="bg-gradient-to-br from-theme-accent/5 to-transparent rounded-xl p-3 border border-theme-accent/20">
              <p className="text-xs text-theme-text-secondary leading-relaxed">
                <strong className="text-theme-text-primary">Why different?</strong> These values are calculated from your actual weight trend and calorie logs, providing a personalized estimate of your true metabolism rather than a formula-based guess.
              </p>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplyTargets}
              className="w-full py-3 px-4 bg-gradient-to-r from-theme-accent to-theme-accent/80 hover:from-theme-accent/90 hover:to-theme-accent/70 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-theme-accent/20"
            >
              Apply These Targets
            </button>
            
            <p className="text-[9px] text-theme-text-tertiary text-center">
              This will update your maintenance and target calories to match Pace Coach's recommendations
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
