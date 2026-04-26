import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Scale, Ruler, Calculator, Utensils, Settings } from 'lucide-react';
import { cn } from '../../utils/ui';

interface AnimatedNavProps {
  isStandalone: boolean;
}

const navItems = [
  { path: '/', icon: Home, label: 'Dash', ariaLabel: 'Navigate to Dashboard' },
  { path: '/weight', icon: Scale, label: 'Weight', ariaLabel: 'Navigate to Weight tracking' },
  { path: '/waist', icon: Ruler, label: 'Waist', ariaLabel: 'Navigate to Waist measurements' },
  { path: '/macros', icon: Utensils, label: 'Macros', ariaLabel: 'Navigate to Macros logger' },
  { path: '/tdee', icon: Calculator, label: 'TDEE', ariaLabel: 'Navigate to TDEE calculator' },
  { path: '/settings', icon: Settings, label: 'Settings', ariaLabel: 'Navigate to Settings' },
] as const;

/**
 * Animated bottom navigation bar with smooth transitions
 * Features 6 tabs: Dash, Weight, Waist, Macros, TDEE, and Settings
 * @param isStandalone - Whether the app is running in standalone PWA mode
 */
export default function AnimatedNav({ isStandalone }: AnimatedNavProps) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-1/2 z-[60] w-full max-w-md -translate-x-1/2 glass border-t border-white/5 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:max-w-2xl md:rounded-b-[2rem]',
        isStandalone && 'pb-[max(env(safe-area-inset-bottom),1rem)]'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300',
                isActive
                  ? 'bg-theme-accent/20 text-theme-accent scale-105'
                  : 'text-theme-text-tertiary hover:text-theme-text-secondary hover:bg-theme-bg-tertiary/30'
              )}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
              <span className="text-[9px] md:text-[10px] font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
