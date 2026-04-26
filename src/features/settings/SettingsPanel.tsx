import React from 'react';
import { Trash2, Shield, Info, Database } from 'lucide-react';
import { Card } from '../../components';
import { db } from '../../db/database';
import { APP_VERSION } from '../../config/constants';

/**
 * SettingsPanel provides administrative controls and app information.
 * Refactored to match the app's visual style and architecture.
 */
export function SettingsPanel() {
  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
      try {
        await Promise.all([
          db.weights.clear(),
          db.waist_measurements.clear(),
          db.macro_logs.clear(),
          db.tdee_settings.clear(),
          db.pace_coach_checkins.clear()
        ]);
        localStorage.clear();
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black uppercase tracking-tight text-theme-text-primary">
          Settings
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest text-theme-text-tertiary">
          Configure your experience
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-tertiary px-1">
          Data Management
        </h3>

        <Card className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-theme-text-primary">Clear Local Data</p>
              <p className="text-[10px] text-theme-text-tertiary">Permanently delete all logs and settings</p>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
          >
            Clear
          </button>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-theme-text-primary">Local Storage Only</p>
            <p className="text-[10px] text-theme-text-tertiary">All your health data stays on this device</p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-tertiary px-1">
          Privacy & Security
        </h3>

        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-theme-text-primary">Private by Design</p>
            <p className="text-[10px] text-theme-text-tertiary">No tracking or external data processing</p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-tertiary px-1">
          About
        </h3>

        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-theme-accent/10 text-theme-accent">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-theme-text-primary uppercase tracking-wider">
              SmartBody<span className="text-theme-accent">1337</span>
            </p>
            <p className="text-[10px] text-theme-text-tertiary">Version {APP_VERSION}</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
