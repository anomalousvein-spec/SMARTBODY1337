import React, { useMemo } from 'react';
import { Skeleton, Card } from '../../components';
import { useWaistMeasurements } from '../../hooks/useWaistMeasurements';
import { normalizeMeasurement, getWaistToHeightCategory } from '../../utils/calculations';
import { useApp } from '../../context/AppContext';
import { useTDEESettings } from '../../hooks/useTDEESettings';

export function WaistRatioDisplay() {
  const { user } = useApp();
  const userId = user.id;
  const { measurements: waistEntries, isLoading: waistLoading } = useWaistMeasurements(userId);
  const { settings, isLoading: settingsLoading } = useTDEESettings(userId);

  const analytics = useMemo(() => {
    if (!waistEntries || waistEntries.length === 0 || !settings) return null;

    const sortedEntries = [...waistEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestEntry = sortedEntries[0];
    const firstEntry = sortedEntries[sortedEntries.length - 1];

    const latestWaistCm = normalizeMeasurement(latestEntry.measurement, latestEntry.unit);
    const heightCm = normalizeMeasurement(settings.height, settings.heightUnit);
    const firstWaistCm = normalizeMeasurement(firstEntry.measurement, firstEntry.unit);

    const ratio = latestWaistCm / heightCm;
    const healthInfo = getWaistToHeightCategory(ratio);
    const totalChangeCm = firstWaistCm - latestWaistCm;

    return {
      latestWaist: latestEntry.measurement,
      latestUnit: latestEntry.unit,
      latestDate: latestEntry.date,
      ratio,
      healthInfo,
      totalChangeCm,
      entriesCount: waistEntries.length
    };
  }, [waistEntries, settings]);

  if (waistLoading || settingsLoading) return <Card className="card-hover"><Skeleton className="h-48" /></Card>;
  if (!analytics) return <Card className="card-hover"><p className="text-center text-theme-text-tertiary py-8 font-medium">Log your first waist measurement and set your height in Profile to see your ratio!</p></Card>;

  const isPositiveProgress = analytics.totalChangeCm >= 0;

  return (
    <Card className="card-hover">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">Waist-to-Height Ratio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-theme-bg-tertiary/40 border border-white/5 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Latest Waist</p>
          <p className="text-2xl font-bold text-theme-text-primary">
            {analytics.latestWaist.toFixed(1)}
            <span className="text-sm font-normal text-theme-text-tertiary ml-1">{analytics.latestUnit}</span>
          </p>
          <p className="text-[10px] font-bold text-theme-text-tertiary uppercase tracking-wide mt-1">{new Date(analytics.latestDate).toLocaleDateString()}</p>
        </div>
        <div className={`p-4 rounded-xl border border-white/5 ${analytics.healthInfo.category === 'Healthy' ? 'bg-success/10' : 'bg-theme-bg-tertiary/40'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Ratio</p>
          <p className={`text-2xl font-bold ${analytics.healthInfo.color}`}>{analytics.ratio.toFixed(2)}</p>
          <p className={`text-[10px] font-black uppercase tracking-widest ${analytics.healthInfo.color} mt-1`}>{analytics.healthInfo.category}</p>
        </div>
        <div className={`p-4 rounded-xl border border-white/5 ${isPositiveProgress ? 'bg-success/10' : 'bg-error/10'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Total Change</p>
          <p className={`text-2xl font-bold ${isPositiveProgress ? 'text-success' : 'text-error'}`}>
            {isPositiveProgress ? '-' : '+'}{Math.abs(analytics.totalChangeCm).toFixed(1)}
            <span className="text-sm font-normal ml-1">cm</span>
          </p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/40 border border-white/5 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-1">Measurements</p>
          <p className="text-2xl font-bold text-theme-text-primary">{analytics.entriesCount}</p>
        </div>
      </div>
      <div className="mt-4 p-4 bg-theme-accent/10 border border-theme-accent/10 rounded-xl">
        <p className="text-sm text-theme-text-secondary"><span className="text-[10px] font-black uppercase tracking-widest text-theme-accent mr-2">Insight</span> {analytics.healthInfo.description}</p>
      </div>
    </Card>
  );
}
