import React, { Component, ErrorInfo, ReactNode } from "react";
import { db } from "../db/database";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and display errors in child components
 * Wraps lazy-loaded routes and other critical components
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleHardReset = async () => {
    const confirmed = window.confirm(
      "This will PERMANENTLY delete all your data to fix potential corruption. Continue?",
    );
    if (!confirmed) return;

    try {
      await Promise.all([
        db.weights.clear(),
        db.waist_measurements.clear(),
        db.macro_logs.clear(),
        db.tdee_settings.clear(),
        db.pace_coach_checkins.clear(),
        db.weekly_metrics.clear(),
        db.user_profiles.clear(),
      ]);
      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to hard reset:", err);
      alert("Hard reset failed. Please clear your browser cache manually.");
    }
  };

  public render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-theme-text-primary">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-theme-text-tertiary max-w-xs mx-auto">
              {error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-theme-accent hover:opacity-90 text-white font-semibold rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleHardReset}
                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
              >
                Hard Reset (Delete Data)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
