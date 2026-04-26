import React from 'react';
import { Sparkles, Info, RefreshCw } from 'lucide-react';
import { Skeleton } from '../../components';
import { CheckInForm } from './CheckInForm';
import { usePaceCoach } from '../../hooks/usePaceCoach';
import { MIN_CHECKINS_FOR_METABOLISM } from '../../config/constants';

interface PaceCoachCardProps {
  /** User ID for fetching coach data */
  userId: string;
}

/**
 * Dashboard card for the Pace Coach feature
 * Displays metabolic insights and handles periodic check-ins
 */
export function PaceCoachCard({ userId }: PaceCoachCardProps) {
  const {
    settings,
    lastCheckIn,
    checkInCount,
    showCheckInForm,
    setShowCheckInForm,
    isLoading,
    refresh
  } = usePaceCoach(userId);

  if (isLoading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  if (!settings || !settings.paceCoachEnabled) {
    return null;
  }

  const handleComplete = () => {
    setShowCheckInForm(false);
    refresh();
  };

  return (
    <div className="glass card-hover rounded-2xl p-5 shadow-xl border border-white/5 overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-theme-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-theme-accent" aria-hidden="true" />
          Pace Coach
        </h3>
        {!showCheckInForm && (
          <button
            onClick={() => setShowCheckInForm(true)}
            className="p-2 hover:bg-theme-bg-tertiary rounded-full transition-colors"
            aria-label="Start manual Pace Coach check-in"
          >
            <RefreshCw className="w-4 h-4 text-theme-text-tertiary" aria-hidden="true" />
          </button>
        )}
      </div>

      {showCheckInForm ? (
        <CheckInForm
          userId={userId}
          settings={settings}
          onComplete={handleComplete}
          onCancel={() => setShowCheckInForm(false)}
        />
      ) : (
        <div className="space-y-4">
          {checkInCount < MIN_CHECKINS_FOR_METABOLISM ? (
            <div className="bg-theme-accent/5 p-4 rounded-xl border border-theme-accent/10">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-theme-accent shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-theme-text-primary">Calibrating...</p>
                  <p className="text-xs text-theme-text-tertiary leading-relaxed">
                    Pace Coach needs at least {MIN_CHECKINS_FOR_METABOLISM} check-ins over 3 weeks to calculate your metabolism accurately.
                  </p>
                  <p className="text-[10px] text-theme-accent font-bold uppercase tracking-wider pt-1">
                    Check-in {checkInCount}/{MIN_CHECKINS_FOR_METABOLISM} Complete
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="text-center p-6 bg-gradient-to-b from-theme-accent/20 to-transparent rounded-2xl border border-theme-accent/10">
                <p className="text-xs text-theme-text-tertiary uppercase tracking-widest font-bold mb-1">
                  Recommended Intake
                </p>
                <div className="text-4xl font-black text-theme-text-primary">
                  {settings.lastSuggestedIntake}
                  <span className="text-sm font-normal text-theme-text-tertiary ml-1">kcal/day</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <p className="text-[11px] text-theme-text-secondary font-medium">
                    Based on your metabolism and {settings.targetLossRate} lb/week goal
                  </p>
                </div>
              </div>

              {lastCheckIn && (
                <div className="flex justify-between items-center px-2 py-1 text-[10px] text-theme-text-tertiary">
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Last Check-in:</span>
                    {new Date(lastCheckIn.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Est. TDEE:</span>
                    {Math.round(lastCheckIn.calculatedTDEE)} cal
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
