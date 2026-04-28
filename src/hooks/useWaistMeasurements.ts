import { useState, useCallback, useEffect } from "react";
import { db } from "../db/database";
import { WaistEntry } from "../db/models";

/**
 * Hook to fetch waist measurements for a specific user.
 * @param userId - The ID of the user to fetch measurements for.
 * @param startDate - Optional start date for filtering.
 * @param endDate - Optional end date for filtering.
 */
export function useWaistMeasurements(
  userId: string,
  startDate?: Date,
  endDate?: Date,
) {
  const [measurements, setMeasurements] = useState<WaistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMeasurements = useCallback(async (isMounted: boolean) => {
    setIsLoading(true);
    try {
      let query = db.waist_measurements.where("[user_id+date]");

      const startStr = startDate ? startDate.toISOString() : "0";
      const endStr = endDate ? endDate.toISOString() : "9";

      const results = await query
        .between([userId, startStr], [userId, endStr])
        .toArray();

      if (!isMounted) return;
      setMeasurements(results);
    } catch (error) {
      console.error("Error loading waist measurements:", error);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [userId, startDate, endDate]);

  useEffect(() => {
    let isMounted = true;
    loadMeasurements(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadMeasurements]);

  return {
    measurements,
    isLoading,
    refresh: () => loadMeasurements(true),
  };
}
