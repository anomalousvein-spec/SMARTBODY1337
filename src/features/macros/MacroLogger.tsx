import React, { useState, useCallback, useMemo } from 'react';
import { db } from '../../db/database';
import { MacroEntry } from '../../db/models';
import { formatDateForInput } from '../../utils/dates';
import { InputField, TextAreaField, FormMessage, SubmitButton } from '../../components/Form';
import { validateCalories, validateMacro } from '../../utils/validation';
import { sanitizeInput } from '../../utils/sanitize';
import { MIN_CALORIES, MAX_CALORIES, MIN_MACRO_G, MAX_MACRO_G } from '../../config/constants';

interface MacroLoggerProps {
  /** User ID for storing macro logs */
  userId: string;
  /** Callback fired when macros are successfully logged */
  onMacroLogged?: () => void;
}

/**
 * Component for logging daily nutritional intake
 */
export function MacroLogger({ userId, onMacroLogged }: MacroLoggerProps) {
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fats, setFats] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate all fields
    const calVal = validateCalories(calories);
    if (!calVal.valid) { setError(calVal.error!); return; }

    const pVal = validateMacro(protein, 'protein');
    if (!pVal.valid) { setError(pVal.error!); return; }

    const cVal = validateMacro(carbs, 'carbs');
    if (!cVal.valid) { setError(cVal.error!); return; }

    const fVal = validateMacro(fats, 'fats');
    if (!fVal.valid) { setError(fVal.error!); return; }

    setIsSaving(true);

    try {
      const entry: MacroEntry = {
        user_id: userId,
        date: new Date(date).toISOString(),
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats),
        notes: sanitizeInput(notes) || undefined,
      };

      await db.macro_logs.add(entry);
      setSuccess(true);
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setNotes('');
      onMacroLogged?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save macro entry. Please try again.';
      setError(errorMessage);
      console.error('Error saving macros:', err);
    } finally {
      setIsSaving(false);
    }
  }, [userId, date, calories, protein, carbs, fats, notes, onMacroLogged]);

  // Calculate macro percentages
  const percentages = useMemo(() => {
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const f = parseFloat(fats) || 0;
    const total = (p * 4) + (c * 4) + (f * 9);

    if (total === 0) return { protein: '0', carbs: '0', fats: '0' };

    return {
      protein: ((p * 4) / total * 100).toFixed(1),
      carbs: ((c * 4) / total * 100).toFixed(1),
      fats: ((f * 9) / total * 100).toFixed(1)
    };
  }, [protein, carbs, fats]);

  return (
    <div className="glass card-hover rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        Log Macros
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <InputField
          label="Date"
          type="date"
          value={date}
          onChange={setDate}
          required
        />

        <InputField
          label="Calories"
          type="number"
          value={calories}
          onChange={setCalories}
          placeholder="2000"
          min={MIN_CALORIES}
          max={MAX_CALORIES}
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <InputField
              label="Protein (g)"
              type="number"
              value={protein}
              onChange={setProtein}
              placeholder="150"
              min={MIN_MACRO_G}
              max={MAX_MACRO_G}
              step="1"
              required
            />
            <p className="text-xs text-theme-text-tertiary mt-1">{percentages.protein}% of macros</p>
          </div>

          <div>
            <InputField
              label="Carbs (g)"
              type="number"
              value={carbs}
              onChange={setCarbs}
              placeholder="200"
              min={MIN_MACRO_G}
              max={MAX_MACRO_G}
              step="1"
              required
            />
            <p className="text-xs text-theme-text-tertiary mt-1">{percentages.carbs}% of macros</p>
          </div>

          <div>
            <InputField
              label="Fats (g)"
              type="number"
              value={fats}
              onChange={setFats}
              placeholder="70"
              min={MIN_MACRO_G}
              max={MAX_MACRO_G}
              step="1"
              required
            />
            <p className="text-xs text-theme-text-tertiary mt-1">{percentages.fats}% of macros</p>
          </div>
        </div>

        <TextAreaField
          label="Notes (optional)"
          value={notes}
          onChange={setNotes}
          placeholder="Meal notes or observations"
          rows={2}
        />

        {error && <FormMessage type="error" message={error} />}
        {success && <FormMessage type="success" message="Macros logged successfully!" />}

        <SubmitButton
          isSubmitting={isSaving}
          idleText="Log Macros"
        />
      </form>
    </div>
  );
}
