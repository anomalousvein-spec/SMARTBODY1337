import { useState, useCallback, useEffect } from "react";
import { db } from "../db/database";
import { WeightEntry } from "../db/models";

/**
 * Hook to fetch weights for a specific user with date range support.
 * @param userId - The ID of the user to fetch weights for.
 * @param startDate - Optional start date for filtering.
 * @param endDate - Optional end date for filtering.
 */
export function useWeights(userId: string, startDate?: Date, endDate?: Date) {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWeights = useCallback(async (isMounted: boolean) => {
    setIsLoading(true);
    try {
      let query = db.weights.where("[user_id+date]");

      const startStr = startDate ? startDate.toISOString() : "0";
      const endStr = endDate ? endDate.toISOString() : "9";

      const results = await query
        .between([userId, startStr], [userId, endStr])
        .toArray();

      if (!isMounted) return;

      // Sort by date to ensure chronological order (oldest first)
      const sortedResults = results.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setWeights(sortedResults);
    } catch (error) {
      console.error("Error loading weights:", error);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [userId, startDate, endDate]);

  useEffect(() => {
    let isMounted = true;
    loadWeights(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadWeights]);

  return {
    weights,
    isLoading,
    refresh: () => loadWeights(true),
  };
}
