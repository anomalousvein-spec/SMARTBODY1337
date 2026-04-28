import { describe, it, expect } from 'vitest';
import {
  calculatePercentageLoss,
  getDynamicLabelText,
  getSliderZone
} from './percentageLoss';

describe('percentageLoss utility', () => {
  describe('calculatePercentageLoss', () => {
    it('calculates correct values for a 200 lb user at 0.75%', () => {
      const weight = 200;
      const unit = 'lbs';
      const pct = 0.75;
      const tdee = 2500;
      const bmr = 1800;
      const gender = 'male';

      const result = calculatePercentageLoss(weight, unit, pct, tdee, bmr, gender);

      // 200 * 0.0075 = 1.5 lbs/week
      expect(result.weeklyLossLbs).toBeCloseTo(1.5);

      // daily_deficit = (200 * 0.0075 * 3500) / 7 = 750
      expect(result.dailyDeficit).toBeCloseTo(750);

      // proposed_intake = 2500 - 750 = 1750
      expect(result.proposedIntake).toBeCloseTo(1750);

      // 1750 is below 1800 (bmr), so it should flag BMR floor
      expect(result.isBelowBmrFloor).toBe(true);

      // Back-calculate safe %: max_deficit = 2500 - 1800 = 700
      // pct = (700 * 7) / (200 * 3500) * 100 = 4900 / 700000 * 100 = 0.7
      expect(result.safePercentage).toBeCloseTo(0.7);
    });

    it('handles kg units correctly', () => {
      const weight = 100; // 100kg
      const unit = 'kg';
      const pct = 1.0;
      const tdee = 3000;
      const bmr = 2000;
      const gender = 'male';

      const result = calculatePercentageLoss(weight, unit, pct, tdee, bmr, gender);

      // 100 * 0.01 = 1 kg/week
      expect(result.weeklyLossKg).toBeCloseTo(1.0);

      // daily_deficit = (100 * 0.01 * 7700) / 7 = 1100
      expect(result.dailyDeficit).toBeCloseTo(1100);

      // proposed_intake = 3000 - 1100 = 1900
      expect(result.proposedIntake).toBeCloseTo(1900);

      // 1900 < 2000 (bmr)
      expect(result.isBelowBmrFloor).toBe(true);
    });

    it('applies protein nudge at 0.75% and above', () => {
      const tdee = 2500;
      const bmr = 1500;

      expect(calculatePercentageLoss(200, 'lbs', 0.7, tdee, bmr, 'male').showProteinNudge).toBe(false);
      expect(calculatePercentageLoss(200, 'lbs', 0.75, tdee, bmr, 'male').showProteinNudge).toBe(true);
      expect(calculatePercentageLoss(200, 'lbs', 1.2, tdee, bmr, 'male').showProteinNudge).toBe(true);
    });
  });

  describe('getDynamicLabelText', () => {
    it('returns correct labels for a 200 lb user', () => {
      const weight = 200;

      expect(getDynamicLabelText(0.4, weight)).toContain('Slow & Steady');
      expect(getDynamicLabelText(0.4, weight)).toContain('0.8 lb/week');

      expect(getDynamicLabelText(0.6, weight)).toContain('Moderate');
      expect(getDynamicLabelText(0.6, weight)).toContain('1.2 lb/week');

      expect(getDynamicLabelText(0.8, weight)).toContain('Aggressive');
      expect(getDynamicLabelText(0.8, weight)).toContain('1.6 lb/week');

      expect(getDynamicLabelText(1.2, weight)).toContain('Above Safe Limit');
      expect(getDynamicLabelText(1.2, weight)).toContain('2.4 lb/week');
    });
  });

  describe('getSliderZone', () => {
    it('returns correct zones for boundaries', () => {
      expect(getSliderZone(0.25).color).toBe('blue');
      expect(getSliderZone(0.49).color).toBe('blue');
      expect(getSliderZone(0.5).color).toBe('green');
      expect(getSliderZone(0.75).color).toBe('green'); // End of green
      expect(getSliderZone(0.8).color).toBe('yellow'); // Aggressive
      expect(getSliderZone(1.0).color).toBe('yellow'); // End of yellow
      expect(getSliderZone(1.1).color).toBe('orange');
    });
  });
});
