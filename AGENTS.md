
## Percentage-Based Weight Loss Slider
- The weight loss rate is now strictly percentage-based (0.25% - 1.5% bodyweight/week).
- Use `src/utils/percentageLoss.ts` for all calorie deficit math related to loss rates.
- The `PercentageLossSlider` component requires `currentWeight`, `tdee`, `bmr`, and `gender` to provide accurate safety nudges.
- High-rate warnings (>= 0.75%) and BMR floor protections are enforced at the utility level.
