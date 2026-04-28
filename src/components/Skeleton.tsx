import React from "react";
import { cn } from "../utils/ui";
import "./Skeleton.css";

interface SkeletonProps {
  className?: string;
  variant?: "rectangular" | "circular" | "text";
}

/**
 * Reusable skeleton loader component with shimmer animation for perceived performance
 */
export function Skeleton({
  className,
  variant = "rectangular",
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton-base",
        variant === "circular" ? "rounded-full" : "rounded-lg",
        variant === "text" ? "h-4 w-3/4 mb-2" : "",
        className,
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Pre-defined dashboard card skeleton with shimmer effect
 */
export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 shadow-xl border border-white/5 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8" variant="circular" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
