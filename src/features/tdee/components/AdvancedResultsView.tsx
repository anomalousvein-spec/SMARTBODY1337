import React from 'react';
import { AdvancedBMRResult, AdvancedMacroTargets, PhaseInfo, getWaistToHeightCategory } from '../../../utils/calculations';
import { KG_TO_LBS } from '../../../config/constants';

interface AdvancedResultsViewProps {
  advancedResults: AdvancedBMRResult;
  macroTargets: AdvancedMacroTargets | null;
  tdee: number;
  cuttingCalories: number;
  currentPhase: PhaseInfo;
}

export function AdvancedResultsView({
  advancedResults,
  macroTargets,
  tdee,
  cuttingCalories,
  currentPhase
}: AdvancedResultsViewProps) {
  const whtCategory = getWaistToHeightCategory(advancedResults.waistToHeightRatio);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-theme-bg-tertiary/30 border border-white/5 rounded-xl">
        <h4 className="text-sm font-semibold text-theme-text-primary mb-3">Advanced Composition Results</h4>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-2">Body Composition</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Estimated Body Fat</p>
                <p className="text-lg font-bold text-theme-accent">{advancedResults.avgBodyFat.toFixed(1)}% <span className="text-[10px] font-normal text-theme-text-tertiary">(Composite)</span></p>
              </div>
              <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Lean Body Mass</p>
                <p className="text-lg font-bold text-success">{(advancedResults.leanBodyMass * KG_TO_LBS).toFixed(1)} lbs</p>
              </div>
              <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Waist-to-Height</p>
                <p className={`text-lg font-bold ${whtCategory.color.includes(' ') ? whtCategory.color.split(' ')[0] : whtCategory.color}`}>{advancedResults.waistToHeightRatio.toFixed(2)}</p>
                <p className="text-[10px] text-theme-text-tertiary mt-1">
                   {whtCategory.category}
                </p>
              </div>
            </div>
          </div>

          {macroTargets && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-2">Daily Nutrition Targets</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">BMR (Katch-McArdle)</p>
                  <p className="text-lg font-bold text-theme-accent">{Math.round(advancedResults.bmr)} <span className="text-xs font-normal text-theme-text-tertiary uppercase">kcal</span></p>
                </div>
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Protein Target</p>
                  <p className="text-lg font-bold text-orange-400">{Math.round(macroTargets.proteinMin)}-{Math.round(macroTargets.proteinMax)}g</p>
                  <p className="text-[10px] text-theme-text-tertiary">Optimized for Lean Mass</p>
                </div>
                <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-lg p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Minimum Fat</p>
                  <p className="text-lg font-bold text-yellow-400">{Math.round(macroTargets.fatMin)}g</p>
                  <p className="text-[10px] text-theme-text-tertiary">Hormonal Floor</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-theme-text-tertiary mt-4 italic">
          “Meeting your Protein and Fat floors ensures muscle retention and hormonal health. Adjust Carbs based on your daily activity.”
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-success/10 border border-success/20 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">TDEE (Maintenance)</p>
          <p className="text-2xl font-bold text-success">{Math.round(tdee)} <span className="text-xs font-normal text-success uppercase">cal/day</span></p>
        </div>
        <div className={`${currentPhase.bgClass} border border-white/5 rounded-xl p-4`}>
          <p className={`text-[10px] font-black uppercase tracking-widest ${currentPhase.colorClass} mb-1`}>{currentPhase.label}</p>
          <p className={`text-2xl font-bold ${currentPhase.colorClass}`}>{Math.round(cuttingCalories)} <span className="text-xs font-normal text-theme-text-tertiary uppercase">cal/day</span></p>
        </div>
      </div>
    </div>
  );
}
