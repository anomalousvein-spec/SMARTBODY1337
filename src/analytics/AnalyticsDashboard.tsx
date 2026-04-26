import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  TrendingDown,
  Target,
  Scale
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMetrics } from '../hooks/useMetrics';
import { PaceCoachCard } from '../features/pace-coach';
import { db } from '../db/database';
import { WAIST_RATIO_DISPLAY_CATEGORIES } from '../config/constants';
import { Skeleton, CardSkeleton } from '../components';
import { CalorieOverview, WeeklyAverages, QuickLogSection } from './components';

interface AnalyticsDashboardProps {
  userId: string;
}

/**
 * Main dashboard component providing a high-level overview of all metrics.
 * Refactored for performance via component extraction and memoization.
 * Now correctly accepts userId as a prop for future-proofing multi-user support.
 */
export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const { metrics, isLoading, error: metricsError, refresh: loadData } = useMetrics(userId);
  const [quickLogType, setQuickLogType] = useState<'weight' | 'waist' | null>(null);
  const [quickLogValue, setQuickLogValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleQuickLog = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogType || !quickLogValue) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const val = parseFloat(quickLogValue);
      const today = new Date().toISOString();

      if (quickLogType === 'weight') {
        await db.weights.add({
          user_id: userId,
          date: today,
          weight: val,
          unit: 'lbs'
        });
      } else {
        await db.waist_measurements.add({
          user_id: userId,
          date: today,
          measurement: val,
          unit: 'in'
        });
      }

      setQuickLogType(null);
      setQuickLogValue('');
      loadData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  }, [quickLogType, quickLogValue, loadData, userId]);

  const handleNavigateMacros = useCallback(() => {
    navigate('/macros');
  }, [navigate]);

  const waistCategory = useMemo(() => {
    if (!metrics?.waistRatio) return null;
    const ratio = metrics.waistRatio;

    if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.SLIM.threshold)
      return { label: WAIST_RATIO_DISPLAY_CATEGORIES.SLIM.label, color: 'text-blue-300' };
    if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.HEALTHY.threshold)
      return { label: WAIST_RATIO_DISPLAY_CATEGORIES.HEALTHY.label, color: 'text-green-300' };
    if (ratio < WAIST_RATIO_DISPLAY_CATEGORIES.OVERWEIGHT.threshold)
      return { label: WAIST_RATIO_DISPLAY_CATEGORIES.OVERWEIGHT.label, color: 'text-yellow-300' };
    return { label: WAIST_RATIO_DISPLAY_CATEGORIES.HIGH_RISK.label, color: 'text-red-300' };
  }, [metrics?.waistRatio]);

  const displayError = metricsError || saveError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {displayError && (
        <div className="bg-red-500/10 rounded-2xl p-4 border border-red-200 dark:border-red-800" role="alert">
          <p className="text-sm text-red-700 dark:text-red-400">{displayError}</p>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-medium opacity-90">Current Weight</span>
          </div>
          <div className="text-2xl font-bold">
            {metrics?.latestWeight?.weight ?? '--'}
            <span className="text-sm font-normal ml-1">lbs</span>
          </div>
          {metrics && metrics.weightChange !== 0 && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${metrics.weightChange < 0 ? 'text-green-300' : 'text-red-300'}`}>
              <TrendingDown aria-hidden="true" className={`w-3 h-3 ${metrics.weightChange >= 0 ? 'rotate-180' : ''}`} />
              {Math.abs(metrics.weightChange).toFixed(1)} lbs this week
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-4 text-white shadow-xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-medium opacity-90">Waist Ratio</span>
          </div>
          <div className="text-2xl font-bold">
            {metrics?.waistRatio ? metrics.waistRatio.toFixed(2) : '--'}
          </div>
          {waistCategory && (
            <div className={`text-xs mt-1 ${waistCategory.color}`}>
              {waistCategory.label}
            </div>
          )}
        </motion.div>
      </div>

      {/* Pace Coach Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <PaceCoachCard userId={userId} />
      </motion.div>

      {/* Calorie Summary */}
      <CalorieOverview metrics={metrics} />

      {/* Weekly Averages */}
      <WeeklyAverages metrics={metrics} />

      {/* Quick Log Section */}
      <QuickLogSection
        quickLogType={quickLogType}
        setQuickLogType={setQuickLogType}
        quickLogValue={quickLogValue}
        setQuickLogValue={setQuickLogValue}
        handleQuickLog={handleQuickLog}
        isSaving={isSaving}
        onNavigateMacros={handleNavigateMacros}
      />

      {/* Health Alerts */}
      {metrics && metrics.waistRatio > 0.58 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-red-500/10 rounded-2xl p-4 border border-red-200 dark:border-red-800"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="font-semibold text-red-400 text-sm">
                Health Alert
              </h4>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Your waist-to-height ratio ({metrics.waistRatio.toFixed(2)}) indicates elevated health risks. 
                Consider consulting with a healthcare provider.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
