import React, { useState, useCallback } from 'react';
import { db } from '../../db/database';
import { TDEESettings, PaceCoachCheckIn } from '../../db/models';
import { calculateTrendSlope, calculateBackCalculatedTDEE, calculateSuggestedIntake } from '../../utils/paceCoach';
import { calculateMovingAverage, calculateBMR } from '../../utils/calculations';
import { LBS_TO_KG, KG_TO_LBS } from '../../config/constants';
import { FormMessage } from '../../components/Form';
import { validateCalories } from '../../utils/validation';
import { MIN_WEIGHT_ENTRIES_FOR_CHECKIN, TREND_CALCULATION_DAYS } from '../../config/constants';
import { useTDEESettings } from '../../hooks/useTDEESettings';

interface CheckInFormProps {
  userId: string;
  settings: TDEESettings;
  onComplete: (suggestion: number) => void;
  onCancel: () => void;
}

export function CheckInForm({ userId, settings, onComplete, onCancel }: CheckInFormProps) {
  const { updateSettings } = useTDEESettings(userId);
  const [averageIntake, setAverageIntake] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        calculatedTDEE
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
        <label htmlFor="checkin-intake" className="text-xs text-theme-text-tertiary mb-4 block">
          Over the past 10–14 days, what was your average daily calorie intake?
        </label>

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
              autoFocus
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
