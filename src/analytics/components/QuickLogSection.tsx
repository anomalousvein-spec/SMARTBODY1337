import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
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

export const QuickLogSection = memo(({ quickLogType, setQuickLogType, quickLogValue, setQuickLogValue, handleQuickLog, isSaving, onNavigateMacros }: QuickLogSectionProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card className="card-hover">
        <h3 className="text-lg font-bold text-theme-text-primary mb-4">Quick Log</h3>
        {!quickLogType ? (
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setQuickLogType('weight')} className="p-3 bg-theme-accent/10 hover:bg-theme-accent/20 rounded-lg transition-colors"><span className="text-sm font-medium text-theme-accent">Weight</span></button>
            <button onClick={() => setQuickLogType('waist')} className="p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"><span className="text-sm font-medium text-purple-700 dark:text-purple-400">Waist</span></button>
            <button onClick={onNavigateMacros} className="p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"><span className="text-sm font-medium text-green-700 dark:text-green-400">Macros</span></button>
          </div>
        ) : (
          <form onSubmit={handleQuickLog} className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="number" step="0.1" value={quickLogValue} onChange={(e) => setQuickLogValue(e.target.value)} placeholder={`Enter ${quickLogType}`} className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary focus:ring-2 focus:ring-blue-500" autoFocus required />
              <button type="submit" disabled={isSaving} className="px-4 py-2 bg-theme-accent hover:opacity-90 disabled:opacity-50 text-white rounded-lg transition-colors"><CheckCircle className="w-5 h-5" /></button>
              <button type="button" onClick={() => { setQuickLogType(null); setQuickLogValue(''); }} className="px-3 py-2 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 text-theme-text-secondary rounded-lg transition-colors">✕</button>
            </div>
          </form>
        )}
      </Card>
    </motion.div>
  );
});
