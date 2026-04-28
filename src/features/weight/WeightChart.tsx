import React, { useMemo } from "react";
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
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Trash2, Edit2, TrendingUp } from "lucide-react";
import { useWeights } from "../../hooks/useWeights";
import { WeightEntry } from "../../db/models";
import { db } from "../../db/database";
import { Card, Skeleton } from "../../components";
import { formatDisplayDate } from "../../utils/dates";
import { calculateMovingAverage } from "../../utils/calculations";
import { useApp } from "../../context/AppContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface WeightChartProps {
  onEdit?: (entry: WeightEntry) => void;
}

export const WeightChart = React.memo(function WeightChart({ onEdit }: WeightChartProps) {
  const { user, theme } = useApp();
  const userId = user.id;
  const { weights, isLoading, refresh } = useWeights(userId);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this weight entry?")) {
      await db.weights.delete(id);
      refresh();
    }
  };

  const chartColors = useMemo(() => {
    const isDark = true;
    return {
      accent: getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim(),
      text: isDark ? "#b3b3b3" : "#666666",
      grid: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    };
  }, [theme]);

  const chartData = useMemo(() => {
    const sortedWeights = [...weights].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const labels = sortedWeights.map((w) =>
      formatDisplayDate(new Date(w.date), { month: "short", day: "numeric" }),
    );
    const dataPoints = sortedWeights.map((w) => w.weight);

    // Calculate 7-day moving average
    const movingAvg = calculateMovingAverage(dataPoints, 7);

    return {
      labels,
      datasets: [
        {
          label: "Weight",
          data: dataPoints,
          borderColor: chartColors.accent,
          backgroundColor: `${chartColors.accent}20`,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: chartColors.accent,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: "7-Day Avg",
          data: movingAvg,
          borderColor: "rgba(255, 255, 255, 0.3)",
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.4,
          fill: false,
        },
      ],
    };
  }, [weights, chartColors]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { size: 12, weight: "bold" },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: chartColors.text,
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
          },
        },
        y: {
          grid: {
            color: chartColors.grid,
            drawBorder: false,
          },
          ticks: {
            color: chartColors.text,
            font: { size: 11 },
            padding: 8,
          },
        },
      },
    } as ChartOptions<"line">;
  }, [chartColors, theme]);

  if (isLoading)
    return (
      <Card className="card-hover">
        <Skeleton className="h-64" />
      </Card>
    );

  if (weights.length === 0) {
    return (
      <Card className="card-hover text-center py-10 px-6 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-theme-accent/10 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-theme-accent" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-theme-text-primary">
            No Weight Progress
          </h3>
          <p className="text-sm text-theme-text-tertiary mt-1">
            Start logging your weight to see your trends and weekly averages
            over time.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
      <div className="mt-6 space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary px-1">
          Recent Entries
        </h3>
        <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1">
          {weights
            .slice(-10)
            .reverse()
            .map((entry: WeightEntry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-theme-bg-tertiary/40 border border-white/5 hover:bg-theme-bg-tertiary/60 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-theme-accent opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span className="text-theme-text-primary font-semibold">
                    {entry.weight} {entry.unit}
                  </span>
                  <span className="text-xs text-theme-text-tertiary">
                    {formatDisplayDate(new Date(entry.date))}
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit?.(entry)}
                    className="p-2 rounded-lg hover:bg-blue-500/10 text-theme-text-tertiary hover:text-blue-400 transition-all active:scale-90"
                    aria-label="Edit entry"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id!)}
                    className="p-2 rounded-lg hover:bg-error/10 text-theme-text-tertiary hover:text-error transition-all active:scale-90"
                    aria-label="Delete weight entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
});
