import React, { useState, useCallback } from "react";
import { db } from "../../db/database";
import { WaistEntry } from "../../db/models";
import { formatDateForInput } from "../../utils/dates";
import {
  InputField,
  SelectField,
  TextAreaField,
  FormMessage,
  SubmitButton,
} from "../../components/Form";
import { Card } from "../../components";
import { validateWaist } from "../../utils/validation";
import { sanitizeInput } from "../../utils/sanitize";
import { MIN_WAIST_IN, MAX_WAIST_IN } from "../../config/constants";
import { useApp } from "../../context/AppContext";

interface WaistLoggerProps {
  onWaistLogged?: () => void;
}

export function WaistLogger({ onWaistLogged }: WaistLoggerProps) {
  const { user } = useApp();
  const userId = user.id;
  const [measurement, setMeasurement] = useState<string>("");
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      const validation = validateWaist(measurement);
      if (!validation.valid) {
        setError(validation.error || "Invalid measurement");
        return;
      }

      setIsSaving(true);

      try {
        const entry: Omit<WaistEntry, "id"> = {
          user_id: userId,
          date: new Date(date).toISOString(),
          measurement: parseFloat(measurement),
          unit,
          notes: sanitizeInput(notes) || undefined,
        };

        await db.waist_measurements.add(entry);

        setSuccess(true);
        setMeasurement("");
        setNotes("");
        setDate(formatDateForInput(new Date()));
        onWaistLogged?.();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to save waist measurement.";
        setError(errorMessage);
      } finally {
        setIsSaving(false);
      }
    },
    [userId, measurement, date, unit, notes, onWaistLogged],
  );

  return (
    <Card className="card-hover">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        Log Waist
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
            label="Measurement"
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
            onChange={(val) => setUnit(val as "in" | "cm")}
            options={[
              { value: "in", label: "inches" },
              { value: "cm", label: "cm" },
            ]}
          />
        </div>

        <TextAreaField
          label="Notes (optional)"
          value={notes}
          onChange={setNotes}
          placeholder="Any specific context?"
          rows={2}
        />

        {error && <FormMessage type="error" message={error} />}
        {success && (
          <FormMessage type="success" message="Waist measurement logged!" />
        )}

        <SubmitButton isSubmitting={isSaving} idleText="Log Waist" />
      </form>
    </Card>
  );
}
