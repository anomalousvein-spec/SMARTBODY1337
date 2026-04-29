import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, TrendingDown, Target, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMetrics } from "../hooks/useMetrics";
import {
  PaceCoachCard,
  CheckInIndicator,
  PaceCoachRecommendations,
} from "../features/pace-coach";
import { db } from "../db/database";
import { WAIST_RATIO_DISPLAY_CATEGORIES } from "../config/constants";
import { Skeleton, CardSkeleton } from "../components";
import { CalorieOverview, WeeklyAverages, QuickLogSection } from "./components";
import { useApp } from "../context/AppContext";

/**
 * Main dashboard component providing a high-level overview of all metrics.
 * Refactored for performance via component extraction and memoization.
 * Now correctly uses userId from context.
 */
export function AnalyticsDashboard() {
  const { user } = useApp();
  const userId = user.id;
  const {
    metrics,
    isLoading,
    error: metricsError,
    refresh: loadData,
  } = useMetrics(userId);
  const [quickLogType, setQuickLogType] = useState<"weight" | "waist" | null>(
    null,
  );
  const [quickLogValue, setQuickLogValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleQuickLog = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!quickLogType || !quickLogValue) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        const val = parseFloat(quickLogValue);
        const today = new Date().toISOString();

        if (quickLogType === "weight") {
          await db.weights.add({
            user_id: userId,
            date: today,
            weight: val,
            unit: "lbs",
          });
        } else {
          await db.waist_measurements.add({
            user_id: userId,
            date: today,
            measurement: val,
            unit: "in",
          });
        }

        setQuickLogType(null);
        setQuickLogValue("");
        loadData();
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to save entry",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [quickLogType, quickLogValue, loadData, userId],
  );

  const handleNavigateMacros = useCallback(() => {
    navigate("/macros");
  }, [navigate]);

  const waistCategory = useMemo(() => {
    if (!metrics?.waistRatio) return null;
    const ratio = metrics.waistRatio;

    if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.SLIM.threshold)
      return {
        label: WAIST_RATIO_DISPLAY_CATEGORIES.SLIM.label,
        color: "text-blue-400",
      };
    if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.HEALTHY.threshold)
      return {
        label: WAIST_RATIO_DISPLAY_CATEGORIES.HEALTHY.label,
        color: "text-success",
      };
    if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.OVERWEIGHT.threshold)
      return {
        label: WAIST_RATIO_DISPLAY_CATEGORIES.OVERWEIGHT.label,
        color: "text-warning",
      };
    return {
      label: WAIST_RATIO_DISPLAY_CATEGORIES.HIGH_RISK.label,
      color: "text-error",
    };
  }, [metrics?.waistRatio]);

  const displayError = metricsError || saveError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {displayError && (
        <div
          className="bg-error/10 rounded-2xl p-4 border border-error/20"
          role="alert"
        >
          <p className="text-sm text-error">{displayError}</p>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border-theme-accent/20 rounded-2xl p-5 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-theme-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-theme-accent/10 transition-colors" />
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-theme-accent" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">
              Current Weight
            </span>
          </div>
          <div className="text-3xl font-black text-theme-text-primary tracking-tight">
            {metrics?.latestWeight?.weight ?? "--"}
            <span className="text-xs font-medium text-theme-text-tertiary ml-1.5 uppercase">
              lbs
            </span>
          </div>
          {metrics && metrics.weightChange !== 0 && (
            <div
              className={`text-[10px] font-bold uppercase tracking-wide mt-2 flex items-center gap-1 ${metrics.weightChange < 0 ? "text-success" : "text-error"}`}
            >
              <TrendingDown
                aria-hidden="true"
                className={`w-3 h-3 ${metrics.weightChange >= 0 ? "rotate-180" : ""}`}
              />
              {Math.abs(metrics.weightChange).toFixed(1)} lbs this week
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass border-purple-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-400" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">
              Waist Ratio
            </span>
          </div>
          <div className="text-3xl font-black text-theme-text-primary tracking-tight">
            {metrics?.waistRatio ? metrics.waistRatio.toFixed(2) : "--"}
          </div>
          {waistCategory && (
            <div
              className={`text-[10px] font-bold uppercase tracking-wide mt-2 ${waistCategory.color}`}
            >
              {waistCategory.label}
            </div>
          )}
        </motion.div>
      </div>

      {/* Check-in Indicator */}
      <CheckInIndicator onNavigateToPaceCoach={() => {}} />

      {/* Pace Coach Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <PaceCoachCard />
      </motion.div>

      {/* Pace Coach Recommendations (when sufficient data exists) */}
      <PaceCoachRecommendations metrics={metrics} />

      {/* Calorie Summary */}
      <CalorieOverview metrics={metrics} />

      {/* Weekly Averages */}
      <WeeklyAverages metrics={metrics} />

      {/* Quick Log Section */}
      <QuickLogSection
        quickLogType={quickLogType}
        setQuickLogType={setQuickLogType}
        quickLogValue={quickLogValue}
        setQuickLogValue={setQuickLogValue}
        handleQuickLog={handleQuickLog}
        isSaving={isSaving}
        onNavigateMacros={handleNavigateMacros}
      />

      {/* Health Alerts */}
      {metrics && metrics.waistRatio > 0.58 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-error/10 rounded-2xl p-5 border border-error/20 glass"
        >
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-error/15 shrink-0 border border-error/20">
              <AlertCircle className="w-5 h-5 text-error" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-error mb-1.5">
                Health Risk Detected
              </h4>
              <p className="text-sm text-theme-text-primary leading-relaxed font-medium">
                Your waist-to-height ratio (
                <span className="text-error font-black underline decoration-error/30 underline-offset-4">
                  {metrics.waistRatio.toFixed(2)}
                </span>
                ) indicates elevated health risks. Consider consulting with a
                healthcare provider.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
