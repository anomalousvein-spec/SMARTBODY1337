import { useState, useCallback, useEffect } from 'react';
import { db } from '../db/database';
import { WeightEntry } from '../db/models';

/**
 * Hook to fetch weight entries for a specific user.
 * @param userId - The ID of the user to fetch weights for.
 * @param startDate - Optional start date for filtering.
 * @param endDate - Optional end date for filtering.
 */
export function useWeights(userId: string, startDate?: Date, endDate?: Date) {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWeights = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = db.weights.where('[user_id+date]');

      const startStr = startDate ? startDate.toISOString() : '0';
      const endStr = endDate ? endDate.toISOString() : '9';

      const results = await query.between([userId, startStr], [userId, endStr]).toArray();
      setWeights(results);
    } catch (error) {
      console.error('Error loading weights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, startDate, endDate]);

  useEffect(() => {
    loadWeights();
  }, [loadWeights]);

  return {
    weights,
    isLoading,
    refresh: loadWeights
  };
}
