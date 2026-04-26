import { useState, useCallback } from 'react';
import { WeightEntry } from '../../db/models';

/**
 * Hook to manage the state of editing a weight entry.
 * Shared across components via prop drilling or context if needed,
 * but here used to centralize editing logic.
 */
export function useEditWeight() {
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);

  const startEditing = useCallback((entry: WeightEntry) => {
    setEditingWeight(entry);
  }, []);

  const clearEditing = useCallback(() => {
    setEditingWeight(null);
  }, []);

  return {
    editingWeight,
    startEditing,
    clearEditing
  };
}
