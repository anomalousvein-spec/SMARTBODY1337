import React, { useMemo, useEffect, useState } from 'react';
import { db } from '../../db/database';
import { WeightEntry } from '../../db/models';
import { calculateMovingAverage } from '../../utils/calculations';
import { MOVING_AVERAGE_DAYS } from '../../config/constants';
import { formatDisplayDate } from '../../utils/dates';
import { useWeights } from '../../hooks/useWeights';
import { useApp } from '../../context/AppContext';
import { Edit2, Trash2, TrendingUp } from 'lucide-react';
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
  const { theme } = useApp();
  const [chartColors, setChartColors] = useState({
    accent: '#4D9EFF',
    text: '#71717a',
    grid: 'rgba(255, 255, 255, 0.05)'
  });

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setChartColors({
      accent: style.getPropertyValue('--accent').trim() || '#4D9EFF',
      text: style.getPropertyValue('--text-secondary').trim() || '#71717a',
      grid: theme === 'amoled' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
    });
  }, [theme]);

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
        {
          label: 'Weight',
          data: weightValues,
          borderColor: chartColors.accent,
          backgroundColor: chartColors.accent.includes('rgb')
            ? chartColors.accent.replace('rgb', 'rgba').replace(')', ', 0.1)')
            : `${chartColors.accent}20`,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: chartColors.accent
        },
        {
          label: 'Average',
          data: calculateMovingAverage(weightValues, MOVING_AVERAGE_DAYS),
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 0
        }
      ],
    };
  }, [weights, chartColors]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: theme === 'amoled' ? '#121212' : 'rgba(30, 30, 30, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: chartColors.text,
            font: { size: 10 }
          }
        },
        y: {
          grid: {
            color: chartColors.grid
          },
          ticks: {
            color: chartColors.text,
            font: { size: 10 }
          }
        }
      }
    };
  }, [chartColors, theme]);

  if (isLoading) return <Card className="card-hover"><Skeleton className="h-64" /></Card>;

  if (weights.length === 0) {
    return (
      <Card className="card-hover text-center py-10 px-6 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-theme-accent/10 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-theme-accent" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-theme-text-primary">No Weight Progress</h3>
          <p className="text-sm text-theme-text-tertiary mt-1">Start logging your weight to see your trends and weekly averages over time.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <div className="h-80"><Line data={chartData} options={options} /></div>
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
