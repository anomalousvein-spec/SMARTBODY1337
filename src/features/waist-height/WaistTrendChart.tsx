import React, { useMemo, useEffect, useState } from 'react';
import { calculateMovingAverage } from '../../utils/calculations';
import { MOVING_AVERAGE_DAYS } from '../../config/constants';
import { formatDisplayDate } from '../../utils/dates';
import { useWaistMeasurements } from '../../hooks/useWaistMeasurements';
import { useApp } from '../../context/AppContext';
import { Line } from 'react-chartjs-2';
import { Card, Skeleton } from '../../components';
import { Ruler } from 'lucide-react';
import { WaistEntry } from '../../db/models';
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

interface WaistTrendChartProps {
  startDate?: Date;
  endDate?: Date;
}

export function WaistTrendChart({ startDate, endDate }: WaistTrendChartProps) {
  const { user, theme } = useApp();
  const userId = user.id;
  const { measurements: waistEntries, isLoading } = useWaistMeasurements(userId, startDate, endDate);
  const [chartColors, setChartColors] = useState({
    accent: '#a855f7',
    text: '#71717a',
    grid: 'rgba(255, 255, 255, 0.05)'
  });

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setChartColors({
      accent: theme === 'default' ? '#4D9EFF' : style.getPropertyValue('--accent').trim() || '#a855f7',
      text: style.getPropertyValue('--text-secondary').trim() || '#71717a',
      grid: theme === 'amoled' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
    });
  }, [theme]);

  const chartData = useMemo(() => {
    if (waistEntries.length === 0) return { labels: [], datasets: [] };

    const avgColor = '#10b981';
    const waistValues = waistEntries.map((w: WaistEntry) => w.unit === 'in' ? w.measurement : w.measurement / 2.54);

    return {
      labels: waistEntries.map((w: WaistEntry) => formatDisplayDate(new Date(w.date))),
      datasets: [
        {
          label: 'Waist (in)',
          data: waistValues,
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
          data: calculateMovingAverage(waistValues, MOVING_AVERAGE_DAYS),
          borderColor: avgColor,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 0
        }
      ],
    };
  }, [waistEntries, chartColors]);

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

  if (waistEntries.length === 0) {
    return (
      <Card className="card-hover text-center py-10 px-6 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Ruler className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-theme-text-primary">No Waist Data</h3>
          <p className="text-sm text-theme-text-tertiary mt-1">Tracking your waist measurement helps calculate your waist-to-height ratio, a key health indicator.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <div className="h-80"><Line data={chartData} options={options} /></div>
    </Card>
  );
}
