import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateAdvancedMacros } from '../utils/calculations';
import { calculateSuggestedIntake } from '../utils/pace-coach/math';
import { calculateTrendRateWithTier } from '../utils/pace-coach/trends';
import { db } from '../db/database';

vi.mock('../db/database', () => ({
  db: {
    weights: {
      where: vi.fn().mockReturnThis(),
      between: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    },
    weekly_metrics: {
      where: vi.fn().mockReturnThis(),
      below: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    },
  },
}));

describe('Analytics Sanity & Logic Optimization', () => {
  describe('Macro Allocation', () => {
    it('should allocate remaining calories to carbs after protein and fat floors', () => {
      const lbm = 70; // kg
      const targetCalories = 2000;
      const result = calculateAdvancedMacros(lbm, 175, 1600, 2200, targetCalories);

      // Protein min = 70 * 2.0 = 140g (560 kcal)
      // Fat floor = 175 * 0.3 = 52.5g (472.5 kcal)
      // Remaining = 2000 - 560 - 472.5 = 967.5 kcal
      // Carbs = 967.5 / 4 = 241.875g

      expect(result.carbs).toBeCloseTo(241.875);
      expect(result.remainingCalories).toBe(0);
    });
  });

  describe('Pace Coach BMR Floor', () => {
    it('should respect user-specific BMR if it is higher than the static floor', () => {
      const userBmr = 1800; // higher than male floor of 1500
      const currentTDEE = 2500;
      const suggestion = calculateSuggestedIntake({
        currentTDEE,
        goalLbsPerWeek: 1.0,
        bmr: userBmr,
        gender: 'male',
      });

      // target = 2500 - 500 = 2000. 2000 > 1800, so 2000 is okay.
      expect(suggestion).toBe(2000);

      const aggressiveSuggestion = calculateSuggestedIntake({
        currentTDEE,
        goalLbsPerWeek: 2.0, // deficit of 1000
        bmr: userBmr,
        gender: 'male',
      });

      // target = 2500 - 1000 = 1500. 1500 < 1800, so it should floor at 1800.
      expect(aggressiveSuggestion).toBe(1800);
    });
  });

  describe('Pace Coach Trend (Tier 1)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should use averages in Tier 1 if multiple weights exist in both weeks', async () => {
      const userId = 'test-user';
      const currentIsoWeek = '2024-W10';

      // Mock weights: Week 9 (prior) and Week 10 (current)
      const mockPriorWeights = [
        { weight: 200, date: '2024-03-04T08:00:00Z' },
        { weight: 202, date: '2024-03-05T08:00:00Z' },
      ]; // Avg = 201

      const mockCurrentWeights = [
        { weight: 198, date: '2024-03-11T08:00:00Z' },
        { weight: 196, date: '2024-03-12T08:00:00Z' },
      ]; // Avg = 197

      // Setup mocks
      (db.weights.toArray as any)
        .mockResolvedValueOnce(mockCurrentWeights)
        .mockResolvedValueOnce(mockPriorWeights);

      (db.weekly_metrics.toArray as any).mockResolvedValue([]); // No compliant weeks = Tier 1

      const result = await calculateTrendRateWithTier(userId, currentIsoWeek);

      expect(result.tier).toBe(1);
      expect(result.trendRateLbsPerWeek).toBe(-4); // 197 - 201
    });

    it('should fallback to point-to-point in Tier 1 if data is sparse', async () => {
      const userId = 'test-user';
      const currentIsoWeek = '2024-W10';

      const mockPriorWeights = [{ weight: 200, date: '2024-03-04T08:00:00Z' }];
      const mockCurrentWeights = [{ weight: 198, date: '2024-03-11T08:00:00Z' }];

      (db.weights.toArray as any)
        .mockResolvedValueOnce(mockCurrentWeights)
        .mockResolvedValueOnce(mockPriorWeights);

      (db.weekly_metrics.toArray as any).mockResolvedValue([]);

      const result = await calculateTrendRateWithTier(userId, currentIsoWeek);

      expect(result.tier).toBe(1);
      expect(result.trendRateLbsPerWeek).toBe(-2); // 198 - 200
    });
  });
});
