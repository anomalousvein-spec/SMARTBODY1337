import React, { useState, useCallback } from "react";
import { db } from "../../db/database";
import { MacroEntry } from "../../db/models";
import { formatDateForInput } from "../../utils/dates";
import {
  InputField,
  TextAreaField,
  FormMessage,
  SubmitButton,
} from "../../components/Form";
import { Card } from "../../components";
import { validateCalories, validateMacro } from "../../utils/validation";
import { sanitizeInput } from "../../utils/sanitize";
import { useApp } from "../../context/AppContext";

interface MacroLoggerProps {
  onMacroLogged?: () => void;
}

export function MacroLogger({ onMacroLogged }: MacroLoggerProps) {
  const { user } = useApp();
  const userId = user.id;
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fats, setFats] = useState<string>("");
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      const calVal = validateCalories(calories);
      if (!calVal.valid) {
        setError(calVal.error!);
        return;
      }

      const protVal = validateMacro(protein, "protein");
      if (!protVal.valid) {
        setError(protVal.error!);
        return;
      }

      setIsSaving(true);

      try {
        const entry: Omit<MacroEntry, "id"> = {
          user_id: userId,
          date: new Date(date).toISOString(),
          calories: parseInt(calories),
          protein: parseInt(protein) || 0,
          carbs: parseInt(carbs) || 0,
          fats: parseInt(fats) || 0,
          notes: sanitizeInput(notes) || undefined,
        };

        await db.macro_logs.add(entry);

        setSuccess(true);
        setCalories("");
        setProtein("");
        setCarbs("");
        setFats("");
        setNotes("");
        onMacroLogged?.();
      } catch (err) {
        console.error("Failed to save macros:", err);
        setError("Failed to save macros.");
      } finally {
        setIsSaving(false);
      }
    },
    [userId, calories, protein, carbs, fats, date, notes, onMacroLogged],
  );

  return (
    <Card className="card-hover">
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

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Calories"
            type="number"
            value={calories}
            onChange={setCalories}
            placeholder="0"
            required
          />
          <InputField
            label="Protein (g)"
            type="number"
            value={protein}
            onChange={setProtein}
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Carbs (g)"
            type="number"
            value={carbs}
            onChange={setCarbs}
            placeholder="0"
          />
          <InputField
            label="Fats (g)"
            type="number"
            value={fats}
            onChange={setFats}
            placeholder="0"
          />
        </div>

        <TextAreaField
          label="Notes (optional)"
          value={notes}
          onChange={setNotes}
          placeholder="What did you eat?"
          rows={2}
        />

        {error && <FormMessage type="error" message={error} />}
        {success && <FormMessage type="success" message="Macros logged!" />}

        <SubmitButton isSubmitting={isSaving} idleText="Log Macros" />
      </form>
    </Card>
  );
}
