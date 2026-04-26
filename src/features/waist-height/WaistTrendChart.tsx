import React, { useMemo } from 'react';
import { calculateMovingAverage } from '../../utils/calculations';
import { MOVING_AVERAGE_DAYS } from '../../config/constants';
import { formatDisplayDate } from '../../utils/dates';
import { useWaistMeasurements } from '../../hooks/useWaistMeasurements';
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

interface WaistTrendChartProps {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export function WaistTrendChart({ userId, startDate, endDate }: WaistTrendChartProps) {
  const { measurements: waistEntries, isLoading } = useWaistMeasurements(userId, startDate, endDate);

  const chartData = useMemo(() => {
    if (waistEntries.length === 0) return { labels: [], datasets: [] };
    const waistValues = waistEntries.map(w => w.unit === 'in' ? w.measurement * 2.54 : w.measurement);
    return {
      labels: waistEntries.map(w => formatDisplayDate(new Date(w.date))),
      datasets: [
        { label: 'Waist (cm)', data: waistValues, borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.3, pointRadius: 4 },
        { label: 'Average', data: calculateMovingAverage(waistValues, MOVING_AVERAGE_DAYS), borderColor: 'rgb(16, 185, 129)', backgroundColor: 'transparent', borderDash: [5, 5], tension: 0.3, pointRadius: 0 }
      ],
    };
  }, [waistEntries]);

  if (isLoading) return <Card className="card-hover"><Skeleton className="h-64" /></Card>;
  if (waistEntries.length === 0) return <Card className="card-hover"><p className="text-center text-theme-text-tertiary py-8">No waist data yet.</p></Card>;

  return (
    <Card className="card-hover">
      <div className="h-80"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
    </Card>
  );
}
