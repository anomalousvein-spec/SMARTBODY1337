### UI Audit & Visual Pass Summary

#### 1. Standardized Design System
- Unified 'Info Box' and 'Summary Card' styles across all feature modules (Weight, Waist, Macros, TDEE) to use `bg-theme-bg-tertiary/40 border border-white/5 rounded-xl`.
- Established a clear visual hierarchy by standardizing labels to `text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary`.

#### 2. Theme Integrity
- Eliminated hardcoded Tailwind color classes (e.g., `text-green-600`, `bg-blue-600`) in favor of theme-aware semantic variables (`text-success`, `text-warning`, `text-error`, `theme-accent`).
- Added `--color-warning` to the global CSS theme in `src/styles/index.css`.

#### 3. Dashboard Refinement
- Replaced heavy solid gradients in main stat cards with an 'Enhanced Glass' style featuring subtle accent borders (`border-theme-accent/20`) and faint glow effects.
- Normalized layout padding by removing redundant `pb-20` in `AnalyticsDashboard.tsx`.

#### 4. UX Parity & Feature Consistency
- Added a 'Recent Entries' list to the `WaistTrendChart` component, including delete functionality, to match the existing `WeightChart` UX.
- Improved 'No Data' states with theme-aware icons and better typography.

#### 5. Technical Fixes
- Fixed a build error in `TDEECalculator.tsx` caused by an invalid import of `ACTIVITY_LEVELS`.
- Updated all summary components to use UTC ISO strings consistently for date comparisons.

Verified via Playwright screenshots and full test suite (30/30 passed).
