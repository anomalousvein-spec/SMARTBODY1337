import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { cn } from './utils/ui';
import { AppProvider, useApp } from './context/AppContext';
import { useEditWeight } from './hooks/editing/useEditWeight';

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
const SettingsPanel = lazy(() => import('./features/settings/SettingsPanel').then(m => ({ default: m.SettingsPanel })));

const LoadingFallback = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600/20 border-t-blue-600"></div>
    <p className="animate-pulse text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary">Loading SmartBody...</p>
  </div>
);

const AnimatedRoutes = () => {
  const { user } = useApp();
  const location = useLocation();
  const { editingWeight, startEditing, clearEditing } = useEditWeight();

  return (
    <AnimatePresence mode="wait">
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><AnalyticsDashboard userId={user.id} /></PageTransition>} />
            <Route path="/weight" element={
              <PageTransition>
                <div className="space-y-6">
                  <WeightLogger userId={user.id} editingEntry={editingWeight} onCancelEdit={clearEditing} onWeightLogged={clearEditing} />
                  <WeightChart userId={user.id} onEdit={startEditing} />
                  <WeightAnalytics userId={user.id} />
                </div>
              </PageTransition>
            } />
            <Route path="/waist" element={
              <PageTransition>
                <div className="space-y-6">
                  <WaistLogger userId={user.id} />
                  <WaistRatioDisplay userId={user.id} height={70} heightUnit="in" />
                  <WaistTrendChart userId={user.id} />
                </div>
              </PageTransition>
            } />
            <Route path="/tdee" element={<PageTransition><TDEECalculator userId={user.id} /></PageTransition>} />
            <Route path="/macros" element={
              <PageTransition>
                <div className="space-y-6">
                  <MacroLogger userId={user.id} />
                  <MacroSummary userId={user.id} />
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

function AppContent() {
  const { toggleTheme } = useApp();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as NavigatorWithStandalone).standalone === true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (event: MediaQueryListEvent) => setIsStandalone(event.matches);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-display-mode', isStandalone ? 'standalone' : 'browser');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [isStandalone]);

  return (
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
        <AnimatedRoutes />
      </main>

      <AnimatedNav isStandalone={isStandalone} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
