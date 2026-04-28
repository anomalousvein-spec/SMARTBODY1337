import React, { useState, useCallback, useEffect } from "react";
import { db } from "../../db/database";
import { TDEESettings, PaceCoachCheckIn } from "../../db/models";
import {
  calculateTrendSlope,
  calculateBackCalculatedTDEE,
  calculateSuggestedIntake,
  calculateAverageIntakeFromLogs,
} from "../../utils/paceCoach";
import { calculateMovingAverage, calculateBMR } from "../../utils/calculations";
import {
  LBS_TO_KG,
  KG_TO_LBS,
  INCHES_TO_CM,
  MIN_WEIGHT_ENTRIES_FOR_CHECKIN,
  TREND_CALCULATION_DAYS
} from "../../config/constants";
import { FormMessage } from "../../components/Form";
import { validateCalories } from "../../utils/validation";
import { useTDEESettings } from "../../hooks/useTDEESettings";
import { Info } from "lucide-react";

interface CheckInFormProps {
  userId: string;
  settings: TDEESettings;
  lastCheckInDate?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function CheckInForm({ userId, settings, onComplete, onCancel }: CheckInFormProps) {
  const [weight, setWeight] = useState("");
  const [averageIntake, setAverageIntake] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSufficientData, setHasSufficientData] = useState(false);
  const [daysLogged, setDaysLogged] = useState(0);

  useEffect(() => {
    async function checkData() {
      const logs = await db.macro_logs
        .where("user_id")
        .equals(userId)
        .toArray();
      const analysis = calculateAverageIntakeFromLogs(logs, TREND_CALCULATION_DAYS);

      setHasSufficientData(analysis.hasSufficientData);
      setDaysLogged(analysis.daysLogged);

      if (analysis.hasSufficientData) {
        setAverageIntake(analysis.averageCalories.toString());
      }
    }
    checkData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !averageIntake) return;

    setIsSubmitting(true);
    try {
      const currentWeight = parseFloat(weight);
      const intake = parseInt(averageIntake);

      if (isNaN(currentWeight) || isNaN(intake)) {
        throw new Error("Invalid input values");
      }

      // 1. Log the weight
      await db.weights.add({
        user_id: userId,
        date: new Date().toISOString(),
        weight: currentWeight,
        unit: "lbs",
        notes: notes || undefined
      });

      // 2. Fetch recent weights for trend
      const recentWeights = await db.weights
        .where("user_id")
        .equals(userId)
        .toArray();

      const weightValues = recentWeights
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-MIN_WEIGHT_ENTRIES_FOR_CHECKIN)
        .map(w => w.weight);

      const trendSlope = calculateTrendSlope(weightValues);
      const dailyWeightChange = trendSlope; // approximate daily change

      // 3. Calculate suggested intake
      const bmr = calculateBMR(
        currentWeight * LBS_TO_KG,
        settings.heightUnit === 'in' ? settings.height * INCHES_TO_CM : settings.height,
        settings.age,
        settings.gender
      );

      const currentTDEE = calculateBackCalculatedTDEE(intake, dailyWeightChange);
      const goalRate = settings.targetLossRate || 1.0;

      const suggestedIntake = calculateSuggestedIntake({
        currentTDEE,
        goalLbsPerWeek: goalRate,
        lastSuggestedIntake: settings.lastSuggestedIntake,
        bmr,
        gender: settings.gender,
        currentWeight
      });

      // 4. Update settings
      await db.tdee_settings.update(settings.id!, {
        lastSuggestedIntake: suggestedIntake,
        lastUpdated: new Date().toISOString()
      });

      const checkIn: PaceCoachCheckIn = {
        user_id: userId,
        date: new Date().toISOString(),
        averageIntake: intake,
        targetLossRate: goalRate,
        calculatedTDEE: currentTDEE,
        suggestedIntake,
        weightSlopeLbsPerDay: trendSlope
      };

      await db.pace_coach_checkins.add(checkIn);
      onComplete();
    } catch (error) {
      console.error("Check-in error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-theme-accent/10 border border-theme-accent/20">
          <Info className="w-5 h-5 text-theme-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-theme-text-primary">Weekly Check-in</h2>
          <p className="text-xs text-theme-text-tertiary">Review your progress and adjust targets</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="checkin-weight" className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary px-1">
            Current Weight (lbs)
          </label>
          <input
            id="checkin-weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 185.4"
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all outline-none"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkin-intake" className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary px-1">
            Average Daily Calories (Last 7 Days)
          </label>
          <div className="relative">
            <input
              id="checkin-intake"
              type="number"
              value={averageIntake}
              onChange={(e) => setAverageIntake(e.target.value)}
              placeholder="e.g. 2100"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all outline-none"
              required
            />
            {hasSufficientData && (
              <div className="absolute right-3 top-3 px-2 py-0.5 rounded-md bg-success/10 border border-success/20">
                <span className="text-[10px] font-bold text-success uppercase">Auto-calculated</span>
              </div>
            )}
          </div>
          {!hasSufficientData && (
            <p className="text-[10px] text-warning font-medium px-1">
              Insufficient logs ({daysLogged}/7 days). Please enter your average manually.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkin-notes" className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary px-1">
            Notes (Optional)
          </label>
          <textarea
            id="checkin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was your energy? Stress? Sleep?"
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-theme-accent focus:border-transparent transition-all outline-none min-h-[100px] resize-none"
          />
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-theme-accent hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-theme-accent/20"
          >
            {isSubmitting ? "Processing..." : "Complete Check-in"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 text-sm font-bold text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
