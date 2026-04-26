import React, { useState, useCallback } from 'react';
import { db } from '../../db/database';
import { WeightEntry } from '../../db/models';
import { formatDateForInput } from '../../utils/dates';
import { InputField, SelectField, TextAreaField, FormMessage, SubmitButton } from '../../components/Form';
import { validateWeight } from '../../utils/validation';
import { sanitizeInput } from '../../utils/sanitize';
import { MIN_WEIGHT_LBS, MAX_WEIGHT_LBS } from '../../config/constants';

interface WeightLoggerProps {
  /** User ID for storing weight entries */
  userId: string;
  /** Callback fired when weight is successfully logged */
  onWeightLogged?: () => void;
}

/**
 * Component for logging daily body weight
 */
export function WeightLogger({ userId, onWeightLogged }: WeightLoggerProps) {
  const [weight, setWeight] = useState<string>('');
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validation = validateWeight(weight);
    if (!validation.valid) {
      setError(validation.error || 'Invalid weight');
      return;
    }

    setIsSaving(true);

    try {
      const entry: WeightEntry = {
        user_id: userId,
        date: new Date(date).toISOString(),
        weight: parseFloat(weight),
        unit,
        notes: sanitizeInput(notes) || undefined,
      };

      await db.weights.add(entry);
      setSuccess(true);
      setWeight('');
      setNotes('');
      onWeightLogged?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save weight entry. Please try again.';
      setError(errorMessage);
      console.error('Error saving weight:', err);
    } finally {
      setIsSaving(false);
    }
  }, [userId, weight, date, unit, notes, onWeightLogged]);

  return (
    <div className="glass card-hover rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        Log Weight
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <InputField
          label="Date"
          type="date"
          value={date}
          onChange={setDate}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Weight"
            type="number"
            value={weight}
            onChange={setWeight}
            placeholder="0.0"
            min={MIN_WEIGHT_LBS}
            max={MAX_WEIGHT_LBS}
            step="0.1"
            required
            error={error}
          />

          <SelectField
            label="Unit"
            value={unit}
            onChange={(val) => setUnit(val as 'lbs' | 'kg')}
            options={[
              { value: 'lbs', label: 'lbs' },
              { value: 'kg', label: 'kg' },
            ]}
          />
        </div>

        <TextAreaField
          label="Notes (optional)"
          value={notes}
          onChange={setNotes}
          placeholder="How are you feeling today?"
          rows={2}
        />

        {error && <FormMessage type="error" message={error} />}
        {success && <FormMessage type="success" message="Weight logged successfully!" />}

        <SubmitButton
          isSubmitting={isSaving}
          idleText="Log Weight"
        />
      </form>
    </div>
  );
}
