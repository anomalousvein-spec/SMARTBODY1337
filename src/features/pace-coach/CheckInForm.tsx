import React, { useState, useCallback, useEffect } from 'react';
import { db } from '../../db/database';
import { TDEESettings, PaceCoachCheckIn, MacroEntry } from '../../db/models';
import { calculateTrendSlope, calculateBackCalculatedTDEE, calculateSuggestedIntake, calculateAverageIntakeFromLogs } from '../../utils/paceCoach';
import { calculateMovingAverage, calculateBMR } from '../../utils/calculations';
import { LBS_TO_KG, KG_TO_LBS } from '../../config/constants';
import { FormMessage } from '../../components/Form';
import { validateCalories } from '../../utils/validation';
import { MIN_WEIGHT_ENTRIES_FOR_CHECKIN, TREND_CALCULATION_DAYS } from '../../config/constants';
import { useTDEESettings } from '../../hooks/useTDEESettings';
import { Info } from 'lucide-react';

interface CheckInFormProps {
  userId: string;
  settings: TDEESettings;
  lastCheckInDate?: string;
  onComplete: (suggestion: number) => void;
  onCancel: () => void;
}

export function CheckInForm({ userId, settings, lastCheckInDate, onComplete, onCancel }: CheckInFormProps) {
  const { updateSettings } = useTDEESettings(userId);
  const [averageIntake, setAverageIntake] = useState('');
  const [suggestedIntake, setSuggestedIntake] = useState<number | null>(null);
  const [hasSufficientData, setHasSufficientData] = useState(false);
  const [daysLogged, setDaysLogged] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(true);

  // Load macro logs and calculate suggested average intake
  useEffect(() => {
    const loadSuggestedIntake = async () => {
      setIsLoadingSuggestion(true);
      try {
        // Determine the date range (since last check-in or last 14 days)
        const startDate = lastCheckInDate ? new Date(lastCheckInDate) : new Date();
        if (lastCheckInDate) {
          startDate.setDate(startDate.getDate() + 1); // Start from day after last check-in
        } else {
          startDate.setDate(startDate.getDate() - 14); // Default to 14 days ago
        }

        const macroLogs = await db.macro_logs
          .where('user_id')
          .equals(userId)
          .filter(log => new Date(log.date) >= startDate)
          .toArray();

        const result = calculateAverageIntakeFromLogs(macroLogs, 14);
        
        if (result.hasSufficientData) {
          setSuggestedIntake(result.averageCalories);
          setHasSufficientData(true);
          setDaysLogged(result.daysLogged);
          // Pre-fill the input with suggested value
          setAverageIntake(result.averageCalories.toString());
        }
      } catch (err) {
        console.error('Error loading macro logs:', err);
      } finally {
        setIsLoadingSuggestion(false);
      }
    };

    loadSuggestedIntake();
  }, [userId, lastCheckInDate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const validation = validateCalories(averageIntake);
    if (!validation.valid) {
      setError(validation.error || 'Invalid intake');
      setIsSubmitting(false);
      return;
    }

    try {
      const intake = parseFloat(averageIntake);

      // 1. Get recent weights
      const results = await db.weights
        .where('user_id')
        .equals(userId)
        .toArray();

      // Sort entries chronologically and keep full objects for unit info
      const sortedEntries = results
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Normalize all weights to lbs for trend calculation
      const sortedWeightsLbs = sortedEntries.map(w => 
        w.unit === 'kg' ? w.weight * KG_TO_LBS : w.weight
      );

      // We need at least some data to calculate trend
      if (sortedWeightsLbs.length < MIN_WEIGHT_ENTRIES_FOR_CHECKIN) {
        throw new Error(`Not enough weight data to calculate trend. Need at least ${MIN_WEIGHT_ENTRIES_FOR_CHECKIN} weigh-ins!`);
      }

      // 2. Use smoothed trend for slope
      const smoothed = calculateMovingAverage(sortedWeightsLbs, 7);
      const recentSmoothed = smoothed.slice(-TREND_CALCULATION_DAYS);
      const slope = calculateTrendSlope(recentSmoothed);

      // 3. Back-calculate TDEE
      const calculatedTDEE = calculateBackCalculatedTDEE(intake, slope);

      // 4. Get BMR for safety floor
      const lastEntry = sortedEntries[sortedEntries.length-1];
      // Convert weight to kg based on its actual unit, not height unit
      const weightKg = lastEntry.unit === 'kg' ? lastEntry.weight : lastEntry.weight * LBS_TO_KG;
      const heightCm = settings.heightUnit === 'in' ? settings.height * 2.54 : settings.height;
      const bmr = calculateBMR(weightKg, heightCm, settings.age, settings.gender);

      // 5. Suggest target - normalize currentWeight to lbs for consistency
      const currentWeightLbs = lastEntry.unit === 'kg' ? lastEntry.weight * KG_TO_LBS : lastEntry.weight;
      const suggestion = calculateSuggestedIntake({
        currentTDEE: calculatedTDEE,
        goalLbsPerWeek: settings.targetLossRate || 1,
        lastSuggestedIntake: settings.lastSuggestedIntake,
        bmr,
        gender: settings.gender,
        currentWeight: settings.currentWeight || currentWeightLbs
      });

      // 6. Save check-in and update settings
      const checkIn: PaceCoachCheckIn = {
        user_id: userId,
        date: new Date().toISOString(),
        averageIntake: intake,
        targetLossRate: settings.targetLossRate || 1,
        suggestedIntake: suggestion,
        calculatedTDEE,
        weightSlopeLbsPerDay: slope
      };

      await db.pace_coach_checkins.add(checkIn);

      await updateSettings({
        lastSuggestedIntake: suggestion,
      });

      onComplete(suggestion);
    } catch (err) {
      console.error('Pace Coach check-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process check-in');
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, averageIntake, settings, onComplete, updateSettings]);

  return (
    <div className="p-4 bg-theme-bg-tertiary/30 rounded-xl border border-white/5 animate-in fade-in zoom-in duration-300">
      <h3 className="text-sm font-bold text-theme-text-primary mb-2 flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">📊</span> Pace Coach Check-in
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="checkin-intake" className="text-xs text-theme-text-tertiary mb-2 block">
            Over the past 10–14 days, what was your average daily calorie intake?
          </label>
          
          {isLoadingSuggestion ? (
            <div className="text-xs text-theme-text-tertiary italic animate-pulse">
              Loading your logging data...
            </div>
          ) : hasSufficientData && suggestedIntake !== null ? (
            <div className="flex items-start gap-2 mb-2 p-2.5 bg-theme-accent/10 rounded-lg border border-theme-accent/20">
              <Info className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-theme-text-secondary">
                  <strong className="text-theme-text-primary">Based on your logs:</strong> You logged <strong>{daysLogged} days</strong> with an average of <strong className="text-theme-accent">{suggestedIntake} kcal/day</strong>
                </p>
                <p className="text-[10px] text-theme-text-tertiary mt-1">
                  This is pre-filled below. Adjust if needed or enter your own estimate.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 mb-2 p-2.5 bg-theme-bg-tertiary/50 rounded-lg border border-theme-bg-border/50">
              <Info className="w-4 h-4 text-theme-text-tertiary shrink-0 mt-0.5" />
              <p className="text-xs text-theme-text-tertiary">
                Not enough logging data to suggest an average. Please estimate your average daily intake over the past 10-14 days.
              </p>
            </div>
          )}
        </div>

        {error && <FormMessage type="error" message={error} />}
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="checkin-intake"
              type="number"
              value={averageIntake}
              onChange={(e) => setAverageIntake(e.target.value)}
              placeholder="e.g. 1800"
              className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-theme-accent focus:border-transparent"
              required
              autoFocus={!hasSufficientData}
            />
            <span className="absolute right-3 top-2 text-xs text-theme-text-tertiary" aria-hidden="true">kcal/day</span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-theme-accent hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? '...' : 'Save'}
          </button>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] text-theme-text-tertiary hover:text-theme-text-secondary transition-colors uppercase tracking-widest font-bold"
        >
          Skip for now
        </button>
      </form>
    </div>
  );
}
