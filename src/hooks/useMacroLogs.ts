import { useState, useCallback, useEffect } from "react";
import { db } from "../db/database";
import { MacroEntry } from "../db/models";

/**
 * Hook to fetch macro logs for a specific user.
 * @param userId - The ID of the user to fetch logs for.
 * @param startDate - Optional start date for filtering.
 * @param endDate - Optional end date for filtering.
 */
export function useMacroLogs(userId: string, startDate?: Date, endDate?: Date) {
  const [logs, setLogs] = useState<MacroEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async (isMounted: boolean) => {
    setIsLoading(true);
    try {
      let query = db.macro_logs.where("[user_id+date]");

      const startStr = startDate ? startDate.toISOString() : "0";
      const endStr = endDate ? endDate.toISOString() : "9";

      const results = await query
        .between([userId, startStr], [userId, endStr])
        .toArray();

      if (!isMounted) return;
      setLogs(results);
    } catch (error) {
      console.error("Error loading macro logs:", error);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [userId, startDate, endDate]);

  useEffect(() => {
    let isMounted = true;
    loadLogs(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadLogs]);

  return {
    logs,
    isLoading,
    refresh: () => loadLogs(true),
  };
}
