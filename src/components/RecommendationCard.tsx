import React from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { Recommendation } from "../utils/recommendations";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onDismiss?: (id: string) => void;
}

export const RecommendationCard = React.memo(
  ({ recommendation, onDismiss }: RecommendationCardProps) => {
    const severityStyles = {
      critical: {
        bg: "bg-red-500/10",
        border: "border-red-500",
        icon: AlertCircle,
        iconColor: "text-red-400",
        titleColor: "text-red-400",
      },
      warning: {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500",
        icon: AlertTriangle,
        iconColor: "text-yellow-400",
        titleColor: "text-yellow-400",
      },
      info: {
        bg: "bg-theme-accent/10",
        border: "border-theme-accent",
        icon: Info,
        iconColor: "text-theme-accent",
        titleColor: "text-theme-text-primary",
      },
    } as const;

    const style = severityStyles[recommendation.severity];
    const Icon = style.icon;

    return (
      <div
        className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4 mb-3`}
      >
        <div className="flex items-start space-x-3">
          <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h4 className={`font-semibold ${style.titleColor} mb-1`}>
              {recommendation.title}
            </h4>
            <p className="text-sm text-theme-text-secondary mb-2">
              {recommendation.message}
            </p>
            {recommendation.action && (
              <div className="bg-theme-bg-tertiary/30 rounded p-3 mt-2">
                <p className="text-xs font-medium text-theme-text-primary dark:text-theme-text-secondary">
                  💡 {recommendation.action}
                </p>
              </div>
            )}
            <p className="text-xs text-theme-text-tertiary mt-2">
              {new Date(recommendation.timestamp).toLocaleDateString()}
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(recommendation.id)}
              className="text-theme-text-tertiary hover:text-theme-text-secondary"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  },
);

RecommendationCard.displayName = "RecommendationCard";
