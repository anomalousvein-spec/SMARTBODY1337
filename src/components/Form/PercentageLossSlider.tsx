import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/ui';
import {
  SLIDER_CONFIG,
  SLIDER_ZONES,
  calculatePercentageLoss,
  getDynamicLabelText,
  getHeavyUserMessage,
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
    
    // If below BMR floor, use the safe percentage instead
    if (results.isBelowBmrFloor) {
      onChange(results.safePercentage);
      setLocalValue(results.safePercentage);
    } else {
      onChange(newValue);
    }
  }, [results.isBelowBmrFloor, results.safePercentage, onChange]);

  // Handle slider end (commit the value)
  const handleSliderMouseUp = useCallback(() => {
    setIsAdjusting(false);
    // Ensure we commit the safe value if needed
    if (results.isBelowBmrFloor) {
      onChange(results.safePercentage);
    } else {
      onChange(localValue);
    }
  }, [results.isBelowBmrFloor, results.safePercentage, localValue, onChange]);

  // Get current zone
  const currentZone = SLIDER_ZONES.find(
    zone => localValue >= zone.min && localValue <= zone.max
  ) || SLIDER_ZONES[1];

  // Calculate gradient stops for track coloring
  const getTrackGradient = () => {
    const stops = SLIDER_ZONES.map(zone => {
      const zoneStart = ((zone.min - SLIDER_CONFIG.min) / (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) * 100;
      const zoneEnd = ((zone.max - SLIDER_CONFIG.min) / (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) * 100;
      return `${zone.trackColorClass} ${zoneStart}% ${zoneEnd}%`;
    });
    return `linear-gradient(to right, ${stops.join(', ')})`;
  };

  // Calculate thumb position percentage
  const thumbPosition = ((localValue - SLIDER_CONFIG.min) / (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) * 100;

  // Convert weight for display
  const weightLbs = weightUnit === 'lbs' ? currentWeight : currentWeight * 2.20462262;
  const weightKg = weightUnit === 'kg' ? currentWeight : currentWeight * 0.45359237;

  // Dynamic label text
  const dynamicLabel = getDynamicLabelText(localValue, weightLbs, results.zone);

  // Heavy user message
  const heavyUserMessage = getHeavyUserMessage(weightLbs, localValue);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-semibold text-theme-text-primary mb-1">
          Select your weekly loss pace
        </p>
        <p className="text-xs text-theme-text-tertiary">
          (0.5% – 1.0% recommended for lasting results)
        </p>
      </div>

      {/* Slider Container */}
      <div className="relative pt-6 pb-2">
        {/* Custom Track with Color Zones */}
        <div className="absolute top-[1.25rem] left-0 right-0 h-2 rounded-full overflow-hidden">
          <div 
            className="w-full h-full"
            style={{ background: getTrackGradient() }}
          />
        </div>

        {/* Zone Labels Above Slider */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-[9px] font-bold uppercase tracking-wide">
          <span className="text-blue-400">Conservative</span>
          <span className="text-green-400">Recommended</span>
          <span className="text-yellow-400">Aggressive</span>
          <span className="text-orange-400">Not Recommended</span>
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
            "relative w-full h-2 appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-theme-accent/50 rounded-full",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            background: 'transparent',
          }}
        />

        {/* Custom Thumb Position Indicator */}
        <div 
          className="absolute top-[1rem] w-4 h-4 bg-white rounded-full shadow-lg border-2 border-theme-accent transform -translate-x-1/2 pointer-events-none transition-all duration-75"
          style={{ left: `${thumbPosition}%` }}
        />

        {/* Current Value Display */}
        <div className="mt-8 text-center">
          <span className="text-2xl font-bold text-theme-accent">
            {localValue.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Dynamic Label */}
      <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-3">
        <p className="text-sm text-theme-text-primary text-center">
          {dynamicLabel}
        </p>
      </div>

      {/* Results Display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
            Your Target
          </p>
          <p className="text-lg font-bold text-theme-text-primary">
            ~{results.weeklyLossLbs.toFixed(1)} lb/week
          </p>
          {weightUnit === 'kg' && (
            <p className="text-xs text-theme-text-tertiary">
              ({results.weeklyLossKg.toFixed(2)} kg/week)
            </p>
          )}
        </div>
        <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">
            Daily Calorie Target
          </p>
          <p className="text-lg font-bold text-theme-text-primary">
            {Math.round(results.proposedIntake)} kcal
          </p>
        </div>
      </div>

      {/* Zone Status Message */}
      <div className={cn(
        "rounded-xl p-3 text-sm font-medium",
        results.zone === 'conservative' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        results.zone === 'recommended' && "bg-green-500/10 text-green-400 border border-green-500/20",
        results.zone === 'aggressive' && "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        results.zone === 'notRecommended' && "bg-orange-500/10 text-orange-400 border border-orange-500/20"
      )}>
        {results.zone === 'conservative' && "🟢 Conservative approach - great for long-term sustainability"}
        {results.zone === 'recommended' && "🟢 Recommended pace - optimal balance of progress and sustainability"}
        {results.zone === 'aggressive' && "🟡 Aggressive but within safe limits - monitor energy levels"}
        {results.zone === 'notRecommended' && "🟠 Above recommended limits - consider a more moderate approach"}
      </div>

      {/* Heavy User Note */}
      {heavyUserMessage && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-sm text-blue-400 text-center">
            💪 {heavyUserMessage}
          </p>
        </div>
      )}

      {/* BMR Floor Warning */}
      {results.warningMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <p className="text-xs text-red-400 leading-relaxed">
            ⚠️ {results.warningMessage}
          </p>
        </div>
      )}

      {/* Protein & Resistance Training Nudge */}
      {results.showProteinNudge && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
          <p className="text-sm text-purple-400 leading-relaxed">
            💪 <strong>Important:</strong> At this pace, prioritizing protein (0.7–1g per lb of body weight) 
            and resistance training is essential to preserve muscle mass.
          </p>
        </div>
      )}
    </div>
  );
}
