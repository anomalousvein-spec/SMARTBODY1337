import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card } from '../../components';

interface QuickLogSectionProps {
  quickLogType: 'weight' | 'waist' | null;
  setQuickLogType: (type: 'weight' | 'waist' | null) => void;
  quickLogValue: string;
  setQuickLogValue: (val: string) => void;
  handleQuickLog: (e: React.FormEvent) => void;
  isSaving: boolean;
  onNavigateMacros: () => void;
}

export const QuickLogSection = memo(({
  quickLogType,
  setQuickLogType,
  quickLogValue,
  setQuickLogValue,
  handleQuickLog,
  isSaving,
  onNavigateMacros
}: QuickLogSectionProps) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSavedType, setLastSavedType] = useState<string | null>(null);

  // Show success feedback when saving finishes and quickLogType is cleared
  useEffect(() => {
    if (!isSaving && !quickLogType && lastSavedType) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setLastSavedType(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
    if (isSaving && quickLogType) {
      setLastSavedType(quickLogType);
    }
  }, [isSaving, quickLogType, lastSavedType]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card className="card-hover overflow-hidden relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-theme-text-primary tracking-tight">Quick Log</h3>
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-1.5 text-green-500"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Logged</span>
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
                  onClick={() => setQuickLogType('weight')}
                  className="p-3 bg-theme-accent/10 hover:bg-theme-accent/20 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1"
                >
                  <span className="text-sm font-bold text-theme-accent uppercase tracking-wide">Weight</span>
                </button>
                <button
                  onClick={() => setQuickLogType('waist')}
                  className="p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1"
                >
                  <span className="text-sm font-bold text-purple-400 uppercase tracking-wide">Waist</span>
                </button>
                <button
                  onClick={onNavigateMacros}
                  className="p-3 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-all active:scale-95 flex flex-col items-center gap-1"
                >
                  <span className="text-sm font-bold text-green-400 uppercase tracking-wide">Macros</span>
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
                      placeholder={`Enter ${quickLogType} (${quickLogType === 'weight' ? 'lbs' : 'in'})`}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-theme-bg-tertiary/50 text-theme-text-primary focus:ring-2 focus:ring-theme-accent outline-none transition-all"
                      autoFocus
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving || !quickLogValue}
                    className="p-3 bg-theme-accent hover:opacity-90 disabled:opacity-50 text-white rounded-xl transition-all active:scale-90"
                  >
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setQuickLogType(null); setQuickLogValue(''); }}
                    className="p-3 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 text-theme-text-secondary rounded-xl transition-all"
                  >
                    ✕
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
});
