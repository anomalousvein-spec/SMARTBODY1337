import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { cn } from './utils/ui';
import { userManager } from './utils/userManager';
import { SettingsPanel } from './features/settings/SettingsPanel';

// Layout Components
import GlassHeader from './components/layout/GlassHeader';
import AnimatedNav from './components/layout/AnimatedNav';
import PageTransition from './components/layout/PageTransition';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy loaded feature pages
const AnalyticsDashboard = lazy(() => import('./analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const WeightLogger = lazy(() => import('./features/weight/WeightLogger').then(m => ({ default: m.WeightLogger })));
const WeightChart = lazy(() => import('./features/weight/WeightChart').then(m => ({ default: m.WeightChart })));
const WeightAnalytics = lazy(() => import('./features/weight/WeightAnalytics').then(m => ({ default: m.WeightAnalytics })));
const WaistLogger = lazy(() => import('./features/waist-height/WaistLogger').then(m => ({ default: m.WaistLogger })));
const WaistRatioDisplay = lazy(() => import('./features/waist-height/WaistRatioDisplay').then(m => ({ default: m.WaistRatioDisplay })));
const WaistTrendChart = lazy(() => import('./features/waist-height/WaistTrendChart').then(m => ({ default: m.WaistTrendChart })));
const TDEECalculator = lazy(() => import('./features/tdee/TDEECalculator').then(m => ({ default: m.TDEECalculator })));
const MacroLogger = lazy(() => import('./features/macros/MacroLogger').then(m => ({ default: m.MacroLogger })));
const MacroSummary = lazy(() => import('./features/macros/MacroSummary').then(m => ({ default: m.MacroSummary })));

const LoadingFallback = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600/20 border-t-blue-600"></div>
    <p className="animate-pulse text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">Loading SmartBody...</p>
  </div>
);

const AnimatedRoutes = ({ userId }: { userId: string }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><AnalyticsDashboard userId={userId} /></PageTransition>} />
            <Route path="/weight" element={
              <PageTransition>
                <div className="space-y-6">
                  <WeightLogger userId={userId} />
                  <WeightChart userId={userId} />
                  <WeightAnalytics userId={userId} />
                </div>
              </PageTransition>
            } />
            <Route path="/waist" element={
              <PageTransition>
                <div className="space-y-6">
                  <WaistLogger userId={userId} />
                  <WaistRatioDisplay userId={userId} height={70} heightUnit="in" />
                  <WaistTrendChart userId={userId} />
                </div>
              </PageTransition>
            } />
            <Route path="/tdee" element={<PageTransition><TDEECalculator userId={userId} /></PageTransition>} />
            <Route path="/macros" element={
              <PageTransition>
                <div className="space-y-6">
                  <MacroLogger userId={userId} />
                  <MacroSummary userId={userId} />
                </div>
              </PageTransition>
            } />
            <Route path="/settings" element={<PageTransition><SettingsPanel /></PageTransition>} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AnimatePresence>
  );
};

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || 'default';
  });
  const [isStandalone, setIsStandalone] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
  const [currentUserId] = useState<string>(() => {
    // Get current user from UserManager or use default for backward compatibility
    const user = userManager.getCurrentUser();
    return user?.id || 'user-1';
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (event: MediaQueryListEvent) => setIsStandalone(event.matches);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-display-mode', isStandalone ? 'standalone' : 'browser');

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const themeColors: Record<string, string> = {
      default: '#121212',
      jewel: '#080C10',
      amoled: '#000000'
    };
    themeMeta?.setAttribute('content', themeColors[theme] || themeColors.default);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [theme, isStandalone]);

  const toggleTheme = () => {
    const themes = ['default', 'jewel', 'amoled'];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  return (
    <Router>
      <div className={cn(
        "relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-x-hidden bg-theme-bg-primary transition-colors duration-500 md:my-4 md:max-w-2xl md:rounded-[2rem] md:shadow-2xl",
        isStandalone && "standalone-shell"
      )}>
        {!isOnline && (
          <div className="bg-error/20 text-error px-4 py-2 text-sm flex items-center gap-2 z-[60] glass border-b border-error/10">
            <WifiOff className="w-4 h-4" />
            <span>You're offline. Changes will sync later.</span>
          </div>
        )}

        <GlassHeader
          isStandalone={isStandalone}
          _isOnline={isOnline}
          onToggleTheme={toggleTheme}
        />

        <main className={cn(
          "flex-grow px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-4",
          isStandalone && "pb-[calc(7.25rem+env(safe-area-inset-bottom))]"
        )}>
          <AnimatedRoutes userId={currentUserId} />
        </main>

        <AnimatedNav isStandalone={isStandalone} />
      </div>
    </Router>
  );
}

export default App;
