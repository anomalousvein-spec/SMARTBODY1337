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
  ChartOptions,
  ScriptableContext,
  TooltipItem,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface WeightChartProps {
  startDate?: Date;
  endDate?: Date;
  onEdit?: (entry: WeightEntry) => void;
  onDelete?: (id: number) => void;
}

export function WeightChart({ startDate, endDate, onEdit, onDelete }: WeightChartProps) {
  const { user, theme } = useApp();
  const userId = user.id;
  const { weights, isLoading, refresh } = useWeights(userId, startDate, endDate);
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

  // Create gradient for chart
  const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color.includes('rgb') ? color.replace(')', ', 0.3)').replace('rgb', 'rgba') : `${color}4D`);
    gradient.addColorStop(1, color.includes('rgb') ? color.replace(')', ', 0.0)').replace('rgb', 'rgba') : `${color}00`);
    return gradient;
  };

  const chartData = useMemo(() => {
    if (weights.length === 0) return { labels: [], datasets: [] };

    const weightValues = weights.map((w: WeightEntry) => w.weight);
    return {
      labels: weights.map((w: WeightEntry) => formatDisplayDate(new Date(w.date))),
      datasets: [
        {
          label: 'Weight',
          data: weightValues,
          borderColor: chartColors.accent,
          backgroundColor: (ctx: ScriptableContext<"line">) => {
            const chartCtx = ctx.chart.ctx;
            const gradient = createGradient(chartCtx, chartColors.accent);
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: chartColors.accent,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: chartColors.accent,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3
        },
        {
          label: 'Average',
          data: calculateMovingAverage(weightValues, MOVING_AVERAGE_DAYS),
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderDash: [6, 4],
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0
        }
      ],
    };
  }, [weights, chartColors]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: theme === 'amoled' ? '#121212' : 'rgba(30, 30, 30, 0.95)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 14,
          cornerRadius: 14,
          displayColors: false,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context: TooltipItem<"line">) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} lbs`
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: chartColors.text,
            font: { size: 11 }
          }
        },
        y: {
          grid: {
            color: chartColors.grid,
            drawBorder: false
          },
          ticks: {
            color: chartColors.text,
            font: { size: 11 },
            padding: 8
          }
        }
      }
    } as ChartOptions<'line'>;
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
        <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
          {weights.slice(-10).reverse().map((entry: WeightEntry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary/70 transition-all duration-200 group">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-theme-accent opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-theme-text-primary font-semibold">{entry.weight} {entry.unit}</span>
                <span className="text-xs text-theme-text-tertiary">{formatDisplayDate(new Date(entry.date))}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit?.(entry)} className="p-2 rounded-lg hover:bg-blue-500/10 text-theme-text-tertiary hover:text-blue-400 transition-all active:scale-90"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(entry.id!)} className="p-2 rounded-lg hover:bg-error/10 text-theme-text-tertiary hover:text-error transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
