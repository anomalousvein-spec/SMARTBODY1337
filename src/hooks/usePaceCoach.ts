import { useState, useCallback, useEffect } from "react";
import { db } from "../db/database";
import { PaceCoachCheckIn } from "../db/models";
import { isCheckInDue } from "../utils/paceCoach";
import { useTDEESettings } from "./useTDEESettings";

/**
 * Custom hook to manage Pace Coach data and state
 * @param userId - The ID of the user
 * @returns Object containing settings, check-in data, loading state, and refresh function
 */
export function usePaceCoach(userId: string) {
  const {
    settings,
    isLoading: settingsLoading,
    error: settingsError,
    refresh: refreshSettings,
  } = useTDEESettings(userId);
  const [lastCheckIn, setLastCheckIn] = useState<PaceCoachCheckIn | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [isLoadingCheckins, setIsLoadingCheckins] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCheckins = useCallback(async (isMounted: boolean) => {
    setIsLoadingCheckins(true);
    setError(null);
    try {
      const checkins = await db.pace_coach_checkins
        .where("user_id")
        .equals(userId)
        .reverse()
        .toArray();

      if (!isMounted) return;

      setCheckInCount(checkins.length);
      if (checkins.length > 0) {
        setLastCheckIn(checkins[0]);
      }

      // Auto-show form if due and enabled
      if (
        settings?.paceCoachEnabled &&
        isCheckInDue(checkins[0]?.date, settings.paceCoachReminderDays)
      ) {
        setShowCheckInForm(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load Pace Coach check-ins";
      console.error("Error loading Pace Coach check-ins:", err);
      if (isMounted) setError(errorMessage);
    } finally {
      if (isMounted) setIsLoadingCheckins(false);
    }
  }, [userId, settings]);

  useEffect(() => {
    let isMounted = true;
    loadCheckins(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadCheckins]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshSettings(), loadCheckins(true)]);
  }, [refreshSettings, loadCheckins]);

  return {
    settings,
    lastCheckIn,
    checkInCount,
    showCheckInForm,
    setShowCheckInForm,
    isLoading: settingsLoading || isLoadingCheckins,
    error: settingsError || error,
    refresh,
  };
}
