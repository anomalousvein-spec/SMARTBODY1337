import React from "react";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "../utils/ui";

interface AlertBannerProps {
  type: "critical" | "warning" | "info";
  message: string;
  onDismiss?: () => void;
}

export function AlertBanner({ type, message, onDismiss }: AlertBannerProps) {
  const styles = {
    critical: {
      bg: "bg-error/10",
      border: "border-error/20",
      text: "text-error",
      icon: AlertCircle,
    },
    warning: {
      bg: "bg-warning/10",
      border: "border-warning/20",
      text: "text-warning",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-theme-accent/10",
      border: "border-theme-accent/20",
      text: "text-theme-accent",
      icon: Info,
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "glass px-4 py-3 rounded-xl flex items-center justify-between mb-4 border",
        style.bg,
        style.border,
        style.text,
      )}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-widest leading-tight">
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
}
