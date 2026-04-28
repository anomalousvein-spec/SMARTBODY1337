import React from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "../utils/ui";
import type { Recommendation } from "../utils/recommendations";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onDismiss?: (id: string) => void;
}

export const RecommendationCard = React.memo(
  ({ recommendation, onDismiss }: RecommendationCardProps) => {
    const severityStyles = {
      critical: {
        bg: "bg-error/10",
        border: "border-error/30",
        icon: AlertCircle,
        iconColor: "text-error",
        titleColor: "text-error",
      },
      warning: {
        bg: "bg-warning/10",
        border: "border-warning/30",
        icon: AlertTriangle,
        iconColor: "text-warning",
        titleColor: "text-warning",
      },
      info: {
        bg: "bg-theme-accent/10",
        border: "border-theme-accent/30",
        icon: Info,
        iconColor: "text-theme-accent",
        titleColor: "text-theme-text-primary",
      },
    } as const;

    const style = severityStyles[recommendation.severity];
    const Icon = style.icon;

    return (
      <div
        className={cn(
          "glass border-l-4 rounded-xl p-4 mb-3 transition-all duration-300",
          style.bg,
          style.border,
        )}
      >
        <div className="flex items-start space-x-3">
          <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", style.iconColor)} />
          <div className="flex-1">
            <h4
              className={cn(
                "text-[10px] font-black uppercase tracking-widest mb-1",
                style.titleColor,
              )}
            >
              {recommendation.title}
            </h4>
            <p className="text-sm text-theme-text-secondary mb-2 font-medium leading-relaxed">
              {recommendation.message}
            </p>
            {recommendation.action && (
              <div className="bg-theme-bg-tertiary/40 border border-white/5 rounded-xl p-3 mt-2">
                <p className="text-xs font-medium text-theme-text-primary">
                  💡 {recommendation.action}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">
                {new Date(recommendation.timestamp).toLocaleDateString()}
              </p>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(recommendation.id)}
                  className="text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary hover:text-theme-text-secondary transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

RecommendationCard.displayName = "RecommendationCard";
