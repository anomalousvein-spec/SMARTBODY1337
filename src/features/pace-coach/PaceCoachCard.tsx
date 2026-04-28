import React from "react";
import {
  Sparkles,
  Info,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Skeleton, Card } from "../../components";
import { CheckInForm } from "./CheckInForm";
import { usePaceCoach } from "../../hooks/usePaceCoach";
import { MIN_CHECKINS_FOR_METABOLISM } from "../../config/constants";
import { useApp } from "../../context/AppContext";
import {
  getNextCheckInDate,
  getDaysUntilCheckIn,
  formatDate,
  isCheckInDue,
} from "../../utils/paceCoach";

export function PaceCoachCard() {
  const { user } = useApp();
  const {
    settings,
    lastCheckIn,
    checkInCount,
    showCheckInForm,
    setShowCheckInForm,
    isLoading,
    refresh,
  } = usePaceCoach(user.id);

  if (isLoading)
    return (
      <Card className="h-48">
        <Skeleton className="h-full" />
      </Card>
    );
  if (!settings || !settings.paceCoachEnabled) return null;

  const handleComplete = () => {
    setShowCheckInForm(false);
    refresh();
  };

  // Calculate check-in timing
  const reminderDays = settings.paceCoachReminderDays || 14;
  const nextCheckInDate = getNextCheckInDate(lastCheckIn?.date, reminderDays);
  const daysUntilCheckIn = getDaysUntilCheckIn(lastCheckIn?.date, reminderDays);
  const checkInIsDue = isCheckInDue(lastCheckIn?.date, reminderDays);

  // Calculate progress through the check-in cycle
  const calculateProgress = () => {
    if (!lastCheckIn?.date) return 0;
    const lastDate = new Date(lastCheckIn.date).getTime();
    const now = new Date().getTime();
    const totalPeriod = reminderDays * 24 * 60 * 60 * 1000;
    const elapsed = now - lastDate;
    const progress = Math.min(100, Math.max(0, (elapsed / totalPeriod) * 100));
    return progress;
  };

  const progressPercent = checkInIsDue ? 100 : calculateProgress();

  // Calculate weight trend info for explanation
  const getTrendInfo = () => {
    if (!lastCheckIn || !lastCheckIn.weightSlopeLbsPerDay) {
      return {
        icon: Minus,
        color: "text-theme-text-tertiary",
        bgColor: "bg-theme-bg-tertiary/50",
        label: "Insufficient data",
        description: "",
      };
    }

    const slope = lastCheckIn.weightSlopeLbsPerDay;
    const lbsPerWeek = Math.abs(slope * 7);

    if (Math.abs(slope) < 0.1) {
      return {
        icon: Minus,
        color: "text-theme-text-secondary",
        bgColor: "bg-theme-bg-tertiary/50",
        label: "Weight stable",
        description: `±${lbsPerWeek.toFixed(1)} lbs/week`,
      };
    } else if (slope < 0) {
      return {
        icon: TrendingDown,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        label: "Losing weight",
        description: `${lbsPerWeek.toFixed(1)} lbs/week`,
      };
    } else {
      return {
        icon: TrendingUp,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        label: "Gaining weight",
        description: `${lbsPerWeek.toFixed(1)} lbs/week`,
      };
    }
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;
  const calibrationProgressPercent =
    (checkInCount / MIN_CHECKINS_FOR_METABOLISM) * 100;

  return (
    <Card className="card-hover overflow-hidden relative group">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-theme-accent/10 group-hover:bg-theme-accent/20 transition-colors">
              <Sparkles className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-theme-text-primary">
                Pace Coach
              </h3>
              <p className="text-[10px] text-theme-text-tertiary uppercase tracking-wider font-semibold">
                Smart Calibration
              </p>
            </div>
          </div>
          {!showCheckInForm && (
            <button
              onClick={() => setShowCheckInForm(true)}
              disabled={!checkInIsDue}
              className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                checkInIsDue
                  ? "hover:bg-theme-accent/10"
                  : "bg-theme-bg-tertiary/30 cursor-not-allowed opacity-50"
              }`}
              aria-label="Open check-in form"
              title={
                !checkInIsDue
                  ? `Check-in available in ${daysUntilCheckIn} day${daysUntilCheckIn !== 1 ? "s" : ""}`
                  : "Start check-in"
              }
            >
              <RefreshCw
                className={`w-4 h-4 transition-colors ${
                  checkInIsDue
                    ? "text-theme-text-secondary hover:text-theme-accent"
                    : "text-theme-text-tertiary"
                }`}
              />
            </button>
          )}
        </div>

        {showCheckInForm ? (
          <CheckInForm
            userId={user.id}
            settings={settings}
            lastCheckInDate={lastCheckIn?.date}
            onComplete={handleComplete}
            onCancel={() => setShowCheckInForm(false)}
          />
        ) : (
          <div className="space-y-5">
            {checkInCount < MIN_CHECKINS_FOR_METABOLISM ? (
              /* Calibration State */
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-theme-accent/10 to-theme-accent/5 p-5 rounded-2xl border border-theme-accent/20">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-theme-accent/20 shrink-0">
                      <Info className="w-5 h-5 text-theme-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-theme-text-primary">
                        Calibrating to Your Metabolism
                      </p>
                      <p className="text-xs text-theme-text-secondary mt-1 leading-relaxed">
                        Pace Coach learns from your actual data to provide
                        personalized recommendations.
                      </p>
                    </div>
                  </div>

                  {/* Check-in Cycle Progress */}
                  <div className="mb-4 p-4 bg-theme-bg-tertiary/30 rounded-xl border border-theme-bg-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-theme-text-tertiary" />
                        <span className="text-xs font-semibold text-theme-text-secondary">
                          Check-in Schedule
                        </span>
                      </div>
                      {checkInIsDue ? (
                        <span className="text-xs font-bold text-theme-accent animate-pulse">
                          Ready Now!
                        </span>
                      ) : (
                        <span className="text-xs text-theme-text-tertiary">
                          {daysUntilCheckIn} day
                          {daysUntilCheckIn !== 1 ? "s" : ""} left
                        </span>
                      )}
                    </div>

                    {/* Progress bar for current cycle */}
                    <div className="relative">
                      <div className="h-2 bg-theme-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            checkInIsDue
                              ? "bg-gradient-to-r from-green-500 to-green-400"
                              : "bg-gradient-to-r from-theme-accent to-theme-accent/70"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-[9px] text-theme-text-tertiary">
                        <span>
                          Last:{" "}
                          {lastCheckIn?.date
                            ? formatDate(lastCheckIn.date)
                            : "N/A"}
                        </span>
                        <span>Next: {formatDate(nextCheckInDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Calibration Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-theme-accent">
                        Calibration Progress
                      </span>
                      <span className="text-theme-text-tertiary">
                        {checkInCount}/{MIN_CHECKINS_FOR_METABOLISM}
                      </span>
                    </div>
                    <div className="h-2.5 bg-theme-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-theme-accent to-theme-accent/70 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${calibrationProgressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-theme-text-tertiary text-center pt-1">
                      {MIN_CHECKINS_FOR_METABOLISM - checkInCount} more to
                      unlock full insights
                    </p>
                  </div>
                </div>

                {/* Quick tip */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-theme-bg-tertiary/30 rounded-xl border border-theme-bg-border/50">
                  <Target className="w-3.5 h-3.5 text-theme-text-tertiary shrink-0" />
                  <p className="text-[10px] text-theme-text-tertiary leading-relaxed">
                    <strong className="text-theme-text-secondary">Tip:</strong>{" "}
                    Weigh in consistently at the same time daily for best
                    results
                  </p>
                </div>
              </div>
            ) : (
              /* Fully Calibrated State */
              <div className="space-y-5">
                {/* Main Metric Display */}
                <div className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="text-center p-6 bg-gradient-to-b from-theme-accent/15 via-theme-accent/5 to-transparent rounded-2xl border border-theme-accent/20 relative">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5 text-theme-accent" />
                      <p className="text-[10px] text-theme-text-tertiary uppercase tracking-widest font-bold">
                        Recommended Intake
                      </p>
                    </div>
                    <div className="text-5xl font-black text-theme-text-primary tracking-tight">
                      {settings.lastSuggestedIntake}
                      <span className="text-base font-medium text-theme-text-tertiary ml-1.5">
                        kcal/day
                      </span>
                    </div>
                    {lastCheckIn && (
                      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-theme-text-tertiary">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>Based on {checkInCount} check-ins</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weight Trend & Stats */}
                {lastCheckIn && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Trend Card */}
                    <div
                      className={`${trendInfo.bgColor} rounded-2xl p-4 border border-theme-bg-border/50`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`p-1.5 rounded-lg ${trendInfo.bgColor} ${trendInfo.color}`}
                        >
                          <TrendIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-theme-text-tertiary uppercase tracking-wide">
                          Trend
                        </span>
                      </div>
                      <p className="text-sm font-bold text-theme-text-primary">
                        {trendInfo.label}
                      </p>
                      {trendInfo.description && (
                        <p className="text-xs text-theme-text-secondary mt-0.5">
                          {trendInfo.description}
                        </p>
                      )}
                    </div>

                    {/* TDEE Card */}
                    <div className="bg-theme-bg-tertiary/30 rounded-2xl p-4 border border-theme-bg-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-theme-bg-tertiary/50 text-theme-text-tertiary">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-theme-text-tertiary uppercase tracking-wide">
                          Est. TDEE
                        </span>
                      </div>
                      <p className="text-sm font-bold text-theme-text-primary">
                        {Math.round(lastCheckIn.calculatedTDEE)}
                      </p>
                      <p className="text-xs text-theme-text-secondary mt-0.5">
                        calories/day
                      </p>
                    </div>
                  </div>
                )}

                {/* Educational Context Card */}
                <div className="bg-gradient-to-br from-theme-bg-tertiary/50 to-theme-bg-tertiary/20 rounded-2xl p-4 border border-theme-bg-border/50">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-theme-accent/10 shrink-0">
                      <Info className="w-4 h-4 text-theme-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-theme-text-primary">
                        Powered by Your Data
                      </p>
                      <p className="text-xs text-theme-text-tertiary mt-1 leading-relaxed">
                        Your target is based on your{" "}
                        <strong className="text-theme-text-secondary">
                          actual weight trend
                        </strong>{" "}
                        from {checkInCount} check-ins, not generic formulas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[10px] bg-theme-accent/5 rounded-xl p-3 border border-theme-accent/10">
                    <ArrowRight className="w-3 h-3 text-theme-accent shrink-0 mt-0.5" />
                    <span className="text-theme-text-tertiary leading-relaxed">
                      <strong className="text-theme-text-secondary">
                        How it works:
                      </strong>{" "}
                      We compare your reported calories to your weight change to
                      estimate your true metabolism (TDEE), then adjust your
                      target to match your goal pace.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
