import React from 'react';
import { Palette } from 'lucide-react';
import { cn } from '../../utils/ui';

interface GlassHeaderProps {
  isStandalone: boolean;
  _isOnline: boolean;
  onToggleTheme: () => void;
}

/**
 * Glassmorphic header component with sticky positioning and animated theme toggle
 * Features branding and theme toggle functionality with enhanced visual feedback
 */
export default function GlassHeader({ isStandalone, onToggleTheme }: GlassHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 glass border-b border-white/10 px-4 py-3.5',
        isStandalone && 'pt-[max(env(safe-area-inset-top),0.75rem)]'
      )}
      role="banner"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black uppercase tracking-widest text-theme-text-primary flex items-center gap-2">
          <span className="relative">
            SmartBody<span className="text-theme-accent">1337</span>
            <span className="absolute -top-1 -right-3 w-2 h-2 bg-theme-accent rounded-full animate-pulse" />
          </span>
        </h1>
        <button
          onClick={onToggleTheme}
          className="group relative p-2.5 rounded-xl bg-theme-bg-tertiary/40 hover:bg-theme-bg-tertiary/70 transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden"
          aria-label="Toggle color theme"
          type="button"
        >
          {/* Subtle shine effect on hover */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          <Palette className="w-5 h-5 text-theme-text-secondary group-hover:text-theme-accent transition-colors duration-300" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
