import { useState, useCallback, useEffect } from "react";
import { db } from "../db/database";
import { TDEESettings } from "../db/models";

/**
 * Hook to manage TDEE settings for a specific user.
 * Centralizes fetching, updating, and loading states.
 * @param userId - The ID of the user
 */
export function useTDEESettings(userId: string) {
  const [settings, setSettings] = useState<TDEESettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async (isMounted: boolean) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Keying by userId to support multi-user architecture
      const s = await db.tdee_settings.get(userId);
      if (s) {
        if (isMounted) setSettings(s);
      } else {
        const globalSettings = await db.tdee_settings.get("global");
        if (globalSettings && globalSettings.user_id === userId) {
          const migrated = { ...globalSettings, id: userId };
          await db.tdee_settings.put(migrated);
          await db.tdee_settings.delete("global");
          if (isMounted) setSettings(migrated);
        } else {
          if (isMounted) setSettings(null);
        }
      }
    } catch (err) {
      console.error("Error loading TDEE settings:", err);
      if (isMounted) setError("Failed to load settings");
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, [userId]);

  const updateSettings = useCallback(
    async (newSettings: Partial<TDEESettings>) => {
      if (!userId) return;
      try {
        const current = (await db.tdee_settings.get(userId)) || {
          id: userId,
          user_id: userId,
          age: 30,
          gender: "male",
          height: 70,
          heightUnit: "in",
          activityLevel: "moderately_active",
          lastUpdated: new Date().toISOString(),
        };

        const updated: TDEESettings = {
          ...current,
          ...newSettings,
          id: userId,
          user_id: userId,
          lastUpdated: new Date().toISOString(),
        };

        await db.tdee_settings.put(updated);
        setSettings(updated);
        return updated;
      } catch (err) {
        console.error("Error updating TDEE settings:", err);
        throw err;
      }
    },
    [userId],
  );

  useEffect(() => {
    let isMounted = true;
    loadSettings(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refresh: () => loadSettings(true),
  };
}
