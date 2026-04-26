# SmartBody 1337 - Body Tracking & Analytics PWA

A comprehensive body tracking application with weight loss monitoring, waist-to-height ratio analysis, TDEE calculation, and macro tracking. Built as a sister app to SmartTracker1337 with matching design language and offline-first architecture.

## Features

- **Weight Loss Tracking**: Log daily weights with trend analysis, moving averages, and milestone tracking
- **Waist-to-Height Ratio**: Monitor body composition changes with health category indicators
- **TDEE Calculator**: Dynamic calorie needs calculation based on your metrics and activity level
- **Macro Tracking**: Daily intake logging with weekly averages and distribution visualization
- **Smart Recommendations**: AI-powered suggestions for calorie adjustments and plateau detection
- **Analytics Dashboard**: Unified view of all metrics with multi-dimensional charts
- **Offline-First**: All data stored locally in IndexedDB via Dexie.js
- **PWA Ready**: Installable on mobile and desktop with full offline capability

---

## How to Install on Windows (Development)

To run this project locally on your Windows machine:

1. **Install Node.js**: Download and install the latest LTS version from [nodejs.org](https://nodejs.org/).
2. **Clone/Download the project**: Extract the source code to a folder of your choice.
3. **Open Terminal**: Press `Win + R`, type `cmd` or `powershell`, and navigate to the project folder:
   ```bash
   cd path/to/SMARTBODY1337
   ```
4. **Install Dependencies**:
   ```bash
   npm install
   ```
5. **Run the App**:
   ```bash
   npm run dev
   ```
6. **Open in Browser**: The terminal will show a URL (usually `http://localhost:5173`). Open it in Chrome or Edge.

---

## Development Commands

- `npm run dev` - Starts the local Vite dev server
- `npm run build` - Runs TypeScript checks and creates a production build in `dist`
- `npm run lint` - Runs ESLint for code quality checks
- `npm run test` - Runs the Vitest test suite
- `npm run preview` - Previews the production build locally

---

## Architecture Overview

The app follows a clean, modular architecture inspired by SMARTTRACKER1337:

### Directory Structure

```
src/
├── components/          # Shared UI components
│   ├── AlertBanner.tsx
│   ├── RecommendationCard.tsx
│   └── AdjustmentSuggestions.tsx
├── features/            # Feature-specific modules
│   ├── weight/          # Weight loss tracking
│   │   ├── WeightLogger.tsx
│   │   ├── WeightChart.tsx
│   │   └── WeightAnalytics.tsx
│   ├── waist-height/    # Waist-to-height ratio
│   │   ├── WaistLogger.tsx
│   │   ├── WaistRatioDisplay.tsx
│   │   └── WaistTrendChart.tsx
│   ├── tdee/            # TDEE calculator
│   │   └── TDEECalculator.tsx
│   └── macros/          # Macro tracking
│       ├── MacroLogger.tsx
│       └── MacroSummary.tsx
├── analytics/           # Dashboard & visualizations
│   └── AnalyticsDashboard.tsx
├── db/                  # Dexie database layer
│   └── db.ts
├── utils/               # Helpers and calculations
│   ├── calculations.ts  # TDEE formulas, ratio calculations
│   ├── recommendations.ts # Smart recommendation engine
│   └── formatters.ts    # Date and number formatting
├── styles/              # Global styles and CSS tokens
│   └── index.css
├── App.tsx              # Root component with routing
└── main.tsx             # Application entry point
```

### Architecture Layers

- **Components** (`src/components`)
  
  Route-level screens and UI composition. Components focus on rendering, navigation, and small local UI state.

- **Features** (`src/features`)
  
  Feature-specific hooks and presentational building blocks. This is where screen data loading, view-model shaping, and feature-scoped UI pieces live.

- **Repositories** (`src/db`)
  
  Data-access helpers around IndexedDB/Dexie. Feature hooks and services prefer repositories over raw `db.*` calls.

- **Utils** (`src/utils`)
  
  Shared pure helpers for formatting, calculation math, validation, and session-derived selectors.

- **Analytics** (`src/analytics`)
  
  Unified dashboard views and multi-metric visualizations combining data from all features.

### Current Convention

When adding or changing behavior:

1. Put persistence reads/writes in the DB layer when possible.
2. Keep business/domain logic in `features` or `utils` depending on scope.
3. Keep route components thin and presentation-focused.
4. Add or update tests for shared logic when extracting new helpers.

### Example Flow

For a screen like `AnalyticsDashboard` or `Weight`:

1. The route component renders UI.
2. Feature hooks load and shape data into a view model.
3. Hooks call the DB layer for data access.
4. Shared utility functions handle pure derivation work.

---

## Tech Stack

All versions locked to match SMARTTRACKER1337 for consistency:

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Database**: Dexie.js 4 (IndexedDB wrapper)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Chart.js 4 + react-chartjs-2
- **Routing**: React Router DOM 7
- **Animations**: Framer Motion
- **PWA**: vite-plugin-pwa with Workbox
- **TypeScript**: 5.9+
- **Testing**: Vitest

---

## Design System

SmartBody1337 uses the same design tokens as SmartTracker1337:

### Color Themes

Three themes available via `data-theme` attribute:

**Default (Dark)**
```css
--bg-primary: #121212
--bg-secondary: #1E1E1E
--bg-tertiary: #2A2A2A
--accent: #3b82f6
--text-primary: #ffffff
--text-secondary: #b3b3b3
```

**Jewel Theme**
```css
--bg-primary: #080C10
--bg-secondary: #16202C
--bg-tertiary: #1E293B
```

**AMOLED Theme**
```css
--bg-primary: #000000
--bg-secondary: #121212
--bg-tertiary: #1E1E1E
```

### Typography

- Font Family: Inter, system-ui, sans-serif
- Line Height: 1.5
- Font Weight: 400

### Responsive Breakpoints

Mobile-first design with Tailwind's default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

---

## PWA Capabilities

### Offline Support

The app uses Workbox service workers to cache all static assets and API responses. Once loaded, the app works completely offline.

### Installation

After deploying or running locally:

1. Visit the site in Chrome/Edge
2. Click the install icon in the address bar (or "Add to Home Screen" on mobile)
3. Launch from your home screen for a native-like experience

### Service Worker Configuration

Configured in `vite.config.ts` with:
- Auto-update strategy
- Precaching of all static assets
- Runtime caching for dynamic content
- Manifest with proper icons and theme colors

---

## Data Model

All tables include `userId` field for future cross-app synchronization:

```typescript
interface WeightEntry {
  id: string;
  userId: string;
  date: Date;
  weight: number;
  unit: 'lbs' | 'kg';
}

interface WaistMeasurement {
  id: string;
  userId: string;
  date: Date;
  waist: number;
  unit: 'in' | 'cm';
}

interface TDEESettings {
  userId: string;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: number;
  goal: 'maintain' | 'cut' | 'bulk';
}

interface MacroLog {
  id: string;
  userId: string;
  date: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
```

---

## Component Usage Examples

### Weight Logger

```tsx
import { WeightLogger } from './features/weight';

function MyComponent() {
  return <WeightLogger userId="user-1" />;
}
```

### TDEE Calculator

```tsx
import { TDEECalculator } from './features/tdee';

function MyComponent() {
  return <TDEECalculator userId="user-1" />;
}
```

### Analytics Dashboard

```tsx
import { AnalyticsDashboard } from './analytics/AnalyticsDashboard';

function MyComponent() {
  return <AnalyticsDashboard />;
}
```

### Recommendation Card

```tsx
import { RecommendationCard } from './components/RecommendationCard';

function MyComponent() {
  return (
    <RecommendationCard
      title="Calorie Adjustment"
      message="Consider reducing daily intake by 200 calories"
      type="warning"
    />
  );
}
```

---

## How to Deploy to Netlify

1. **Build the Project**:
   ```bash
   npm run build
   ```
   This creates a `dist` folder with optimized production assets.

2. **Create a Netlify Account**: Go to [netlify.com](https://www.netlify.com/) and sign up.

3. **Deploy via Drag-and-Drop**:
   - Log in to your Netlify dashboard
   - Go to the **Sites** tab
   - Drag and drop the **`dist`** folder into the deployment area

4. **Configure for PWA**: Netlify handles HTTPS automatically, which is required for PWAs. Your site will be live at a `.netlify.app` URL.

*Alternatively, connect your GitHub repository to Netlify for automatic deployments on push.*

---

## How to Use on iPhone as a PWA

For the best experience, install the app on your home screen:

1. **Open Safari**: Navigate to your deployed site URL
2. **Tap Share**: Tap the **Share** button (square with upward arrow)
3. **Add to Home Screen**: Scroll down and tap **Add to Home Screen**
4. **Confirm**: Give it a name (e.g., "SmartBody") and tap **Add**
5. **Launch**: Find the icon on your home screen. It opens in full-screen mode without Safari bars and works offline

---

## Testing

Run the test suite:

```bash
npm test
```

Tests cover:
- Calculation utilities (TDEE formulas, ratio calculations)
- Recommendation logic
- Database operations
- Component rendering

---

## Code Quality

### TypeScript Strict Mode

Enabled in `tsconfig.json` with strict type checking for all code paths.

### ESLint Configuration

Custom rules in `eslint.config.js` enforce:
- React best practices
- TypeScript type safety
- Code formatting consistency
- No unused variables or imports

### Running Linter

```bash
npm run lint
```

---

## Future Enhancements

Potential additions for future versions:

1. **Multi-user Support**: Leverage existing `userId` fields for household accounts
2. **Data Export/Import**: JSON backup and restore functionality
3. **Cross-App Sync**: Link with SmartTracker1337 for unified health dashboard
4. **Apple Health / Google Fit Integration**: Automatic weight import
5. **Photo Progress Tracking**: Visual progress timeline
6. **Custom Goals**: User-defined milestones and targets

---

## License

Private project - All rights reserved

---

## Credits

Built as a sister app to [SmartTracker1337](../SMARTTRACKER1337) with shared design language and architecture patterns.

Design inspiration from APEX-LIFT-1337 body tracking module.
