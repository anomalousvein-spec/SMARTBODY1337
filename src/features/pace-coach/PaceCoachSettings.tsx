import React from 'react';
import { TDEESettings } from '../../db/models';
import { db } from '../../db/database';

interface PaceCoachSettingsProps {
  settings: TDEESettings;
  onUpdate: (updatedSettings: TDEESettings) => void;
}

export function PaceCoachSettings({ settings, onUpdate }: PaceCoachSettingsProps) {
  const handleToggle = async (enabled: boolean) => {
    const updated = { ...settings, paceCoachEnabled: enabled };
    await db.tdee_settings.put(updated);
    onUpdate(updated);
  };

  const handleReminderChange = async (days: number) => {
    const updated = { ...settings, paceCoachReminderDays: days };
    await db.tdee_settings.put(updated);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-md font-semibold text-theme-text-primary">Pace Coach</h3>
          <p className="text-xs text-theme-text-tertiary">Let your weight trend guide your calorie target</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!!settings.paceCoachEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
            aria-label="Enable Pace Coach feature"
          />
          <div className="w-11 h-6 bg-theme-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-accent"></div>
        </label>
      </div>

      {settings.paceCoachEnabled && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label htmlFor="checkin-frequency" className="block text-sm font-medium text-theme-text-secondary mb-1">
            Check-in Frequency
          </label>
          <select
            id="checkin-frequency"
            value={settings.paceCoachReminderDays || 10}
            onChange={(e) => handleReminderChange(parseInt(e.target.value))}
            className="w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Every 7 days</option>
            <option value={10}>Every 10 days</option>
            <option value={14}>Every 14 days</option>
          </select>
          <p className="mt-2 text-[10px] text-theme-text-tertiary italic">
            "We'll ask you once every {settings.paceCoachReminderDays || 10} days to note your average daily calorie intake. No logging required."
          </p>
        </div>
      )}
    </div>
  );
}
