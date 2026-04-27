import React from 'react';
import { Sparkles, Info, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton, Card } from '../../components';
import { CheckInForm } from './CheckInForm';
import { usePaceCoach } from '../../hooks/usePaceCoach';
import { MIN_CHECKINS_FOR_METABOLISM } from '../../config/constants';
import { useApp } from '../../context/AppContext';

export function PaceCoachCard() {
  const { user } = useApp();
  const { settings, lastCheckIn, checkInCount, showCheckInForm, setShowCheckInForm, isLoading, refresh } = usePaceCoach(user.id);
  
  if (isLoading) return <Card className="h-48"><Skeleton className="h-full" /></Card>;
  if (!settings || !settings.paceCoachEnabled) return null;

  const handleComplete = () => {
    setShowCheckInForm(false);
    refresh();
  };

  // Calculate weight trend info for explanation
  const getTrendInfo = () => {
    if (!lastCheckIn || !lastCheckIn.weightSlopeLbsPerDay) {
      return { icon: Minus, color: 'text-theme-text-tertiary', label: 'Insufficient data', description: '' };
    }
    
    const slope = lastCheckIn.weightSlopeLbsPerDay;
    const lbsPerWeek = Math.abs(slope * 7);
    
    if (Math.abs(slope) < 0.1) {
      return { icon: Minus, color: 'text-theme-text-secondary', label: 'Weight stable', description: `±${lbsPerWeek.toFixed(1)} lbs/week` };
    } else if (slope < 0) {
      return { icon: TrendingDown, color: 'text-green-500', label: 'Losing weight', description: `${lbsPerWeek.toFixed(1)} lbs/week` };
    } else {
      return { icon: TrendingUp, color: 'text-orange-500', label: 'Gaining weight', description: `${lbsPerWeek.toFixed(1)} lbs/week` };
    }
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  return (
    <Card className="card-hover overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-theme-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-theme-accent" />
          Pace Coach
        </h3>
        {!showCheckInForm && (
          <button onClick={() => setShowCheckInForm(true)} className="p-2 hover:bg-theme-bg-tertiary rounded-full transition-colors">
            <RefreshCw className="w-4 h-4 text-theme-text-tertiary" />
          </button>
        )}
      </div>

      {showCheckInForm ? (
        <CheckInForm
          userId={user.id}
          settings={settings}
          onComplete={handleComplete}
          onCancel={() => setShowCheckInForm(false)}
        />
      ) : (
        <div className="space-y-4">
          {checkInCount < MIN_CHECKINS_FOR_METABOLISM ? (
            <div className="bg-theme-accent/5 p-4 rounded-xl border border-theme-accent/10 flex gap-3">
              <Info className="w-5 h-5 text-theme-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-theme-text-primary">Calibrating...</p>
                <p className="text-xs text-theme-text-tertiary leading-relaxed">Pace Coach needs at least {MIN_CHECKINS_FOR_METABOLISM} check-ins to calculate metabolism accurately.</p>
                <p className="text-[10px] text-theme-accent font-bold uppercase tracking-wider pt-1">Check-in {checkInCount}/{MIN_CHECKINS_FOR_METABOLISM} Complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-b from-theme-accent/20 to-transparent rounded-2xl border border-theme-accent/10">
                <p className="text-xs text-theme-text-tertiary uppercase tracking-widest font-bold mb-1">Recommended Intake</p>
                <div className="text-4xl font-black text-theme-text-primary">{settings.lastSuggestedIntake}<span className="text-sm font-normal text-theme-text-tertiary ml-1">kcal/day</span></div>
              </div>
              
              {/* Weight Trend Indicator */}
              {lastCheckIn && (
                <>
                  <div className="flex justify-between items-center px-2 py-1 text-[10px] text-theme-text-tertiary uppercase font-bold">
                    <span>Last Check-in: {new Date(lastCheckIn.date).toLocaleDateString()}</span>
                    <span>Est. TDEE: {Math.round(lastCheckIn.calculatedTDEE)} cal</span>
                  </div>
                  
                  {/* Educational Context Card */}
                  <div className="bg-theme-bg-tertiary/50 rounded-xl p-4 border border-theme-bg-border">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-theme-bg-tertiary ${trendInfo.color}`}>
                        <TrendIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-theme-text-primary">{trendInfo.label}</p>
                        {trendInfo.description && (
                          <p className="text-xs text-theme-text-secondary">{trendInfo.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-theme-text-tertiary leading-relaxed">
                      <p>
                        Your target is based on your <strong className="text-theme-text-secondary">actual weight trend</strong> from {checkInCount} check-ins, not just formulas.
                      </p>
                      <div className="flex items-center gap-2 text-[10px] bg-theme-bg-tertiary/30 rounded-lg p-2">
                        <Info className="w-3 h-3 text-theme-accent shrink-0" />
                        <span>
                          <strong className="text-theme-text-secondary">How it works:</strong> We compare your reported calories to your weight change to estimate your true metabolism (TDEE), then adjust your target to match your goal pace.
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
