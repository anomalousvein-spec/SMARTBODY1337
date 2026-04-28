/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Phase 2 Tests: Tiered Trend Calculations and Enhanced Check-in Logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateTrendRateWithTier,
  determineAdjustment,
  calculateEnhancedCheckInSuggestion,
  getISOWeek,
  getISOWeekDates,
} from "./paceCoach";
import { WeeklyMetrics } from "../db/models";

// Mock database - must be before imports that use it
vi.mock("../db/database", () => ({
  db: {
    weights: {
      where: vi.fn(),
    },
    weekly_metrics: {
      where: vi.fn(),
    },
  },
}));

import { db } from "../db/database";

describe("Phase 2: Tiered Trend Calculations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateTrendRateWithTier", () => {
    it("should use Tier 1 (simple delta) for users with < 2 compliant weeks", async () => {
      const currentWeekWeights = [
        { user_id: "user1", date: "2024-01-15T10:00:00Z", weight: 178 },
      ];
      const priorWeekWeights = [
        { user_id: "user1", date: "2024-01-08T10:00:00Z", weight: 180 },
      ];

      const mockBetweenFn = vi
        .fn()
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(currentWeekWeights),
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(priorWeekWeights),
        });
      const mockWeights = {
        where: vi.fn().mockReturnValue({ between: mockBetweenFn }),
      };

      const mockMetricsData: any[] = []; // 0 compliant weeks
      const mockToArrayFn = vi.fn().mockResolvedValue(mockMetricsData);
      const mockFilterFn = vi.fn().mockReturnValue({ toArray: mockToArrayFn });
      const mockBelowFn = vi.fn().mockReturnValue({ filter: mockFilterFn });
      const mockMetrics = {
        where: vi.fn().mockReturnValue({ below: mockBelowFn }),
      };

      (db.weights as any) = mockWeights;
      (db.weekly_metrics as any) = mockMetrics;

      const result = await calculateTrendRateWithTier("user1", "2024-W03");

      expect(result.tier).toBe(1);
      expect(result.canCalculate).toBe(true);
      expect(result.trendRateLbsPerWeek).toBeCloseTo(-2, 0); // 178 - 180 = -2
    });

    it("should use Tier 2 (average difference) for users with ≥ 2 compliant weeks", async () => {
      const currentWeekWeights = [
        { user_id: "user1", date: "2024-01-15T10:00:00Z", weight: 178 },
        { user_id: "user1", date: "2024-01-16T10:00:00Z", weight: 177.5 },
        { user_id: "user1", date: "2024-01-17T10:00:00Z", weight: 177 },
      ];

      const priorWeekWeights = [
        { user_id: "user1", date: "2024-01-08T10:00:00Z", weight: 180 },
        { user_id: "user1", date: "2024-01-09T10:00:00Z", weight: 179.5 },
        { user_id: "user1", date: "2024-01-10T10:00:00Z", weight: 179 },
      ];

      const mockBetweenFn = vi
        .fn()
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(currentWeekWeights),
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(priorWeekWeights),
        });

      const mockWeights = {
        where: vi.fn().mockReturnValue({ between: mockBetweenFn }),
      };

      const mockCompliantWeeks = [
        { iso_week: "2024-W01", adjustment_eligible: true },
        { iso_week: "2024-W02", adjustment_eligible: true },
      ];

      const mockToArrayFn = vi.fn().mockResolvedValue(mockCompliantWeeks);
      const mockFilterFn = vi.fn().mockReturnValue({ toArray: mockToArrayFn });
      const mockBelowFn = vi.fn().mockReturnValue({ filter: mockFilterFn });
      const mockMetrics = {
        where: vi.fn().mockReturnValue({ below: mockBelowFn }),
      };

      (db.weights as any) = mockWeights;
      (db.weekly_metrics as any) = mockMetrics;

      const result = await calculateTrendRateWithTier("user1", "2024-W03");

      expect(result.tier).toBe(2);
      expect(result.canCalculate).toBe(true);

      // Current avg: (178 + 177.5 + 177) / 3 = 177.5
      // Prior avg: (180 + 179.5 + 179) / 3 = 179.5
      // Trend: 177.5 - 179.5 = -2
      expect(result.trendRateLbsPerWeek).toBeCloseTo(-2, 1);
    });

    it("should return INSUFFICIENT_WEIGHT_DATA for Tier 1 with missing data", async () => {
      const mockBetweenFn = vi
        .fn()
        .mockReturnValueOnce({ toArray: vi.fn().mockResolvedValue([]) }) // No current week weights
        .mockReturnValueOnce({
          toArray: vi
            .fn()
            .mockResolvedValue([
              { user_id: "user1", date: "2024-01-08T10:00:00Z", weight: 180 },
            ]),
        });

      const mockWeights = {
        where: vi.fn().mockReturnValue({ between: mockBetweenFn }),
      };

      const mockToArrayFn = vi.fn().mockResolvedValue([]);
      const mockFilterFn = vi.fn().mockReturnValue({ toArray: mockToArrayFn });
      const mockBelowFn = vi.fn().mockReturnValue({ filter: mockFilterFn });
      const mockMetrics = {
        where: vi.fn().mockReturnValue({ below: mockBelowFn }),
      };

      (db.weights as any) = mockWeights;
      (db.weekly_metrics as any) = mockMetrics;

      const result = await calculateTrendRateWithTier("user1", "2024-W03");

      expect(result.tier).toBe(1);
      expect(result.canCalculate).toBe(false);
      expect(result.reason).toBe("INSUFFICIENT_WEIGHT_DATA");
    });

    it("should return INSUFFICIENT_WEIGH_INS_FOR_TIER2 when < 2 weigh-ins per week", async () => {
      const currentWeekWeights = [
        { user_id: "user1", date: "2024-01-15T10:00:00Z", weight: 178 },
      ];

      const priorWeekWeights = [
        { user_id: "user1", date: "2024-01-08T10:00:00Z", weight: 180 },
        { user_id: "user1", date: "2024-01-09T10:00:00Z", weight: 179 },
      ];

      const mockBetweenFn = vi
        .fn()
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(currentWeekWeights),
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(priorWeekWeights),
        });

      const mockWeights = {
        where: vi.fn().mockReturnValue({ between: mockBetweenFn }),
      };

      const mockToArrayFn = vi.fn().mockResolvedValue([
        { iso_week: "2024-W01", adjustment_eligible: true },
        { iso_week: "2024-W02", adjustment_eligible: true },
      ]);
      const mockFilterFn = vi.fn().mockReturnValue({ toArray: mockToArrayFn });
      const mockBelowFn = vi.fn().mockReturnValue({ filter: mockFilterFn });
      const mockMetrics = {
        where: vi.fn().mockReturnValue({ below: mockBelowFn }),
      };

      (db.weights as any) = mockWeights;
      (db.weekly_metrics as any) = mockMetrics;

      const result = await calculateTrendRateWithTier("user1", "2024-W03");

      expect(result.tier).toBe(2);
      expect(result.canCalculate).toBe(false);
      expect(result.reason).toBe("INSUFFICIENT_WEIGH_INS_FOR_TIER2");
    });
  });

  describe("determineAdjustment", () => {
    it("should recommend TOO_SLOW when losing weight slower than goal", () => {
      // Goal: -1.0 lbs/week, Actual: -0.5 lbs/week (too slow)
      const result = determineAdjustment({
        trendRateLbsPerWeek: -0.5,
        goalRateLbsPerWeek: -1.0,
        currentTarget: 1500,
      });

      expect(result.reason).toBe("TOO_SLOW");
      expect(result.adjustmentKcal).toBe(-75); // Reduce calories to increase deficit
    });

    it("should recommend TOO_FAST when losing weight faster than goal", () => {
      // Goal: -1.0 lbs/week, Actual: -1.5 lbs/week (too fast)
      const result = determineAdjustment({
        trendRateLbsPerWeek: -1.5,
        goalRateLbsPerWeek: -1.0,
        currentTarget: 1500,
      });

      expect(result.reason).toBe("TOO_FAST");
      expect(result.adjustmentKcal).toBe(75); // Increase calories to reduce deficit
    });

    it("should recommend ON_TRACK when within tolerance band", () => {
      // Goal: -1.0 lbs/week, Actual: -0.9 lbs/week (within ±0.3 tolerance)
      const result = determineAdjustment({
        trendRateLbsPerWeek: -0.9,
        goalRateLbsPerWeek: -1.0,
        currentTarget: 1500,
      });

      expect(result.reason).toBe("ON_TRACK");
      expect(result.adjustmentKcal).toBe(0);
    });

    it("should handle weight gain goals correctly", () => {
      // Goal: +0.5 lbs/week, Actual: +0.1 lbs/week (too slow)
      const result = determineAdjustment({
        trendRateLbsPerWeek: 0.1,
        goalRateLbsPerWeek: 0.5,
        currentTarget: 2500,
      });

      expect(result.reason).toBe("TOO_SLOW");
      expect(result.adjustmentKcal).toBe(-75);
    });

    it("should handle maintenance goals correctly", () => {
      // Goal: 0 lbs/week (maintenance), Actual: -0.5 lbs/week (losing)
      const result = determineAdjustment({
        trendRateLbsPerWeek: -0.5,
        goalRateLbsPerWeek: 0,
        currentTarget: 2000,
      });

      expect(result.reason).toBe("TOO_FAST"); // Losing when should maintain
      expect(result.adjustmentKcal).toBe(75); // Increase calories
    });

    it("should use custom adjustment step when provided", () => {
      const result = determineAdjustment({
        trendRateLbsPerWeek: -2.0,
        goalRateLbsPerWeek: -1.0,
        currentTarget: 1500,
        adjustmentStep: 100,
      });

      expect(result.adjustmentKcal).toBe(100);
    });
  });

  describe("calculateEnhancedCheckInSuggestion", () => {
    it("should return enhanced suggestion with trend-based adjustment", async () => {
      const currentWeekWeights = [
        { user_id: "user1", date: "2024-01-15T10:00:00Z", weight: 178 },
        { user_id: "user1", date: "2024-01-16T10:00:00Z", weight: 177.5 },
      ];

      const priorWeekWeights = [
        { user_id: "user1", date: "2024-01-08T10:00:00Z", weight: 180 },
        { user_id: "user1", date: "2024-01-09T10:00:00Z", weight: 179.5 },
      ];

      const mockBetweenFn = vi
        .fn()
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(currentWeekWeights),
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(priorWeekWeights),
        });

      const mockWeights = {
        where: vi.fn().mockReturnValue({ between: mockBetweenFn }),
      };

      const mockToArrayFn = vi.fn().mockResolvedValue([]); // Tier 1
      const mockFilterFn = vi.fn().mockReturnValue({ toArray: mockToArrayFn });
      const mockBelowFn = vi.fn().mockReturnValue({ filter: mockFilterFn });
      const mockFirstFn = vi.fn().mockResolvedValue(undefined); // No current week metrics yet
      const mockEqualsFn = vi.fn().mockReturnValue({ first: mockFirstFn });

      const mockMetrics = {
        where: vi.fn().mockReturnValue({
          below: mockBelowFn,
          equals: mockEqualsFn,
        }),
      };

      (db.weights as any) = mockWeights;
      (db.weekly_metrics as any) = mockMetrics;

      const result = await calculateEnhancedCheckInSuggestion({
        userId: "user1",
        currentIsoWeek: "2024-W03",
        averageIntake: 1500,
        goalRateLbsPerWeek: -1.0,
        currentTarget: 1500,
        currentTDEE: 2000,
        gender: "male",
        currentWeight: 178,
      });

      expect(result.canAdjust).toBe(true);
      expect(result.tier).toBe(1);
      expect(Math.abs(result.trendRateLbsPerWeek)).toBeCloseTo(2, 0); // Approximate -2 lbs/week
      expect(["TOO_SLOW", "ON_TRACK", "TOO_FAST"]).toContain(
        result.adjustmentReason,
      );
    });

    it("should fallback to TDEE-based suggestion when trend cannot be calculated", async () => {
      const mockBetweenFn = vi
        .fn()
        .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }); // No weights

      const mockWeights = {
        where: vi.fn().mockReturnValue({ between: mockBetweenFn }),
      };

      const mockToArrayFn = vi.fn().mockResolvedValue([]);
      const mockFilterFn = vi.fn().mockReturnValue({ toArray: mockToArrayFn });
      const mockBelowFn = vi.fn().mockReturnValue({ filter: mockFilterFn });
      const mockMetrics = {
        where: vi.fn().mockReturnValue({ below: mockBelowFn }),
      };

      (db.weights as any) = mockWeights;
      (db.weekly_metrics as any) = mockMetrics;

      const result = await calculateEnhancedCheckInSuggestion({
        userId: "user1",
        currentIsoWeek: "2024-W03",
        averageIntake: 1500,
        goalRateLbsPerWeek: -1.0,
        currentTarget: 1500,
        currentTDEE: 2000,
        gender: "male",
        currentWeight: 180,
      });

      expect(result.canAdjust).toBe(false);
      expect(result.holdReason).toBe("INSUFFICIENT_WEIGHT_DATA");
      expect(result.suggestedIntake).toBeGreaterThan(0);
    });

    it("should hold adjustment when compliance is insufficient", async () => {
      const currentWeekWeights = [
        { user_id: "user1", date: "2024-01-15T10:00:00Z", weight: 178 },
        { user_id: "user1", date: "2024-01-16T10:00:00Z", weight: 177.5 },
      ];

      const priorWeekWeights = [
        { user_id: "user1", date: "2024-01-08T10:00:00Z", weight: 180 },
        { user_id: "user1", date: "2024-01-09T10:00:00Z", weight: 179.5 },
      ];

      const mockBetweenFn = vi
        .fn()
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(currentWeekWeights),
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(priorWeekWeights),
        });

      const mockWeights = {
        where: vi.fn().mockReturnValue({
          between: mockBetweenFn,
        }),
      };

      const mockNonCompliantMetrics: WeeklyMetrics = {
        user_id: "user1",
        iso_week: "2024-W03",
        logged_days: 2,
        compliant_days: 1,
        compliance_score: 0.5,
        avg_calories_logged: 1400,
        target_calories: 1500,
        weight_logs_count: 2,
        adjustment_eligible: false,
        hold_reason: "NON_COMPLIANT_HOLD",
        created_at: new Date().toISOString(),
      };

      const mockFilterFn = vi
        .fn()
        .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
      const mockFirstFn = vi.fn().mockResolvedValue(mockNonCompliantMetrics);

      const mockMetrics = {
        where: vi.fn().mockReturnValue({
          below: vi.fn().mockReturnValue({
            filter: mockFilterFn,
          }),
          equals: vi.fn().mockReturnValue({
            first: mockFirstFn,
          }),
        }),
      };

      (db.weights as any) = mockWeights;
      (db.weekly_metrics as any) = mockMetrics;

      const result = await calculateEnhancedCheckInSuggestion({
        userId: "user1",
        currentIsoWeek: "2024-W03",
        averageIntake: 1500,
        goalRateLbsPerWeek: -1.0,
        currentTarget: 1500,
        currentTDEE: 2000,
        gender: "male",
        currentWeight: 178,
      });

      expect(result.canAdjust).toBe(false);
      expect(result.adjustmentReason).toBe("COMPLIANCE_HOLD");
      expect(result.holdReason).toBe("NON_COMPLIANT_HOLD");
    });

    it("should respect calorie floor in boundary logic", async () => {
      const currentWeekWeights = [
        { user_id: "user1", date: "2024-01-15T10:00:00Z", weight: 178 },
        { user_id: "user1", date: "2024-01-16T10:00:00Z", weight: 177.5 },
      ];

      const priorWeekWeights = [
        { user_id: "user1", date: "2024-01-08T10:00:00Z", weight: 180 },
        { user_id: "user1", date: "2024-01-09T10:00:00Z", weight: 179.5 },
      ];

      const mockBetweenFn = vi
        .fn()
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(currentWeekWeights),
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(priorWeekWeights),
        });

      const mockWeights = {
        where: vi.fn().mockReturnValue({
          between: mockBetweenFn,
        }),
      };

      const mockFilterFn = vi
        .fn()
        .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
      const mockEqualsFn = vi
        .fn()
        .mockReturnValue({ first: vi.fn().mockResolvedValue(undefined) });

      const mockMetrics = {
        where: vi.fn().mockReturnValue({
          below: vi.fn().mockReturnValue({
            filter: mockFilterFn,
          }),
          equals: mockEqualsFn,
        }),
      };

      (db.weights as any) = mockWeights;
      (db.weekly_metrics as any) = mockMetrics;

      // User is losing too fast, algorithm wants to increase calories
      // But if current target is already at floor, it shouldn't go lower
      const result = await calculateEnhancedCheckInSuggestion({
        userId: "user1",
        currentIsoWeek: "2024-W03",
        averageIntake: 1200,
        goalRateLbsPerWeek: -1.0,
        currentTarget: 1200, // At floor
        currentTDEE: 2000,
        gender: "female",
        currentWeight: 178,
      });

      // Should not go below 1200 (female floor)
      expect(result.suggestedIntake).toBeGreaterThanOrEqual(1200);
    });
  });

  describe("getISOWeek and getISOWeekDates", () => {
    it("should correctly calculate ISO week number", () => {
      const date = new Date("2024-01-15"); // Monday of week 3
      const isoWeek = getISOWeek(date);
      expect(isoWeek).toMatch(/^\d{4}-W\d{2}$/);
    });

    it("should correctly get week start and end dates", () => {
      const { start, end } = getISOWeekDates("2024-W03");

      // Week 3 of 2024 starts on Monday Jan 15
      expect(start.getDay()).toBe(1); // Monday
      expect(end.getDay()).toBe(0); // Sunday

      // Should be 6 days apart
      const diffDays = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(6);
    });
  });
});
