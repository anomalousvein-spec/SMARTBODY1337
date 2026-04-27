import React from 'react';
import { useMacroLogs } from '../../hooks/useMacroLogs';
import { Card, Skeleton } from '../../components';
import { useApp } from '../../context/AppContext';

export function MacroSummary() {
  const { user } = useApp();
  const userId = user.id;
  const { logs, isLoading } = useMacroLogs(userId);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date.startsWith(today));

  const totals = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + log.calories,
    protein: acc.protein + log.protein,
    carbs: acc.carbs + log.carbs,
    fats: acc.fats + log.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  if (isLoading) return <Card className="card-hover"><Skeleton className="h-48" /></Card>;

  return (
    <Card className="card-hover">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">Today's Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-xs text-theme-text-tertiary uppercase tracking-widest font-black mb-1">Calories</p>
          <p className="text-2xl font-bold text-theme-text-primary">{totals.calories}</p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-xs text-theme-text-tertiary uppercase tracking-widest font-black mb-1">Protein</p>
          <p className="text-2xl font-bold text-blue-400">{totals.protein}g</p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-xs text-theme-text-tertiary uppercase tracking-widest font-black mb-1">Carbs</p>
          <p className="text-2xl font-bold text-green-400">{totals.carbs}g</p>
        </div>
        <div className="p-4 bg-theme-bg-tertiary/50 rounded-lg">
          <p className="text-xs text-theme-text-tertiary uppercase tracking-widest font-black mb-1">Fats</p>
          <p className="text-2xl font-bold text-yellow-400">{totals.fats}g</p>
        </div>
      </div>
    </Card>
  );
}
