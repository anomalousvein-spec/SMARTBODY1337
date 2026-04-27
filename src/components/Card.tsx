import React from 'react';
import { cn } from '../utils/ui';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Reusable Card component with enhanced glassmorphism styles
 * Matches the design system used in SmartBody1337
 */
export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass rounded-2xl p-5 shadow-lg border border-white/8",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
