import React from 'react';
import { Palette } from 'lucide-react';
import { cn } from '../../utils/ui';

interface GlassHeaderProps {
  isStandalone: boolean;
  _isOnline: boolean;
  onToggleTheme: () => void;
}

/**
 * Glassmorphic header component with sticky positioning
 * Features branding and theme toggle functionality
 */
export default function GlassHeader({ isStandalone, onToggleTheme }: GlassHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 glass border-b border-white/5 px-4 py-3 backdrop-blur-xl',
        isStandalone && 'pt-[max(env(safe-area-inset-top),0.75rem)]'
      )}
      role="banner"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black uppercase tracking-widest text-theme-text-primary">
          SmartBody<span className="text-theme-accent">1337</span>
        </h1>
        <button
          onClick={onToggleTheme}
          className="p-3 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary transition-colors"
          aria-label="Toggle color theme"
          type="button"
        >
          <Palette className="w-5 h-5 text-theme-text-secondary" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
