import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../db/database';
import { WaistEntry } from '../../db/models';
import { WAIST_RATIO_CATEGORIES } from '../../config/constants';
import { Skeleton } from '../../components';

interface WaistRatioDisplayProps {
  /** User ID for fetching measurements */
  userId: string;
  /** User's height for ratio calculation */
  height: number;
  /** Unit for height ('in' or 'cm') */
  heightUnit: 'in' | 'cm';
}

/**
 * Categorizes the waist-to-height ratio into health categories
 */
const getHealthCategory = (ratio: number): { category: string; color: string; description: string } => {
  if (ratio < WAIST_RATIO_CATEGORIES.UNDERWEIGHT.threshold) {
    return { 
      category: WAIST_RATIO_CATEGORIES.UNDERWEIGHT.label, 
      color: 'text-yellow-400',
      description: WAIST_RATIO_CATEGORIES.UNDERWEIGHT.description
    };
  } else if (ratio < WAIST_RATIO_CATEGORIES.HEALTHY_LOW.threshold) {
    return { 
      category: WAIST_RATIO_CATEGORIES.HEALTHY_LOW.label, 
      color: 'text-green-600 dark:text-green-400',
      description: WAIST_RATIO_CATEGORIES.HEALTHY_LOW.description
    };
  } else if (ratio < WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.threshold) {
    return { 
      category: WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.label, 
      color: 'text-orange-600 dark:text-orange-400',
      description: WAIST_RATIO_CATEGORIES.HEALTHY_HIGH.description
    };
  } else if (ratio < WAIST_RATIO_CATEGORIES.OBESE_1.threshold) {
    return { 
      category: WAIST_RATIO_CATEGORIES.OBESE_1.label, 
      color: 'text-red-400',
      description: WAIST_RATIO_CATEGORIES.OBESE_1.description
    };
  } else {
    return { 
      category: WAIST_RATIO_CATEGORIES.OBESE_2_PLUS.label, 
      color: 'text-red-400',
      description: WAIST_RATIO_CATEGORIES.OBESE_2_PLUS.description
    };
  }
};

/**
 * Component providing waist-to-height ratio analysis and health insights
 */
export function WaistRatioDisplay({ userId, height, heightUnit }: WaistRatioDisplayProps) {
  const [waistEntries, setWaistEntries] = useState<WaistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWaistMeasurements = async () => {
      try {
        const results = await db.waist_measurements
          .where('user_id')
          .equals(userId)
          .toArray();
        
        // Sort by date descending to get the most recent
        const sorted = results.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setWaistEntries(sorted);
      } catch (error) {
        console.error('Error loading waist measurements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWaistMeasurements();
  }, [userId]);

  const analytics = useMemo(() => {
    if (waistEntries.length === 0) {
      return null;
    }

    const latestEntry = waistEntries[0];
    
    // Convert waist to same unit as height for ratio calculation
    let waistInCm = latestEntry.measurement;
    if (latestEntry.unit === 'in') {
      waistInCm = latestEntry.measurement * 2.54;
    }

    let heightInCm = height;
    if (heightUnit === 'in') {
      heightInCm = height * 2.54;
    }

    const ratio = waistInCm / heightInCm;
    const healthInfo = getHealthCategory(ratio);

    // Calculate change from first entry
    const firstEntry = waistEntries[waistEntries.length - 1];
    let firstWaistInCm = firstEntry.measurement;
    if (firstEntry.unit === 'in') {
      firstWaistInCm = firstEntry.measurement * 2.54;
    }
    const totalChange = firstWaistInCm - waistInCm; // Positive = loss

    return {
      latestWaist: latestEntry.measurement,
      latestUnit: latestEntry.unit,
      latestDate: latestEntry.date,
      ratio,
      healthInfo,
      totalChange,
      entriesCount: waistEntries.length,
    };
  }, [waistEntries, height, heightUnit]);

  if (isLoading) {
    return (
      <div className="glass card-hover rounded-2xl p-6 shadow-xl">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass card-hover rounded-2xl p-6 shadow-xl">
        <p className="text-center text-theme-text-tertiary py-8">
          Log your first waist measurement to see your ratio!
        </p>
      </div>
    );
  }

  const isPositiveProgress = analytics.totalChange >= 0;

  return (
    <div className="glass card-hover rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">
        Waist-to-Height Ratio
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latest Measurement */}
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Latest Waist</p>
          <p className="text-2xl font-bold text-theme-text-primary">
            {analytics.latestWaist.toFixed(1)}
            <span className="text-sm font-normal text-theme-text-tertiary ml-1">{analytics.latestUnit}</span>
          </p>
          <p className="text-xs text-theme-text-tertiary mt-1">
            {new Date(analytics.latestDate).toLocaleDateString()}
          </p>
        </div>

        {/* Ratio */}
        <div className={`p-4 rounded-lg ${
          analytics.healthInfo.category === 'Healthy'
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-theme-bg-tertiary/50'
        }`}>
          <p className="text-sm text-theme-text-tertiary mb-1">Waist-to-Height Ratio</p>
          <p className={`text-2xl font-bold ${analytics.healthInfo.color}`}>
            {analytics.ratio.toFixed(2)}
          </p>
          <p className={`text-sm font-medium ${analytics.healthInfo.color} mt-1`}>
            {analytics.healthInfo.category}
          </p>
        </div>

        {/* Total Change */}
        <div className={`p-4 rounded-lg ${
          isPositiveProgress 
            ? 'bg-green-50 dark:bg-green-900/20' 
            : 'bg-red-500/10'
        }`}>
          <p className="text-sm text-theme-text-tertiary mb-1">Total Change</p>
          <p className={`text-2xl font-bold ${
            isPositiveProgress 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-400'
          }`}>
            {isPositiveProgress ? '-' : '+'}{Math.abs(analytics.totalChange).toFixed(1)}
            <span className="text-sm font-normal ml-1">cm</span>
          </p>
        </div>

        {/* Entries Count */}
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-sm text-theme-text-tertiary mb-1">Total Measurements</p>
          <p className="text-2xl font-bold text-theme-text-primary">
            {analytics.entriesCount}
          </p>
        </div>
      </div>

      {/* Health Description */}
      <div className="mt-4 p-4 bg-theme-accent/10 rounded-lg" role="note" aria-label="Health insight">
        <p className="text-sm text-theme-text-secondary">
          <span className="font-semibold">Health Insight:</span> {analytics.healthInfo.description}
        </p>
        <p className="text-xs text-theme-text-tertiary mt-2 italic">
          A healthy waist-to-height ratio is between 0.42 and 0.48. Keep your waist less than half your height!
        </p>
      </div>
    </div>
  );
}
