import { useState, useCallback, useEffect } from 'react';
import { db } from '../db/database';
import { TDEESettings, PaceCoachCheckIn } from '../db/models';
import { isCheckInDue } from '../utils/paceCoach';

/**
 * Custom hook to manage Pace Coach data and state
 * @param userId - The ID of the user
 * @returns Object containing settings, check-in data, loading state, and refresh function
 */
export function usePaceCoach(userId: string) {
  const [settings, setSettings] = useState<TDEESettings | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<PaceCoachCheckIn | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const s = await db.tdee_settings.get('global');
      if (s) {
        setSettings(s);

        const checkins = await db.pace_coach_checkins
          .where('user_id')
          .equals(userId)
          .reverse()
          .toArray();

        setCheckInCount(checkins.length);
        if (checkins.length > 0) {
          setLastCheckIn(checkins[0]);
        }

        // Auto-show form if due and enabled
        if (s.paceCoachEnabled && isCheckInDue(checkins[0]?.date, s.paceCoachReminderDays)) {
          setShowCheckInForm(true);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Pace Coach data';
      console.error('Error loading Pace Coach data:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    settings,
    lastCheckIn,
    checkInCount,
    showCheckInForm,
    setShowCheckInForm,
    isLoading,
    error,
    refresh: loadData
  };
}
