import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, X } from "lucide-react";
import { Card } from "../../components";

interface QuickLogSectionProps {
  quickLogType: "weight" | "waist" | null;
  setQuickLogType: (type: "weight" | "waist" | null) => void;
  quickLogValue: string;
  setQuickLogValue: (val: string) => void;
  handleQuickLog: (e: React.FormEvent) => void;
  isSaving: boolean;
  onNavigateMacros: () => void;
}

export const QuickLogSection = React.memo(
  ({
    quickLogType,
    setQuickLogType,
    quickLogValue,
    setQuickLogValue,
    handleQuickLog,
    isSaving,
    onNavigateMacros,
  }: QuickLogSectionProps) => {
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
      if (showSuccess) {
        const timer = setTimeout(() => setShowSuccess(false), 3000);
        return () => clearTimeout(timer);
      }
    }, [showSuccess]);

    // Track the success state when quickLogType becomes null after a save
    const [prevIsSaving, setPrevIsSaving] = useState(false);
    useEffect(() => {
      if (prevIsSaving && !isSaving && !quickLogType) {
        setShowSuccess(true);
      }
      setPrevIsSaving(isSaving);
    }, [isSaving, quickLogType, prevIsSaving]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-theme-text-tertiary">
              Quick Log
            </h3>
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-1.5 text-success"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Logged
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {!quickLogType ? (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-3 gap-3"
                >
                  <button
                    onClick={() => setQuickLogType("weight")}
                    className="p-4 bg-theme-accent/10 hover:bg-theme-accent/20 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1 group border border-theme-accent/10 hover:border-theme-accent/30"
                  >
                    <span className="text-xs font-black text-theme-accent uppercase tracking-widest group-hover:scale-105 transition-transform">
                      Weight
                    </span>
                  </button>
                  <button
                    onClick={() => setQuickLogType("waist")}
                    className="p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1 group border border-purple-500/10 hover:border-purple-500/30"
                  >
                    <span className="text-xs font-black text-purple-400 uppercase tracking-widest group-hover:scale-105 transition-transform">
                      Waist
                    </span>
                  </button>
                  <button
                    onClick={onNavigateMacros}
                    className="p-4 bg-success/10 hover:bg-success/20 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1 group border border-success/10 hover:border-success/30"
                  >
                    <span className="text-xs font-black text-success uppercase tracking-widest group-hover:scale-105 transition-transform">
                      Macros
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleQuickLog}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.1"
                        value={quickLogValue}
                        onChange={(e) => setQuickLogValue(e.target.value)}
                        placeholder={`Enter ${quickLogType} (${quickLogType === "weight" ? "lbs" : "in"})`}
                        className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-theme-bg-tertiary/60 text-theme-text-primary focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-accent/50 outline-none transition-all duration-200 hover:border-white/20"
                        autoFocus
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving || !quickLogValue}
                      className="p-3 bg-theme-accent hover:bg-theme-accent/90 disabled:opacity-50 text-white rounded-xl transition-all duration-200 active:scale-90 shadow-lg shadow-theme-accent/25 hover:shadow-xl hover:shadow-theme-accent/30"
                      aria-label="Submit quick log"
                    >
                      {isSaving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <CheckCircle className="w-6 h-6" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickLogType(null);
                        setQuickLogValue("");
                      }}
                      className="p-3 bg-theme-bg-tertiary/60 hover:bg-theme-bg-tertiary text-theme-text-tertiary hover:text-theme-text-primary rounded-xl transition-all duration-200 active:scale-90 border border-white/5"
                      aria-label="Cancel quick log"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    );
  },
);
