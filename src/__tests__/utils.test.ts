import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateWaistToHeightRatio, calculateMovingAverage } from '../utils/calculations';
import { isSameDay, toISODate } from '../utils/dates';

describe('Calculation Utilities', () => {
  it('should calculate BMR correctly for male', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const bmr = calculateBMR(80, 180, 30, 'male');
    expect(bmr).toBe(1780);
  });

  it('should calculate BMR correctly for female', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    const bmr = calculateBMR(60, 165, 25, 'female');
    expect(bmr).toBe(1345.25);
  });

  it('should calculate TDEE correctly', () => {
    const bmr = 2000;
    expect(calculateTDEE(bmr, 'sedentary')).toBe(2400);
    expect(calculateTDEE(bmr, 'moderately_active')).toBe(3100);
  });

  it('should calculate waist-to-height ratio', () => {
    expect(calculateWaistToHeightRatio(80, 180)).toBeCloseTo(0.44, 2);
  });

  it('should calculate moving average', () => {
    const data = [10, 20, 30, 40, 50];
    const ma = calculateMovingAverage(data, 3);
    expect(ma).toEqual([10, 15, 20, 30, 40]);
  });
});

describe('Date Utilities', () => {
  it('should check if dates are the same day', () => {
    const d1 = new Date(2023, 0, 1);
    const d2 = new Date(2023, 0, 1, 10, 0);
    const d3 = new Date(2023, 0, 2);
    expect(isSameDay(d1, d2)).toBe(true);
    expect(isSameDay(d1, d3)).toBe(false);
  });

  it('should convert date to ISO date string', () => {
    const date = new Date(2023, 0, 1);
    expect(toISODate(date)).toBe('2023-01-01');
  });
});
