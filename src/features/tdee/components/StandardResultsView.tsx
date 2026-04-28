import React from "react";
import { PhaseInfo } from "../../../utils/calculations";

interface StandardResultsViewProps {
  bmr: number;
  tdee: number;
  cuttingCalories: number;
  currentPhase: PhaseInfo;
}

export function StandardResultsView({
  bmr,
  tdee,
  cuttingCalories,
  currentPhase,
}: StandardResultsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
          BMR (Mifflin-St Jeor)
        </p>
        <p className="text-2xl font-bold text-theme-accent">
          {Math.round(bmr)}{" "}
          <span className="text-xs font-normal text-theme-text-tertiary uppercase">
            cal/day
          </span>
        </p>
      </div>
      <div className="bg-success/10 border border-success/20 rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">
          TDEE
        </p>
        <p className="text-2xl font-bold text-success">
          {Math.round(tdee)}{" "}
          <span className="text-xs font-normal text-success uppercase">
            cal/day
          </span>
        </p>
      </div>
      <div
        className={`${currentPhase.bgClass} border border-white/5 rounded-xl p-4`}
      >
        <p
          className={`text-[10px] font-black uppercase tracking-widest ${currentPhase.colorClass} mb-1`}
        >
          {currentPhase.label}
        </p>
        <p className={`text-2xl font-bold ${currentPhase.colorClass}`}>
          {Math.round(cuttingCalories)}{" "}
          <span className="text-xs font-normal text-theme-text-tertiary uppercase">
            cal/day
          </span>
        </p>
      </div>
    </div>
  );
}
