import React, { useState, useCallback } from 'react';
import { db } from '../../db/database';
import { WaistEntry } from '../../db/models';
import { formatDateForInput } from '../../utils/dates';
import { InputField, SelectField, TextAreaField, FormMessage, SubmitButton } from '../../components/Form';
import { validateWaist } from '../../utils/validation';
import { sanitizeInput } from '../../utils/sanitize';
import { MIN_WAIST_IN, MAX_WAIST_IN } from '../../config/constants';

interface WaistLoggerProps {
  /** User ID for storing measurements */
  userId: string;
  /** Callback fired when measurement is successfully logged */
  onWaistLogged?: () => void;
}

/**
 * Component for logging waist measurements with edit functionality
 */
export function WaistLogger({ userId, onWaistLogged }: WaistLoggerProps) {
  const [measurement, setMeasurement] = useState<string>('');
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validation = validateWaist(measurement);
    if (!validation.valid) {
      setError(validation.error || 'Invalid measurement');
      return;
    }

    setIsSaving(true);

    try {
      const entry: Omit<WaistEntry, 'id'> = {
        user_id: userId,
        date: new Date(date).toISOString(),
        measurement: parseFloat(measurement),
        unit,
        notes: sanitizeInput(notes) || undefined,
      };

      if (editingId !== null) {
        await db.waist_measurements.update(editingId, entry);
        setEditingId(null);
      } else {
        await db.waist_measurements.add(entry);
      }

      setSuccess(true);
      setMeasurement('');
      setNotes('');
      setDate(formatDateForInput(new Date()));
      onWaistLogged?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save waist measurement. Please try again.';
      setError(errorMessage);
      console.error('Error saving waist measurement:', err);
    } finally {
      setIsSaving(false);
    }
  }, [userId, measurement, date, unit, notes, onWaistLogged, editingId]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setMeasurement('');
    setNotes('');
    setDate(formatDateForInput(new Date()));
    setError(null);
    setSuccess(false);
  }, []);

  return (
    <div className="glass card-hover rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        {editingId !== null ? 'Edit Waist Measurement' : 'Log Waist Measurement'}
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
            label="Waist Measurement"
            type="number"
            value={measurement}
            onChange={setMeasurement}
            placeholder="0.0"
            min={MIN_WAIST_IN}
            max={MAX_WAIST_IN}
            step="0.1"
            required
            error={error}
          />

          <SelectField
            label="Unit"
            value={unit}
            onChange={(val) => setUnit(val as 'in' | 'cm')}
            options={[
              { value: 'in', label: 'inches' },
              { value: 'cm', label: 'cm' },
            ]}
          />
        </div>

        <TextAreaField
          label="Notes (optional)"
          value={notes}
          onChange={setNotes}
          placeholder="Any observations?"
          rows={2}
        />

        {error && <FormMessage type="error" message={error} />}
        {success && <FormMessage type="success" message={editingId !== null ? 'Waist measurement updated!' : 'Waist measurement logged successfully!'} />}

        <div className="flex gap-2">
          <SubmitButton
            isSubmitting={isSaving}
            idleText={editingId !== null ? 'Update Measurement' : 'Log Measurement'}
          />
          {editingId !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-lg bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-secondary transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
