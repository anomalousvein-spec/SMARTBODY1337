# Pace Coach Code Logic Fixes

## Summary
Fixed critical bugs and improved the Pace Coach calorie recommendation system based on weight trend analysis.

## Issues Fixed

### 1. **Critical: Missing Unit Conversion** (FIXED)
**Problem:** Weight entries stored in kg were not being converted to lbs before trend calculation, causing incorrect TDEE calculations for international users.

**Solution:** 
- Added `KG_TO_LBS` import to `CheckInForm.tsx`
- Normalize all weights to lbs before calculating trend slope:
```typescript
const sortedWeightsLbs = sortedEntries.map(w => 
  w.unit === 'kg' ? w.weight * KG_TO_LBS : w.weight
);
```
- Updated BMR calculation to use proper `LBS_TO_KG` constant instead of hardcoded value
- Normalized `currentWeight` parameter to lbs for consistency

**Files Modified:**
- `src/features/pace-coach/CheckInForm.tsx`

### 2. **Improved Documentation & Sign Convention Clarity** (FIXED)
**Problem:** The sign convention for weight change slope was confusing, making code maintenance difficult.

**Solution:**
- Enhanced JSDoc comments in `calculateTrendSlope()` to explicitly state weights must be in lbs
- Clarified that negative slope = weight loss, positive slope = weight gain
- Improved `calculateBackCalculatedTDEE()` documentation with detailed explanation of energy balance equation
- Renamed parameter from `dailyLossRate` to `dailyWeightChange` for clarity
- Added inline comments explaining the math: "If losing weight (negative slope): TDEE = intake + |deficit|"

**Files Modified:**
- `src/utils/paceCoach.ts`

### 3. **Added Comprehensive Test Coverage** (NEW)
**Problem:** No unit tests existed for core Pace Coach functions.

**Solution:** Created `src/utils/paceCoach.test.ts` with 17 test cases covering:
- `calculateTrendSlope()`: Empty data, single point, positive/negative slopes, constant weight
- `calculateBackCalculatedTDEE()`: Weight loss, weight gain, stable weight scenarios
- `calculateSuggestedIntake()`: Basic calculation, gender floors, BMR floors, throttling, max safe loss
- `isCheckInDue()`: No previous check-in, recent check-in, old check-in, custom frequency

**Test Results:** All 17 tests passing ✓

**Files Added:**
- `src/utils/paceCoach.test.ts`

## Verification

### Build Status
✓ TypeScript compilation successful
✓ Production build successful (vite build)

### Test Results
```
✓ src/utils/paceCoach.test.ts (17 tests)
  ✓ calculateTrendSlope (4 tests)
  ✓ calculateBackCalculatedTDEE (3 tests)
  ✓ calculateSuggestedIntake (6 tests)
  ✓ isCheckInDue (4 tests)
```

## Additional Improvements Already Present

The existing code already had several good safety features:
1. **Minimum calorie floors**: 1200 for females, 1500 for males
2. **BMR-based floor**: 80% of BMR minimum
3. **Max loss rate cap**: 1% of body weight per week maximum
4. **Adjustment throttling**: Max 150 calorie changes between suggestions
5. **Data smoothing**: 7-day moving average for trend calculation
6. **Minimum data validation**: Requires 5 weigh-ins before calculating trend

## Recommendations for Future Enhancement

While not implemented in this fix, consider adding:
1. Check-in frequency limits to prevent over-adjustment
2. More robust outlier detection in weight data
3. Confidence intervals for TDEE estimates
4. User feedback loop to validate recommendations
5. Integration with activity level changes

## Files Changed

1. `src/utils/paceCoach.ts` - Enhanced documentation and parameter naming
2. `src/features/pace-coach/CheckInForm.tsx` - Fixed unit conversion bug
3. `src/utils/paceCoach.test.ts` - New comprehensive test suite (17 tests)
