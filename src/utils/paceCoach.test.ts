import { describe, it, expect } from 'vitest';
import { 
  calculateTrendSlope, 
  calculateBackCalculatedTDEE, 
  calculateSuggestedIntake,
  isCheckInDue 
} from './paceCoach';

describe('Pace Coach Utils', () => {
  describe('calculateTrendSlope', () => {
    it('should return 0 for less than 2 data points', () => {
      expect(calculateTrendSlope([])).toBe(0);
      expect(calculateTrendSlope([150])).toBe(0);
    });

    it('should calculate positive slope for weight gain', () => {
      // Gaining 1 lb per day: 150, 151, 152, 153, 154
      const weights = [150, 151, 152, 153, 154];
      const slope = calculateTrendSlope(weights);
      expect(slope).toBeCloseTo(1, 5);
    });

    it('should calculate negative slope for weight loss', () => {
      // Losing 0.5 lb per day: 150, 149.5, 149, 148.5, 148
      const weights = [150, 149.5, 149, 148.5, 148];
      const slope = calculateTrendSlope(weights);
      expect(slope).toBeCloseTo(-0.5, 5);
    });

    it('should return 0 for constant weight', () => {
      const weights = [150, 150, 150, 150, 150];
      const slope = calculateTrendSlope(weights);
      expect(slope).toBe(0);
    });
  });

  describe('calculateBackCalculatedTDEE', () => {
    it('should calculate TDEE correctly for weight loss (negative slope)', () => {
      // Intake 2000 cal, losing 0.2 lbs/day (700 cal deficit)
      // TDEE should be 2000 + 700 = 2700
      const tdee = calculateBackCalculatedTDEE(2000, -0.2);
      expect(tdee).toBe(2700);
    });

    it('should calculate TDEE correctly for weight gain (positive slope)', () => {
      // Intake 2500 cal, gaining 0.2 lbs/day (700 cal surplus)
      // TDEE should be 2500 - 700 = 1800
      const tdee = calculateBackCalculatedTDEE(2500, 0.2);
      expect(tdee).toBe(1800);
    });

    it('should return intake when weight is stable', () => {
      // Intake 2000 cal, no weight change
      // TDEE should equal intake
      const tdee = calculateBackCalculatedTDEE(2000, 0);
      expect(tdee).toBe(2000);
    });
  });

  describe('calculateSuggestedIntake', () => {
    it('should calculate basic suggestion from TDEE and goal', () => {
      // TDEE 2500, goal 1 lb/week = 500 cal deficit
      // Suggestion should be 2000
      const suggestion = calculateSuggestedIntake({
        currentTDEE: 2500,
        goalLbsPerWeek: 1
      });
      expect(suggestion).toBe(2000);
    });

    it('should respect minimum floor for females', () => {
      // TDEE 2000, goal 2 lbs/week = 1000 cal deficit would give 1000
      // But floor is 1200 for females
      const suggestion = calculateSuggestedIntake({
        currentTDEE: 2000,
        goalLbsPerWeek: 2,
        gender: 'female'
      });
      expect(suggestion).toBeGreaterThanOrEqual(1200);
    });

    it('should respect higher minimum floor for males', () => {
      // TDEE 2200, goal 2 lbs/week = 1000 cal deficit would give 1200
      // But floor is 1500 for males
      const suggestion = calculateSuggestedIntake({
        currentTDEE: 2200,
        goalLbsPerWeek: 2,
        gender: 'male'
      });
      expect(suggestion).toBeGreaterThanOrEqual(1500);
    });

    it('should respect BMR-based floor', () => {
      // BMR 2000, floor should be at least 1600 (80% of BMR)
      const suggestion = calculateSuggestedIntake({
        currentTDEE: 2500,
        goalLbsPerWeek: 2,
        bmr: 2000,
        gender: 'female'
      });
      expect(suggestion).toBeGreaterThanOrEqual(1600);
    });

    it('should throttle large adjustments', () => {
      // Last suggestion 2000, new calculation suggests 1500 (diff of 500)
      // Should only adjust by max 150
      calculateSuggestedIntake({
        currentTDEE: 2000,
        goalLbsPerWeek: 1,
        lastSuggestedIntake: 2000
      });
      
      // Now test with a big gap
      const throttledSuggestion = calculateSuggestedIntake({
        currentTDEE: 3000, // Would suggest 2500 normally
        goalLbsPerWeek: 1,
        lastSuggestedIntake: 2000
      });
      expect(throttledSuggestion).toBeLessThanOrEqual(2150); // 2000 + 150
    });

    it('should enforce max safe loss rate', () => {
      // For 150 lb person, max safe loss is 1.5 lbs/week (1%)
      // Goal of 3 lbs/week should be capped
      const suggestion = calculateSuggestedIntake({
        currentTDEE: 2500,
        goalLbsPerWeek: 3,
        currentWeight: 150
      });
      // Should be adjusted to respect max 1% body weight loss per week
      expect(suggestion).toBeGreaterThan(2500 - (3 * 500)); // More than unrestricted
    });
  });

  describe('isCheckInDue', () => {
    it('should return true when no previous check-in exists', () => {
      expect(isCheckInDue()).toBe(true);
      expect(isCheckInDue(undefined)).toBe(true);
    });

    it('should return false for recent check-in', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isCheckInDue(yesterday.toISOString(), 10)).toBe(false);
    });

    it('should return true for old check-in', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(isCheckInDue(twoWeeksAgo.toISOString(), 10)).toBe(true);
    });

    it('should use custom reminder frequency', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      expect(isCheckInDue(fiveDaysAgo.toISOString(), 7)).toBe(false);
      expect(isCheckInDue(fiveDaysAgo.toISOString(), 3)).toBe(true);
    });
  });
});
