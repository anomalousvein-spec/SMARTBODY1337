import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { usePaceCoach } from '../../hooks/usePaceCoach';
import { isCheckInDue, getDaysUntilCheckIn } from '../../utils/paceCoach';
import { Card } from '../../components';
import { useApp } from '../../context/AppContext';

interface CheckInIndicatorProps {
  onNavigateToPaceCoach: () => void;
}

export function CheckInIndicator({ onNavigateToPaceCoach }: CheckInIndicatorProps) {
  const { user } = useApp();
  const { settings, lastCheckIn, isLoading } = usePaceCoach(user.id);

  if (isLoading || !settings?.paceCoachEnabled) return null;

  const reminderDays = settings.paceCoachReminderDays || 14;
  const checkInIsDue = isCheckInDue(lastCheckIn?.date, reminderDays);
  const daysUntilCheckIn = getDaysUntilCheckIn(lastCheckIn?.date, reminderDays);

  // Don't show if no check-ins yet (first one starts after account creation)
  if (!lastCheckIn?.date) return null;

  // Show indicator only when due or within 2 days of being due
  if (!checkInIsDue && daysUntilCheckIn > 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card 
        className={`card-hover cursor-pointer transition-all ${
          checkInIsDue 
            ? 'bg-gradient-to-r from-theme-accent/20 to-theme-accent/10 border-theme-accent/30' 
            : 'bg-theme-bg-tertiary/30 border-theme-bg-border/50'
        }`}
        onClick={onNavigateToPaceCoach}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              checkInIsDue 
                ? 'bg-theme-accent/20' 
                : 'bg-theme-bg-tertiary/50'
            }`}>
              <Sparkles className={`w-4 h-4 ${
                checkInIsDue 
                  ? 'text-theme-accent animate-pulse' 
                  : 'text-theme-text-tertiary'
              }`} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-theme-text-primary">
                {checkInIsDue ? 'Check-in Ready!' : 'Upcoming Check-in'}
              </h4>
              <p className="text-xs text-theme-text-tertiary">
                {checkInIsDue 
                  ? 'Time to update your Pace Coach data' 
                  : `${daysUntilCheckIn} day${daysUntilCheckIn !== 1 ? 's' : ''} until next check-in`}
              </p>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 ${
            checkInIsDue 
              ? 'text-theme-accent' 
              : 'text-theme-text-tertiary'
          }`} />
        </div>
      </Card>
    </motion.div>
  );
}
