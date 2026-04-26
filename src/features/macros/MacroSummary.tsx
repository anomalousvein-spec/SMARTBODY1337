import React from 'react';
import { useMacroLogs } from '../../hooks/useMacroLogs';
import { Skeleton, Card } from '../../components';

interface MacroSummaryProps {
  userId: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
}

export function MacroSummary({ userId }: MacroSummaryProps) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { logs: entries, isLoading } = useMacroLogs(userId, oneWeekAgo);

  if (isLoading) return <Card className="card-hover"><Skeleton className="h-48" /></Card>;
  if (entries.length === 0) return <Card className="card-hover"><h2 className="text-xl font-bold text-theme-text-primary mb-4">Weekly Macro Summary</h2><p className="text-center text-theme-text-tertiary py-8">No data logged this week.</p></Card>;

  const avgCalories = entries.reduce((sum, e) => sum + e.calories, 0) / entries.length;
  const avgProtein = entries.reduce((sum, e) => sum + e.protein, 0) / entries.length;
  const avgCarbs = entries.reduce((sum, e) => sum + e.carbs, 0) / entries.length;
  const avgFats = entries.reduce((sum, e) => sum + e.fats, 0) / entries.length;

  const totalCals = (avgProtein * 4) + (avgCarbs * 4) + (avgFats * 9);

  return (
    <Card className="card-hover">
      <h2 className="text-xl font-bold text-theme-text-primary mb-4">Weekly Macro Summary</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-theme-accent/10 rounded-lg p-4">
          <p className="text-sm text-theme-text-tertiary mb-1">Avg Calories</p>
          <p className="text-2xl font-bold text-theme-accent">{Math.round(avgCalories)}</p>
        </div>
        <div className="bg-purple-500/10 rounded-lg p-4">
          <p className="text-sm text-theme-text-tertiary mb-1">Avg Protein</p>
          <p className="text-2xl font-bold text-purple-400">{Math.round(avgProtein)}g</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4">
          <p className="text-sm text-theme-text-tertiary mb-1">Avg Carbs</p>
          <p className="text-2xl font-bold text-green-400">{Math.round(avgCarbs)}g</p>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-4">
          <p className="text-sm text-theme-text-tertiary mb-1">Avg Fats</p>
          <p className="text-2xl font-bold text-yellow-400">{Math.round(avgFats)}g</p>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-white/5">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Distribution</h3>
        <div className="flex items-center space-x-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 via-green-500 to-yellow-500 relative" />
          <div className="space-y-1 text-sm text-theme-text-tertiary">
            <p>Protein: {Math.round((avgProtein * 4 / (totalCals || 1)) * 100)}%</p>
            <p>Carbs: {Math.round((avgCarbs * 4 / (totalCals || 1)) * 100)}%</p>
            <p>Fats: {Math.round((avgFats * 9 / (totalCals || 1)) * 100)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
