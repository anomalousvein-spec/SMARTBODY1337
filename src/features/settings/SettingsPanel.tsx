import React, { useRef } from "react";
import {
  Trash2,
  Shield,
  Info,
  Database,
  Moon,
  Sun,
  Zap,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";
import { Card } from "../../components";
import { db } from "../../db/database";
import { APP_VERSION } from "../../config/constants";
import { useApp, Theme } from "../../context/AppContext";
import { motion } from "framer-motion";

/**
 * SettingsPanel provides administrative controls and app information.
 * Features theme switching, data management, and privacy info.
 */
export function SettingsPanel() {
  const { theme, setTheme } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearData = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all your data? This action is permanent and cannot be undone.",
    );
    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      "Final warning: This will erase all logs, TDEE settings, and body measurements. Proceed?",
    );
    if (!secondConfirmation) return;

    try {
      await Promise.all([
        db.weights.clear(),
        db.waist_measurements.clear(),
        db.macro_logs.clear(),
        db.tdee_settings.clear(),
        db.pace_coach_checkins.clear(),
        db.weekly_metrics.clear(),
        db.user_profiles.clear(),
      ]);
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to clear data:", error);
      alert("An error occurred while clearing data. Please try again.");
    }
  };

  const handleExportData = async () => {
    try {
      const data = {
        weights: await db.weights.toArray(),
        waist: await db.waist_measurements.toArray(),
        macros: await db.macro_logs.toArray(),
        tdee: await db.tdee_settings.toArray(),
        checkins: await db.pace_coach_checkins.toArray(),
        metrics: await db.weekly_metrics.toArray(),
        profiles: await db.user_profiles.toArray(),
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smartbody_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    }
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        const confirmed = window.confirm(
          "This will overwrite existing data with the backup. Continue?",
        );
        if (!confirmed) return;

        // Clear existing
        await Promise.all([
          db.weights.clear(),
          db.waist_measurements.clear(),
          db.macro_logs.clear(),
          db.tdee_settings.clear(),
          db.pace_coach_checkins.clear(),
          db.weekly_metrics.clear(),
          db.user_profiles.clear(),
        ]);

        // Bulk add new
        if (data.weights) await db.weights.bulkAdd(data.weights);
        if (data.waist) await db.waist_measurements.bulkAdd(data.waist);
        if (data.macros) await db.macro_logs.bulkAdd(data.macros);
        if (data.tdee) await db.tdee_settings.bulkAdd(data.tdee);
        if (data.checkins)
          await db.pace_coach_checkins.bulkAdd(data.checkins);
        if (data.metrics) await db.weekly_metrics.bulkAdd(data.metrics);
        if (data.profiles) await db.user_profiles.bulkAdd(data.profiles);

        alert("Data imported successfully!");
        window.location.reload();
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import data. Ensure the file is a valid backup.");
      }
    };
    reader.readAsText(file);
  };

  const themes = [
    {
      id: "default",
      name: "Midnight",
      icon: Moon,
      desc: "Dark Blue",
      accent: "#4D9EFF",
    },
    {
      id: "jewel",
      name: "Jewel",
      icon: Zap,
      desc: "Deep Emerald",
      accent: "#3b82f6",
    },
    {
      id: "amoled",
      name: "AMOLED",
      icon: Sun,
      desc: "Pure Black",
      accent: "#3b82f6",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black uppercase tracking-tight text-theme-text-primary">
          Settings
        </h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">
          Configure your experience
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-tertiary px-1">
          Appearance
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as Theme)}
              className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all overflow-hidden ${
                theme === t.id
                  ? "bg-theme-accent/10 border-theme-accent text-theme-accent shadow-lg shadow-theme-accent/5"
                  : "bg-theme-bg-tertiary/40 border-white/5 text-theme-text-tertiary hover:border-white/10"
              }`}
            >
              <div
                className={`p-3 rounded-xl ${theme === t.id ? "bg-theme-accent text-white" : "bg-theme-bg-tertiary text-theme-text-tertiary"}`}
              >
                <t.icon className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <span className="block text-sm font-bold uppercase tracking-wide">
                  {t.name}
                </span>
                <span className="block text-[10px] opacity-70 tracking-widest uppercase font-black">
                  {t.desc}
                </span>
              </div>
              {theme === t.id && (
                <motion.div
                  layoutId="active-theme"
                  className="absolute right-4 w-2 h-2 rounded-full bg-theme-accent"
                />
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-tertiary px-1">
          Data Management
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Card
            onClick={handleExportData}
            className="flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer hover:bg-theme-accent/5 transition-colors border-white/5 group"
          >
            <div className="p-3 rounded-2xl bg-theme-accent/10 text-theme-accent group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-text-primary uppercase tracking-tight">
                Export
              </p>
              <p className="text-[9px] text-theme-text-tertiary uppercase font-black">
                Save Backup
              </p>
            </div>
          </Card>

          <Card
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer hover:bg-success/5 transition-colors border-white/5 group"
          >
            <div className="p-3 rounded-2xl bg-success/10 text-success group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-text-primary uppercase tracking-tight">
                Import
              </p>
              <p className="text-[9px] text-theme-text-tertiary uppercase font-black">
                Restore Data
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportData}
              accept=".json"
              className="hidden"
            />
          </Card>
        </div>

        <Card className="flex items-center justify-between group overflow-hidden relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-theme-text-primary">
                Clear Local Data
              </p>
              <p className="text-[10px] text-theme-text-tertiary uppercase font-black opacity-70">
                Permanently delete all logs and settings
              </p>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 z-10"
          >
            Reset
          </button>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-theme-text-primary">
              Local Storage Only
            </p>
            <p className="text-[10px] text-theme-text-tertiary uppercase font-black opacity-70">
              All your health data stays on this device
            </p>
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
            <p className="text-sm font-bold text-theme-text-primary">
              Private by Design
            </p>
            <p className="text-[10px] text-theme-text-tertiary uppercase font-black opacity-70">
              No tracking or external data processing
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-4 pt-4">
        <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-orange-500/80 leading-relaxed font-bold uppercase tracking-wide">
            This app is a client-side PWA. Clearing your browser cache or
            deleting site data through browser settings may also erase your
            logs. Use the export tool above to keep regular backups.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 py-4 opacity-50">
          <div className="h-[1px] flex-1 bg-white/5" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Info className="w-3 h-3 text-theme-text-tertiary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">
                SmartBody<span className="text-theme-accent">1337</span>
              </p>
            </div>
            <p className="text-[9px] text-theme-text-tertiary">
              BUILD v{APP_VERSION}
            </p>
          </div>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>
      </section>
    </div>
  );
}
