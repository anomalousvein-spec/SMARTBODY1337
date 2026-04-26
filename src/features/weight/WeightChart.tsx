import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../db/database';
import { WeightEntry } from '../../db/models';
import { calculateMovingAverage } from '../../utils/calculations';
import { MOVING_AVERAGE_DAYS } from '../../config/constants';
import { formatDisplayDate } from '../../utils/dates';
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
}

/**
 * Component displaying body weight trends and moving averages using Chart.js
 */
export function WeightChart({ userId, startDate, endDate }: WeightChartProps) {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWeights = async () => {
      try {
        let results: WeightEntry[];
        
        // Optimized range query using composite index if dates are provided
        if (startDate || endDate) {
          const lower = startDate ? startDate.toISOString() : '0';
          const upper = endDate ? endDate.toISOString() : '9';
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
    </div>
  );
}
