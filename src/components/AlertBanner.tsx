import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface AlertBannerProps {
  type: 'critical' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}

export function AlertBanner({ type, message, onDismiss }: AlertBannerProps) {
  const styles = {
    critical: {
      bg: 'bg-red-600',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-yellow-600',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-theme-accent',
      icon: Info,
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} text-white px-4 py-3 rounded-lg flex items-center justify-between mb-4`}>
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-white/80 hover:text-white"
        >
          ×
        </button>
      )}
    </div>
  );
}
