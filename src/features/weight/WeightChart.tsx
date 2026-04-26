import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../db/database';
import { WeightEntry } from '../../db/models';
import { calculateMovingAverage } from '../../utils/calculations';
import { MOVING_AVERAGE_DAYS } from '../../config/constants';
import { formatDisplayDate, startOfDay, endOfDay } from '../../utils/dates';
import { Edit2, Trash2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeightChartProps {
  /** User ID for fetching data */
  userId: string;
  /** Optional start date for filtering */
  startDate?: Date;
  /** Optional end date for filtering */
  endDate?: Date;
  /** Callback when an entry is edited */
  onEdit?: (entry: WeightEntry) => void;
  /** Callback when an entry is deleted */
  onDelete?: (id: number) => void;
}

/**
 * Component displaying body weight trends and moving averages using Chart.js
 * Now includes edit/delete functionality for entries
 */
export function WeightChart({ userId, startDate, endDate, onEdit, onDelete }: WeightChartProps) {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeights = async () => {
      try {
        let results: WeightEntry[];
        
        // Optimized range query using composite index if dates are provided
        // Using timezone-aware date comparisons
        if (startDate || endDate) {
          const lower = startDate ? startOfDay(startDate).toISOString() : '0';
          const upper = endDate ? endOfDay(endDate).toISOString() : '9';
          results = await db.weights
            .where('[user_id+date]')
            .between([userId, lower], [userId, upper])
            .toArray();
        } else {
          results = await db.weights
            .where('user_id')
            .equals(userId)
            .toArray();
        }

        // Sort by date ascending for chart
        const sorted = results.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setWeights(sorted);
      } catch (error) {
        console.error('Error loading weights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeights();
  }, [userId, startDate, endDate]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this weight entry?')) {
      return;
    }
    
    try {
      await db.weights.delete(id);
      setWeights(weights.filter(w => w.id !== id));
      onDelete?.(id);
    } catch (error) {
      console.error('Error deleting weight:', error);
    }
  };

  const chartData = useMemo(() => {
    if (weights.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const weightValues = weights.map(w => w.weight);
    const movingAvg = calculateMovingAverage(weightValues, MOVING_AVERAGE_DAYS);

    return {
      labels: weights.map(w => formatDisplayDate(new Date(w.date))),
      datasets: [
        {
          label: 'Weight',
          data: weightValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: `${MOVING_AVERAGE_DAYS}-Day Average`,
          data: movingAvg,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    };
  }, [weights]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weight Trend',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Weight (lbs)',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (isLoading) {
    return (
      <div className="glass card-hover rounded-2xl p-6 shadow-xl">
        <div className="animate-pulse h-64 bg-theme-bg-tertiary rounded-lg"></div>
      </div>
    );
  }

  if (weights.length === 0) {
    return (
      <div className="glass card-hover rounded-2xl p-6 shadow-xl">
        <p className="text-center text-theme-text-tertiary py-8">
          No weight data yet. Start logging to see your trend!
        </p>
      </div>
    );
  }

  return (
    <div className="glass card-hover rounded-2xl p-6 shadow-xl">
      <div className="h-80" role="img" aria-label={`Weight trend chart showing daily weigh-ins and ${MOVING_AVERAGE_DAYS}-day average`}>
        <Line data={chartData} options={options} />
      </div>
      
      {/* Entry list with edit/delete actions */}
      <div className="mt-6 space-y-2">
        <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wider">Recent Entries</h3>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {weights.slice(-10).reverse().map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-theme-text-primary font-medium">
                  {entry.weight} {entry.unit}
                </span>
                <span className="text-xs text-theme-text-tertiary">
                  {formatDisplayDate(new Date(entry.date))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit?.(entry)}
                  className="p-1.5 rounded-md hover:bg-theme-bg-secondary text-theme-text-tertiary hover:text-blue-400 transition-colors"
                  title="Edit entry"
                  aria-label="Edit weight entry"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(entry.id!)}
                  className="p-1.5 rounded-md hover:bg-theme-bg-secondary text-theme-text-tertiary hover:text-red-400 transition-colors"
                  title="Delete entry"
                  aria-label="Delete weight entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
