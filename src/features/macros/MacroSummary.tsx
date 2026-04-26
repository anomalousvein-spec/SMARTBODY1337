import React from 'react';
import { useMacroLogs } from '../../hooks/useMacroLogs';
import { Skeleton, Card } from '../../components';
import { Utensils } from 'lucide-react';
import { MacroEntry } from '../../db/models';

interface MacroSummaryProps {
  userId: string;
}

export function MacroSummary({ userId }: MacroSummaryProps) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { logs: entries, isLoading } = useMacroLogs(userId, oneWeekAgo);

  if (isLoading) return <Card className="card-hover"><Skeleton className="h-48" /></Card>;

  if (entries.length === 0) {
    return (
      <Card className="card-hover text-center py-10 px-6 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <Utensils className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-theme-text-primary">Macro Summary</h2>
          <p className="text-sm text-theme-text-tertiary mt-1">Log your nutrition intake to see your average weekly breakdown and calorie distribution.</p>
        </div>
      </Card>
    );
  }

  const avgCalories = entries.reduce((sum: number, e: MacroEntry) => sum + e.calories, 0) / entries.length;
  const avgProtein = entries.reduce((sum: number, e: MacroEntry) => sum + e.protein, 0) / entries.length;
  const avgCarbs = entries.reduce((sum: number, e: MacroEntry) => sum + e.carbs, 0) / entries.length;
  const avgFats = entries.reduce((sum: number, e: MacroEntry) => sum + e.fats, 0) / entries.length;

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
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 via-green-500 to-yellow-500 relative opacity-80" />
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
