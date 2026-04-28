import React, { useMemo, useEffect, useState } from "react";
import { calculateMovingAverage } from "../../utils/calculations";
import { MOVING_AVERAGE_DAYS, CM_TO_IN } from "../../config/constants";
import { formatDisplayDate } from "../../utils/dates";
import { useWaistMeasurements } from "../../hooks/useWaistMeasurements";
import { useApp } from "../../context/AppContext";
import { Line } from "react-chartjs-2";
import { Card, Skeleton } from "../../components";
import { Ruler, Trash2 } from "lucide-react";
import { WaistEntry } from "../../db/models";
import { db } from "../../db/database";
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
} from "chart.js";

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

interface WaistTrendChartProps {
  startDate?: Date;
  endDate?: Date;
}

export function WaistTrendChart({ startDate, endDate }: WaistTrendChartProps) {
  const { user, theme } = useApp();
  const userId = user.id;
  const {
    measurements: waistEntries,
    isLoading,
    refresh,
  } = useWaistMeasurements(userId, startDate, endDate);
  const [chartColors, setChartColors] = useState({
    accent: "#a855f7",
    text: "#71717a",
    grid: "rgba(255, 255, 255, 0.05)",
  });

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setChartColors({
      accent:
        theme === "default"
          ? "#4D9EFF"
          : style.getPropertyValue("--accent").trim() || "#a855f7",
      text: style.getPropertyValue("--text-secondary").trim() || "#71717a",
      grid:
        theme === "amoled"
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(255, 255, 255, 0.05)",
    });
  }, [theme]);

  const handleDelete = async (id: number) => {
    if (
      !window.confirm("Are you sure you want to delete this waist measurement?")
    )
      return;
    try {
      await db.waist_measurements.delete(id);
      refresh();
    } catch (error) {
      console.error("Error deleting waist measurement:", error);
    }
  };

  // Create gradient for chart
  const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(
      0,
      color.includes("rgb")
        ? color.replace(")", ", 0.3)").replace("rgb", "rgba")
        : `${color}4D`,
    );
    gradient.addColorStop(
      1,
      color.includes("rgb")
        ? color.replace(")", ", 0.0)").replace("rgb", "rgba")
        : `${color}00`,
    );
    return gradient;
  };

  const chartData = useMemo(() => {
    if (waistEntries.length === 0) return { labels: [], datasets: [] };

    const avgColor = "#10b981";
    const waistValues = waistEntries.map((w: WaistEntry) =>
      w.unit === "in" ? w.measurement : w.measurement * CM_TO_IN,
    );

    return {
      labels: waistEntries.map((w: WaistEntry) =>
        formatDisplayDate(new Date(w.date)),
      ),
      datasets: [
        {
          label: "Waist (in)",
          data: waistValues,
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
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: chartColors.accent,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
        {
          label: "Average",
          data: calculateMovingAverage(waistValues, MOVING_AVERAGE_DAYS),
          borderColor: avgColor,
          backgroundColor: "transparent",
          borderDash: [6, 4],
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }, [waistEntries, chartColors]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor:
            theme === "amoled" ? "#121212" : "rgba(30, 30, 30, 0.95)",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 14,
          cornerRadius: 14,
          displayColors: false,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context: TooltipItem<"line">) =>
              `${context.dataset.label}: ${(context.parsed.y ?? 0).toFixed(1)} in`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: chartColors.text,
            font: { size: 11 },
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

  if (waistEntries.length === 0) {
    return (
      <Card className="card-hover text-center py-10 px-6 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Ruler className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-theme-text-primary">
            No Waist Data
          </h3>
          <p className="text-sm text-theme-text-tertiary mt-1">
            Tracking your waist measurement helps calculate your waist-to-height
            ratio, a key health indicator.
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
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {waistEntries
            .slice(-10)
            .reverse()
            .map((entry: WaistEntry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-theme-bg-tertiary/40 border border-white/5 hover:bg-theme-bg-tertiary/60 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Ruler className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-theme-text-primary">
                      {entry.measurement}{" "}
                      <span className="text-[10px] font-medium text-theme-text-tertiary uppercase">
                        {entry.unit}
                      </span>
                    </span>
                    <span className="text-[9px] font-bold text-theme-text-tertiary uppercase tracking-wide">
                      {formatDisplayDate(new Date(entry.date))}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id!)}
                  className="p-2 rounded-lg hover:bg-error/10 text-theme-text-tertiary hover:text-error transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                  aria-label="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}
