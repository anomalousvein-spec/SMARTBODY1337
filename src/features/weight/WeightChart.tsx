import React, { useMemo } from 'react';
import { db } from '../../db/database';
import { WeightEntry } from '../../db/models';
import { calculateMovingAverage } from '../../utils/calculations';
import { MOVING_AVERAGE_DAYS } from '../../config/constants';
import { formatDisplayDate } from '../../utils/dates';
import { useWeights } from '../../hooks/useWeights';
import { Edit2, Trash2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Card, Skeleton } from '../../components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface WeightChartProps {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  onEdit?: (entry: WeightEntry) => void;
  onDelete?: (id: number) => void;
}

export function WeightChart({ userId, startDate, endDate, onEdit, onDelete }: WeightChartProps) {
  const { weights, isLoading, refresh } = useWeights(userId, startDate, endDate);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this weight entry?')) return;
    try {
      await db.weights.delete(id);
      refresh();
      onDelete?.(id);
    } catch (error) {
      console.error('Error deleting weight:', error);
    }
  };

  const chartData = useMemo(() => {
    if (weights.length === 0) return { labels: [], datasets: [] };
    const weightValues = weights.map(w => w.weight);
    return {
      labels: weights.map(w => formatDisplayDate(new Date(w.date))),
      datasets: [
        { label: 'Weight', data: weightValues, borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3, pointRadius: 4 },
        { label: 'Average', data: calculateMovingAverage(weightValues, MOVING_AVERAGE_DAYS), borderColor: 'rgb(16, 185, 129)', backgroundColor: 'transparent', borderDash: [5, 5], tension: 0.3, pointRadius: 0 }
      ],
    };
  }, [weights]);

  if (isLoading) return <Card className="card-hover"><Skeleton className="h-64" /></Card>;
  if (weights.length === 0) return <Card className="card-hover"><p className="text-center text-theme-text-tertiary py-8">No weight data yet.</p></Card>;

  return (
    <Card className="card-hover">
      <div className="h-80"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
      <div className="mt-6 space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">Recent Entries</h3>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {weights.slice(-10).reverse().map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-theme-text-primary font-medium">{entry.weight} {entry.unit}</span>
                <span className="text-xs text-theme-text-tertiary">{formatDisplayDate(new Date(entry.date))}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit?.(entry)} className="p-1.5 rounded-md hover:bg-theme-bg-secondary text-theme-text-tertiary hover:text-blue-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(entry.id!)} className="p-1.5 rounded-md hover:bg-theme-bg-secondary text-theme-text-tertiary hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
