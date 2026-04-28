import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/ui';
import {
  SLIDER_CONFIG,
  SLIDER_ZONES,
  calculatePercentageLoss,
  getDynamicLabelText,
  getHeavyUserMessage,
  getSliderZone,
} from '../../utils/percentageLoss';

export interface PercentageLossSliderProps {
  /** Current weight value */
  currentWeight: number;
  /** Weight unit (lbs or kg) */
  weightUnit: 'lbs' | 'kg';
  /** Current TDEE value */
  tdee: number;
  /** Current BMR value */
  bmr: number;
  /** User's gender for BMR floor calculation */
  gender: 'male' | 'female';
  /** Current selected percentage value */
  value: number;
  /** Callback when percentage changes */
  onChange: (percentage: number) => void;
  /** Whether the slider is disabled */
  disabled?: boolean;
}

/**
 * Percentage-based weight loss rate slider with color-coded zones
 * and dynamic calorie calculations
 */
export function PercentageLossSlider({
  currentWeight,
  weightUnit,
  tdee,
  bmr,
  gender,
  value,
  onChange,
  disabled = false,
}: PercentageLossSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Sync local value with prop value
  useEffect(() => {
    if (!isAdjusting) {
      setLocalValue(value);
    }
  }, [value, isAdjusting]);

  // Calculate results based on current slider value
  const results = calculatePercentageLoss(
    currentWeight,
    weightUnit,
    localValue,
    tdee,
    bmr,
    gender
  );

  // Handle slider change
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    setIsAdjusting(true);
    
    // Check if below BMR floor and nudge if needed on the fly
    const tempResults = calculatePercentageLoss(
      currentWeight,
      weightUnit,
      newValue,
      tdee,
      bmr,
      gender
    );

    if (tempResults.isBelowBmrFloor) {
      onChange(tempResults.safePercentage);
      setLocalValue(tempResults.safePercentage);
    } else {
      onChange(newValue);
    }
  }, [currentWeight, weightUnit, tdee, bmr, gender, onChange]);

  // Handle slider end (commit the value)
  const handleSliderMouseUp = useCallback(() => {
    setIsAdjusting(false);
    // Final safety check
    const finalResults = calculatePercentageLoss(
      currentWeight,
      weightUnit,
      localValue,
      tdee,
      bmr,
      gender
    );
    if (finalResults.isBelowBmrFloor) {
      onChange(finalResults.safePercentage);
      setLocalValue(finalResults.safePercentage);
    } else {
      onChange(localValue);
    }
  }, [currentWeight, weightUnit, tdee, bmr, gender, localValue, onChange]);

  // Get current zone config
  const currentZone = getSliderZone(localValue);

  // Calculate gradient stops for track coloring
  const getTrackGradient = () => {
    const stops = SLIDER_ZONES.map(zone => {
      const zoneStart = ((zone.min - SLIDER_CONFIG.min) / (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) * 100;
      const zoneEnd = ((zone.max - SLIDER_CONFIG.min) / (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) * 100;
      // Map color names to approximate hex for gradient
      let color = '#4D9EFF'; // blue
      if (zone.color === 'green') color = '#03DAC6';
      if (zone.color === 'yellow') color = '#EAB308';
      if (zone.color === 'orange') color = '#F97316';

      return `${color} ${zoneStart}% ${zoneEnd}%`;
    });
    return `linear-gradient(to right, ${stops.join(', ')})`;
  };

  // Calculate thumb position percentage
  const thumbPosition = ((localValue - SLIDER_CONFIG.min) / (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) * 100;

  // Convert weight for display
  const weightLbs = weightUnit === 'lbs' ? currentWeight : currentWeight * 2.20462262;

  // Dynamic label text
  const dynamicLabel = getDynamicLabelText(localValue, weightLbs);

  // Heavy user message
  const heavyUserMessage = getHeavyUserMessage(weightLbs);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1 ml-1">
          Weekly Loss Pace
        </p>
        <p className="text-xs text-theme-text-tertiary italic ml-1">
          (0.5% – 1.0% recommended for lasting results)
        </p>
      </div>

      {/* Slider & Percentage Display */}
      <div className="space-y-4">
        <div className="relative pt-2">
          {/* Custom Track with Color Zones */}
          <div className="absolute top-[0.6rem] left-0 right-0 h-1.5 rounded-full overflow-hidden opacity-40">
            <div
              className="w-full h-full"
              style={{ background: getTrackGradient() }}
            />
          </div>

          {/* Range Input */}
          <input
            type="range"
            min={SLIDER_CONFIG.min}
            max={SLIDER_CONFIG.max}
            step={SLIDER_CONFIG.step}
            value={localValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderMouseUp}
            onTouchEnd={handleSliderMouseUp}
            disabled={disabled}
            className={cn(
              "relative w-full h-1.5 appearance-none bg-transparent cursor-pointer z-10",
              "focus:outline-none focus:ring-0",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />

          {/* Custom Thumb */}
          <div
            className="absolute top-[0.4rem] w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-theme-accent transform -translate-x-1/2 pointer-events-none transition-all duration-75 z-20"
            style={{ left: `${thumbPosition}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-2">
           <span className={cn("text-3xl font-black tracking-tight", currentZone.textColorClass)}>
            {localValue.toFixed(2)}%
          </span>
          <span className="text-sm font-bold text-theme-text-tertiary uppercase tracking-widest mt-1">
            Bodyweight / Week
          </span>
        </div>
      </div>

      {/* Dynamic Results Readout */}
      <div className="space-y-3">
        <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-theme-text-primary">
            {dynamicLabel}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
              Weight Target
            </p>
            <p className="text-lg font-bold text-theme-text-primary">
              ~{results.weeklyLossLbs.toFixed(1)} lb/week
            </p>
            {weightUnit === 'kg' && (
              <p className="text-[10px] text-theme-text-tertiary font-bold">
                ({results.weeklyLossKg.toFixed(2)} KG/WEEK)
              </p>
            )}
          </div>
          <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
              Calorie Target
            </p>
            <p className="text-lg font-bold text-theme-text-primary">
              {Math.round(results.proposedIntake)} kcal
            </p>
          </div>
        </div>
      </div>

      {/* BMR Floor Warning - High priority if it exists */}
      {results.warningMessage ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs text-red-400 font-medium leading-relaxed">
            {results.warningMessage}
          </p>
        </div>
      ) : (
        /* Status Message */
        <div className={cn(
          "rounded-xl p-3 text-xs font-bold uppercase tracking-wide text-center border",
          results.zone === 'conservative' && "bg-blue-500/5 text-blue-400 border-blue-500/10",
          results.zone === 'recommended' && "bg-emerald-500/5 text-success border-emerald-500/10",
          results.zone === 'aggressive' && "bg-yellow-500/5 text-warning border-yellow-500/10",
          results.zone === 'notRecommended' && "bg-orange-500/5 text-error border-orange-500/10"
        )}>
          {results.zone === 'conservative' && "🔵 Conservative — Safe for long-term sustainability"}
          {results.zone === 'recommended' && "🟢 Recommended — Optimal balance of progress"}
          {results.zone === 'aggressive' && "🟡 Aggressive but within safe limits"}
          {results.zone === 'notRecommended' && "🟠 Above recommended limits"}
        </div>
      )}

      {/* Protein & Resistance Training Nudge */}
      {results.showProteinNudge && (
        <div className="bg-theme-accent/10 border border-theme-accent/20 rounded-xl p-4 flex gap-3 items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="text-xl shrink-0">💪</span>
          <p className="text-sm text-theme-text-primary font-medium leading-tight">
            At this pace, prioritizing <span className="text-theme-accent font-bold">protein (0.7–1g per lb)</span> and
            <span className="text-theme-accent font-bold"> resistance training</span> is essential to preserve muscle mass.
          </p>
        </div>
      )}

      {/* Heavy User Note */}
      {heavyUserMessage && (
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest text-center">
            {heavyUserMessage}
          </p>
        </div>
      )}
    </div>
  );
}
