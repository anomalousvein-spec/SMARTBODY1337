import React from 'react';
import { cn } from '../utils/ui';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'interactive';
}

/**
 * Reusable Card component with enhanced glassmorphism styles and variants
 * Matches the design system used in SmartBody1337
 */
export function Card({ children, className, onClick, variant = 'default' }: CardProps) {
  const variantStyles = {
    default: "border-white/8 shadow-lg",
    elevated: "border-white/10 shadow-xl bg-theme-bg-secondary/60",
    interactive: "border-white/10 shadow-lg cursor-pointer active:scale-[0.98] transition-transform duration-200 hover:shadow-xl hover:border-white/15"
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass rounded-2xl p-5 relative overflow-hidden",
        variantStyles[variant],
        !onClick && variant === 'default' ? "" : "",
        className
      )}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
