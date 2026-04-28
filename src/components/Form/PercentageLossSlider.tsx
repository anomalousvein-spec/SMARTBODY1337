import React, { useState, useEffect, useCallback } from "react";
import { cn } from "../../utils/ui";
import {
  calculatePercentageLoss,
  getSliderZone,
  getDynamicLabelText,
  getHeavyUserMessage,
  SLIDER_CONFIG,
  SLIDER_ZONES,
} from "../../utils/percentageLoss";

export interface PercentageLossSliderProps {
  currentWeight: number;
  weightUnit: "lbs" | "kg";
  tdee: number;
  bmr: number;
  gender: "male" | "female";
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * Enhanced weight loss rate slider with color-coded zones
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
    gender,
  );

  // Handle slider change
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
        gender,
      );

      if (tempResults.isBelowBmrFloor) {
        onChange(tempResults.safePercentage);
        setLocalValue(tempResults.safePercentage);
      } else {
        onChange(newValue);
      }
    },
    [currentWeight, weightUnit, tdee, bmr, gender, onChange],
  );

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
      gender,
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
    const stops = SLIDER_ZONES.map((zone) => {
      const zoneStart =
        ((zone.min - SLIDER_CONFIG.min) /
          (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) *
        100;
      const zoneEnd =
        ((zone.max - SLIDER_CONFIG.min) /
          (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) *
        100;
      // Map color names to approximate hex for gradient
      let color = "#4D9EFF"; // theme-accent-like
      if (zone.color === "green") color = "#03DAC6"; // success
      if (zone.color === "yellow") color = "#F4B400"; // warning
      if (zone.color === "orange") color = "#CF6679"; // error/aggressive

      return `${color} ${zoneStart}% ${zoneEnd}%`;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  // Calculate thumb position percentage
  const thumbPosition =
    ((localValue - SLIDER_CONFIG.min) /
      (SLIDER_CONFIG.max - SLIDER_CONFIG.min)) *
    100;

  // Convert weight for display
  const weightLbs =
    weightUnit === "lbs" ? currentWeight : currentWeight * 2.20462262;

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
        <div className="relative pt-4 pb-2">
          {/* Custom Track with Color Zones */}
          <div className="absolute top-[1rem] left-0 right-0 h-2.5 rounded-full overflow-hidden opacity-40">
            <div
              className="w-full h-full"
              style={{ background: getTrackGradient() }}
            />
          </div>

          {/* Range Input - Hide default thumb */}
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
              "relative w-full h-2.5 appearance-none bg-transparent cursor-pointer z-10",
              "focus:outline-none focus:ring-0",
              disabled && "opacity-50 cursor-not-allowed",
              // Hide default thumb across browsers
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:w-0",
              "[&::-webkit-slider-thumb]:h-0",
              "[&::-moz-range-thumb]:appearance-none",
              "[&::-moz-range-thumb]:w-0",
              "[&::-moz-range-thumb]:h-0",
              "[&::-ms-thumb]:appearance-none",
              "[&::-ms-thumb]:w-0",
              "[&::-ms-thumb]:h-0",
            )}
          />

          {/* Custom Thumb - Larger and more prominent (single handle) */}
          <div
            className="absolute top-[0.6rem] w-6 h-6 bg-white rounded-full shadow-2xl border-2 border-theme-accent transform -translate-x-1/2 pointer-events-none transition-all duration-75 z-20 hover:scale-110 active:scale-105"
            style={{ left: `${thumbPosition}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-2">
          <span
            className={cn(
              "text-3xl font-black tracking-tight",
              currentZone.textColorClass,
            )}
          >
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
            {weightUnit === "kg" && (
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
        <div className="bg-error/10 border border-error/20 rounded-xl p-4">
          <p className="text-xs text-error font-medium leading-relaxed">
            {results.warningMessage}
          </p>
        </div>
      ) : (
        /* Status Message */
        <div
          className={cn(
            "rounded-xl p-3 text-xs font-bold uppercase tracking-wide text-center border",
            results.zone === "conservative" &&
              "bg-theme-accent/5 text-theme-accent border-theme-accent/10",
            results.zone === "recommended" &&
              "bg-success/5 text-success border-success/10",
            results.zone === "aggressive" &&
              "bg-warning/5 text-warning border-warning/10",
            results.zone === "notRecommended" &&
              "bg-error/5 text-error border-error/10",
          )}
        >
          {results.zone === "conservative" &&
            "🔵 Conservative — Safe for long-term sustainability"}
          {results.zone === "recommended" &&
            "🟢 Recommended — Optimal balance of progress"}
          {results.zone === "aggressive" &&
            "🟡 Aggressive but within safe limits"}
          {results.zone === "notRecommended" && "🟠 Above recommended limits"}
        </div>
      )}

      {/* Protein & Resistance Training Nudge */}
      {results.showProteinNudge && (
        <div className="bg-theme-accent/10 border border-theme-accent/20 rounded-xl p-4 flex gap-3 items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="text-xl shrink-0">💪</span>
          <p className="text-sm text-theme-text-primary font-medium leading-tight">
            At this pace, prioritizing{" "}
            <span className="text-theme-accent font-bold">
              protein (0.7–1g per lb)
            </span>{" "}
            and
            <span className="text-theme-accent font-bold">
              {" "}
              resistance training
            </span>{" "}
            is essential to preserve muscle mass.
          </p>
        </div>
      )}

      {/* Heavy User Note */}
      {heavyUserMessage && (
        <div className="bg-theme-accent/5 border border-theme-accent/10 rounded-xl p-3">
          <p className="text-[10px] text-theme-accent font-black uppercase tracking-widest text-center">
            {heavyUserMessage}
          </p>
        </div>
      )}
    </div>
  );
}
