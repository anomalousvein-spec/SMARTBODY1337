import React, { useState, useCallback, useEffect } from "react";
import { db } from "../../db/database";
import { WeightEntry } from "../../db/models";
import { formatDateForInput } from "../../utils/dates";
import {
  InputField,
  SelectField,
  TextAreaField,
  FormMessage,
  SubmitButton,
} from "../../components/Form";
import { Card } from "../../components";
import { validateWeight } from "../../utils/validation";
import { sanitizeInput } from "../../utils/sanitize";
import { MIN_WEIGHT_LBS, MAX_WEIGHT_LBS } from "../../config/constants";
import { useApp } from "../../context/AppContext";

interface WeightLoggerProps {
  onWeightLogged?: () => void;
  editingEntry?: WeightEntry | null;
  onCancelEdit?: () => void;
}

export function WeightLogger({
  onWeightLogged,
  editingEntry,
  onCancelEdit,
}: WeightLoggerProps) {
  const { user } = useApp();
  const userId = user.id;
  const [weight, setWeight] = useState<string>("");
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setWeight(editingEntry.weight.toString());
      setDate(formatDateForInput(new Date(editingEntry.date)));
      setUnit(editingEntry.unit);
      setNotes(editingEntry.notes || "");
      setError(null);
      setSuccess(false);
    }
  }, [editingEntry]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      const validation = validateWeight(weight);
      if (!validation.valid) {
        setError(validation.error || "Invalid weight");
        return;
      }

      setIsSaving(true);
      try {
        const entry: Omit<WeightEntry, "id"> = {
          user_id: userId,
          date: new Date(date).toISOString(),
          weight: parseFloat(weight),
          unit,
          notes: sanitizeInput(notes) || undefined,
        };

        if (editingEntry?.id) {
          await db.weights.update(editingEntry.id, entry);
        } else {
          await db.weights.add(entry);
        }

        setSuccess(true);
        if (!editingEntry) {
          setWeight("");
          setNotes("");
          setDate(formatDateForInput(new Date()));
        }
        onWeightLogged?.();
      } catch (err) {
        console.error("Failed to save weight entry:", err);
        setError("Failed to save weight entry.");
      } finally {
        setIsSaving(false);
      }
    },
    [userId, weight, date, unit, notes, onWeightLogged, editingEntry],
  );

  const handleCancel = () => {
    if (editingEntry) {
      onCancelEdit?.();
    }
    setWeight("");
    setNotes("");
    setDate(formatDateForInput(new Date()));
    setError(null);
    setSuccess(false);
  };

  return (
    <Card className="card-hover">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        {editingEntry ? "Edit Weight Entry" : "Log Weight"}
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
            onChange={(val) => setUnit(val as "lbs" | "kg")}
            options={[
              { value: "lbs", label: "lbs" },
              { value: "kg", label: "kg" },
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
        {success && (
          <FormMessage
            type="success"
            message={editingEntry ? "Weight updated!" : "Weight logged!"}
          />
        )}
        <div className="flex gap-2">
          <SubmitButton
            isSubmitting={isSaving}
            idleText={editingEntry ? "Update Weight" : "Log Weight"}
          />
          {(editingEntry || weight) && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-secondary transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
