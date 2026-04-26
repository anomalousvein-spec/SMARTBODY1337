import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../db/database';
import { WaistEntry } from '../../db/models';
import { WAIST_RATIO_CATEGORIES } from '../../config/constants';
import { Skeleton, Card } from '../../components';

interface WaistRatioDisplayProps {
  userId: string;
  height: number;
  heightUnit: 'in' | 'cm';
}

const getHealthCategory = (ratio: number): { category: string; color: string; description: string } => {
  if (ratio < WAIST_RATIO_CATEGORIES.UNDERWEIGHT.threshold) {
    return { category: WAIST_RATIO_CATEGORIES.UNDERWEIGHT.label, color: 'text-yellow-400', description: WAIST_RATIO_CATEGORIES.UNDERWEIGHT.description };
  } else if (ratio < WAIST_RATIO_CATEGORIES.HEALTHY_LOW.threshold) {
    return { category: WAIST_RATIO_CATEGORIES.HEALTHY_LOW.label, color: 'text-green-600 dark:text-green-400', description: WAIST_RATIO_CATEGORIES.HEALTHY_LOW.description };
  } else if (ratio < WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.threshold) {
    return { category: WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.label, color: 'text-orange-600 dark:text-orange-400', description: WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.description };
  } else if (ratio < WAIST_RATIO_CATEGORIES.OBESE_1.threshold) {
    return { category: WAIST_RATIO_CATEGORIES.OBESE_1.label, color: 'text-red-400', description: WAIST_RATIO_CATEGORIES.OBESE_1.description };
  } else {
    return { category: WAIST_RATIO_CATEGORIES.OBESE_2_PLUS.label, color: 'text-red-400', description: WAIST_RATIO_CATEGORIES.OBESE_2_PLUS.description };
  }
};

export function WaistRatioDisplay({ userId, height, heightUnit }: WaistRatioDisplayProps) {
  const [waistEntries, setWaistEntries] = useState<WaistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWaistMeasurements = async () => {
      try {
        const results = await db.waist_measurements.where('user_id').equals(userId).toArray();
        setWaistEntries(results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error('Error loading waist measurements:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWaistMeasurements();
  }, [userId]);

  const analytics = useMemo(() => {
    if (waistEntries.length === 0) return null;
    const latestEntry = waistEntries[0];
    let waistInCm = latestEntry.unit === 'in' ? latestEntry.measurement * 2.54 : latestEntry.measurement;
    let heightInCm = heightUnit === 'in' ? height * 2.54 : height;
    const ratio = waistInCm / heightInCm;
    const healthInfo = getHealthCategory(ratio);
    const firstEntry = waistEntries[waistEntries.length - 1];
    let firstWaistInCm = firstEntry.unit === 'in' ? firstEntry.measurement * 2.54 : firstEntry.measurement;
    const totalChange = firstWaistInCm - waistInCm;
    return { latestWaist: latestEntry.measurement, latestUnit: latestEntry.unit, latestDate: latestEntry.date, ratio, healthInfo, totalChange, entriesCount: waistEntries.length };
  }, [waistEntries, height, heightUnit]);

  if (isLoading) return <Card className="card-hover"><Skeleton className="h-48" /></Card>;
  if (!analytics) return <Card className="card-hover"><p className="text-center text-theme-text-tertiary py-8">Log your first waist measurement to see your ratio!</p></Card>;

  const isPositiveProgress = analytics.totalChange >= 0;

  return (
    <Card className="card-hover">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">Waist-to-Height Ratio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Latest Waist</p>
          <p className="text-2xl font-bold text-theme-text-primary">{analytics.latestWaist.toFixed(1)}<span className="text-sm font-normal text-theme-text-tertiary ml-1">{analytics.latestUnit}</span></p>
          <p className="text-xs text-theme-text-tertiary mt-1">{new Date(analytics.latestDate).toLocaleDateString()}</p>
        </div>
        <div className={`p-4 rounded-lg ${analytics.healthInfo.category === 'Healthy' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-theme-bg-tertiary/50'}`}>
          <p className="text-sm text-theme-text-tertiary mb-1">Ratio</p>
          <p className={`text-2xl font-bold ${analytics.healthInfo.color}`}>{analytics.ratio.toFixed(2)}</p>
          <p className={`text-sm font-medium ${analytics.healthInfo.color} mt-1`}>{analytics.healthInfo.category}</p>
        </div>
        <div className={`p-4 rounded-lg ${isPositiveProgress ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-500/10'}`}>
          <p className="text-sm text-theme-text-tertiary mb-1">Total Change</p>
          <p className={`text-2xl font-bold ${isPositiveProgress ? 'text-green-600 dark:text-green-400' : 'text-red-400'}`}>{isPositiveProgress ? '-' : '+'}{Math.abs(analytics.totalChange).toFixed(1)}<span className="text-sm font-normal ml-1">cm</span></p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Measurements</p>
          <p className="text-2xl font-bold text-theme-text-primary">{analytics.entriesCount}</p>
        </div>
      </div>
      <div className="mt-4 p-4 bg-theme-accent/10 rounded-lg">
        <p className="text-sm text-theme-text-secondary"><span className="font-semibold">Insight:</span> {analytics.healthInfo.description}</p>
      </div>
    </Card>
  );
}
