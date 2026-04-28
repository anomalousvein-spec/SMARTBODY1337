import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { WifiOff } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "./utils/ui";
import { AppProvider, useApp } from "./context/AppContext";
import { useEditWeight } from "./hooks/editing/useEditWeight";

// Layout Components
import GlassHeader from "./components/layout/GlassHeader";
import AnimatedNav from "./components/layout/AnimatedNav";
import PageTransition from "./components/layout/PageTransition";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy loaded feature pages
const AnalyticsDashboard = lazy(() =>
  import("./analytics/AnalyticsDashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  })),
);
const WeightLogger = lazy(() =>
  import("./features/weight/WeightLogger").then((m) => ({
    default: m.WeightLogger,
  })),
);
const WeightChart = lazy(() =>
  import("./features/weight/WeightChart").then((m) => ({
    default: m.WeightChart,
  })),
);
const WeightAnalytics = lazy(() =>
  import("./features/weight/WeightAnalytics").then((m) => ({
    default: m.WeightAnalytics,
  })),
);
const WaistLogger = lazy(() =>
  import("./features/waist-height/WaistLogger").then((m) => ({
    default: m.WaistLogger,
  })),
);
const WaistRatioDisplay = lazy(() =>
  import("./features/waist-height/WaistRatioDisplay").then((m) => ({
    default: m.WaistRatioDisplay,
  })),
);
const WaistTrendChart = lazy(() =>
  import("./features/waist-height/WaistTrendChart").then((m) => ({
    default: m.WaistTrendChart,
  })),
);
const TDEECalculator = lazy(() =>
  import("./features/tdee/TDEECalculator").then((m) => ({
    default: m.TDEECalculator,
  })),
);
const MacroLogger = lazy(() =>
  import("./features/macros/MacroLogger").then((m) => ({
    default: m.MacroLogger,
  })),
);
const MacroSummary = lazy(() =>
  import("./features/macros/MacroSummary").then((m) => ({
    default: m.MacroSummary,
  })),
);
const SettingsPanel = lazy(() =>
  import("./features/settings/SettingsPanel").then((m) => ({
    default: m.SettingsPanel,
  })),
);

const LoadingFallback = () => (
  <div className="flex min-h-[70vh] items-center justify-center p-4">
    <div className="glass rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-6 max-w-[280px] w-full border-white/10">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-theme-accent/10 border-t-theme-accent"></div>
        <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full border-4 border-theme-accent/5"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="font-black uppercase tracking-[0.2em] text-theme-text-primary text-sm">
          SmartBody<span className="text-theme-accent">1337</span>
        </p>
        <p className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-theme-text-tertiary">
          Optimizing Engine...
        </p>
      </div>
    </div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const { editingWeight, startEditing, clearEditing } = useEditWeight();

  return (
    <AnimatePresence mode="wait">
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <AnalyticsDashboard />
                </PageTransition>
              }
            />
            <Route
              path="/weight"
              element={
                <PageTransition>
                  <div className="space-y-6">
                    <WeightLogger
                      editingEntry={editingWeight}
                      onCancelEdit={clearEditing}
                      onWeightLogged={clearEditing}
                    />
                    <WeightChart onEdit={startEditing} />
                    <WeightAnalytics />
                  </div>
                </PageTransition>
              }
            />
            <Route
              path="/waist"
              element={
                <PageTransition>
                  <div className="space-y-6">
                    <WaistLogger />
                    <WaistRatioDisplay />
                    <WaistTrendChart />
                  </div>
                </PageTransition>
              }
            />
            <Route
              path="/tdee"
              element={
                <PageTransition>
                  <TDEECalculator />
                </PageTransition>
              }
            />
            <Route
              path="/macros"
              element={
                <PageTransition>
                  <div className="space-y-6">
                    <MacroLogger />
                    <MacroSummary />
                  </div>
                </PageTransition>
              }
            />
            <Route
              path="/settings"
              element={
                <PageTransition>
                  <SettingsPanel />
                </PageTransition>
              }
            />
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
  const [isStandalone, setIsStandalone] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (event: MediaQueryListEvent) =>
      setIsStandalone(event.matches);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "default");
    document.documentElement.setAttribute(
      "data-display-mode",
      isStandalone ? "standalone" : "browser",
    );

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, [isStandalone]);

  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-x-hidden bg-theme-bg-primary transition-colors duration-500 md:my-4 md:max-w-2xl md:rounded-[2rem] md:shadow-2xl",
        isStandalone && "standalone-shell",
      )}
    >
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

      <main
        className={cn(
          "flex-grow px-4 pt-4",
          "pb-[calc(7.5rem+env(safe-area-inset-bottom))]",
          isStandalone && "pb-[calc(8rem+env(safe-area-inset-bottom))]",
        )}
      >
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
