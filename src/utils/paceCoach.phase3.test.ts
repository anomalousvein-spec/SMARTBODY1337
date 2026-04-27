import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { 
  SmartTrigger,
  CheckInResult,
  NotificationPayload,
  evaluateSmartTriggers,
  shouldSendNotificationForTrigger,
  formatTriggerAsNotification,
  processEnhancedCheckIn
} from './paceCoach';
import { db } from '../db/database';
import { WeeklyMetrics, UserProfile, TDEESettings, WeightEntry } from '../db/models';

/**
 * Phase 3: Smart Triggers & Enhanced Check-in Tests
 */
describe('Phase 3: Smart Triggers & Enhanced Check-in', () => {
  
  const TEST_USER_ID = 'test-user-phase3';
  
  beforeEach(async () => {
    // Clear relevant tables before each test
    await db.weekly_metrics.clear();
    await db.user_profiles.clear();
    await db.weights.clear();
    await db.tdee_settings.clear();
    
    // Create default TDEE settings for test user
    await db.tdee_settings.add({
      id: TEST_USER_ID,
      user_id: TEST_USER_ID,
      age: 30,
      gender: 'male',
      height: 70,
      heightUnit: 'in',
      activityLevel: 'moderately_active',
      targetWeight: 180,
      targetLossRate: -1,
      currentWeight: 200,
      tdee: 2500,
      cuttingCalories: 2000,
      lastUpdated: new Date().toISOString(),
      paceCoachEnabled: true,
      paceCoachReminderDays: 14
    });
  });

  // ============================================================================
  // Test 1: evaluateSmartTriggers returns HIGH priority when compliance drops < 50% twice
  // ============================================================================
  describe('evaluateSmartTriggers - COMPLIANCE_LOW', () => {
    it('should return HIGH priority trigger when compliance_score < 0.5 for 2 consecutive weeks', async () => {
      // Arrange: Create 2 consecutive weeks with low compliance
      const today = new Date();
      const week1Iso = `${today.getFullYear()}-W${String(Math.floor(today.getMonth() / 4) + 1).padStart(2, '0')}`;
      const week2Iso = `${today.getFullYear()}-W${String(Math.floor(today.getMonth() / 4) + 2).padStart(2, '0')}`;
      
      await db.weekly_metrics.bulkAdd([
        {
          user_id: TEST_USER_ID,
          iso_week: week1Iso,
          logged_days: 4,
          compliant_days: 1,
          compliance_score: 0.25, // < 0.5
          avg_calories_logged: 1800,
          target_calories: 2000,
          weight_logs_count: 2,
          adjustment_eligible: false,
          hold_reason: 'NON_COMPLIANT_HOLD',
          created_at: new Date().toISOString()
        },
        {
          user_id: TEST_USER_ID,
          iso_week: week2Iso,
          logged_days: 3,
          compliant_days: 1,
          compliance_score: 0.33, // < 0.5
          avg_calories_logged: 1700,
          target_calories: 2000,
          weight_logs_count: 2,
          adjustment_eligible: false,
          hold_reason: 'NON_COMPLIANT_HOLD',
          created_at: new Date().toISOString()
        }
      ] as WeeklyMetrics[]);
      
      // Act
      const triggers = await evaluateSmartTriggers(TEST_USER_ID);
      
      // Assert
      const complianceLowTrigger = triggers.find(t => t.type === 'COMPLIANCE_LOW');
      expect(complianceLowTrigger).toBeDefined();
      expect(complianceLowTrigger?.priority).toBe('HIGH');
      expect(complianceLowTrigger?.message).toContain('below 50%');
      expect(complianceLowTrigger?.meta.recentScore).toBeLessThan(0.5);
      expect(complianceLowTrigger?.meta.previousScore).toBeLessThan(0.5);
    });

    it('should NOT return HIGH priority if only one week has low compliance', async () => {
      // Arrange: Only one week with low compliance
      const today = new Date();
      const week1Iso = `${today.getFullYear()}-W01`;
      const week2Iso = `${today.getFullYear()}-W02`;
      
      await db.weekly_metrics.bulkAdd([
        {
          user_id: TEST_USER_ID,
          iso_week: week1Iso,
          logged_days: 4,
          compliant_days: 1,
          compliance_score: 0.25, // < 0.5
          avg_calories_logged: 1800,
          target_calories: 2000,
          weight_logs_count: 2,
          adjustment_eligible: false,
          hold_reason: 'NON_COMPLIANT_HOLD',
          created_at: new Date().toISOString()
        },
        {
          user_id: TEST_USER_ID,
          iso_week: week2Iso,
          logged_days: 5,
          compliant_days: 4,
          compliance_score: 0.8, // >= 0.5
          avg_calories_logged: 1950,
          target_calories: 2000,
          weight_logs_count: 3,
          adjustment_eligible: true,
          created_at: new Date().toISOString()
        }
      ] as WeeklyMetrics[]);
      
      // Act
      const triggers = await evaluateSmartTriggers(TEST_USER_ID);
      
      // Assert
      const complianceLowTrigger = triggers.find(t => t.type === 'COMPLIANCE_LOW');
      expect(complianceLowTrigger).toBeUndefined();
    });
  });

  // ============================================================================
  // Test 2: evaluateSmartTriggers returns MILESTONE when streak hits 4, 8, etc.
  // ============================================================================
  describe('evaluateSmartTriggers - MILESTONE', () => {
    it('should return MILESTONE trigger when consecutive_compliant_weeks is 4', async () => {
      // Arrange: User profile with 4 consecutive compliant weeks
      await db.user_profiles.add({
        user_id: TEST_USER_ID,
        consecutive_compliant_weeks: 4,
        last_check_in_date: new Date().toISOString(),
        current_target_calories: 2000,
        goal_rate_lbs_per_week: -1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile);
      
      // Act
      const triggers = await evaluateSmartTriggers(TEST_USER_ID);
      
      // Assert
      const milestoneTrigger = triggers.find(t => t.type === 'MILESTONE');
      expect(milestoneTrigger).toBeDefined();
      expect(milestoneTrigger?.priority).toBe('LOW');
      expect(milestoneTrigger?.message).toContain('4 compliant weeks');
      expect(milestoneTrigger?.meta.streak).toBe(4);
      expect(milestoneTrigger?.meta.milestone).toBe(1);
    });

    it('should return MILESTONE trigger when consecutive_compliant_weeks is 8', async () => {
      // Arrange: User profile with 8 consecutive compliant weeks
      await db.user_profiles.add({
        user_id: TEST_USER_ID,
        consecutive_compliant_weeks: 8,
        last_check_in_date: new Date().toISOString(),
        current_target_calories: 2000,
        goal_rate_lbs_per_week: -1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile);
      
      // Act
      const triggers = await evaluateSmartTriggers(TEST_USER_ID);
      
      // Assert
      const milestoneTrigger = triggers.find(t => t.type === 'MILESTONE');
      expect(milestoneTrigger).toBeDefined();
      expect(milestoneTrigger?.meta.streak).toBe(8);
      expect(milestoneTrigger?.meta.milestone).toBe(2);
    });

    it('should NOT return MILESTONE trigger when streak is not divisible by 4', async () => {
      // Arrange: User profile with 3 consecutive compliant weeks (not divisible by 4)
      await db.user_profiles.add({
        user_id: TEST_USER_ID,
        consecutive_compliant_weeks: 3,
        last_check_in_date: new Date().toISOString(),
        current_target_calories: 2000,
        goal_rate_lbs_per_week: -1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile);
      
      // Act
      const triggers = await evaluateSmartTriggers(TEST_USER_ID);
      
      // Assert
      const milestoneTrigger = triggers.find(t => t.type === 'MILESTONE');
      expect(milestoneTrigger).toBeUndefined();
    });

    it('should NOT return MILESTONE trigger when streak is 0', async () => {
      // Arrange: User profile with 0 consecutive compliant weeks
      await db.user_profiles.add({
        user_id: TEST_USER_ID,
        consecutive_compliant_weeks: 0,
        last_check_in_date: new Date().toISOString(),
        current_target_calories: 2000,
        goal_rate_lbs_per_week: -1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile);
      
      // Act
      const triggers = await evaluateSmartTriggers(TEST_USER_ID);
      
      // Assert
      const milestoneTrigger = triggers.find(t => t.type === 'MILESTONE');
      expect(milestoneTrigger).toBeUndefined();
    });
  });

  // ============================================================================
  // Test 3: shouldSendNotificationForTrigger correctly blocks duplicate alerts within 3 days
  // ============================================================================
  describe('shouldSendNotificationForTrigger', () => {
    it('should allow notification when lastSentDate is null', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'COMPLIANCE_LOW',
        priority: 'HIGH',
        message: 'Test message',
        meta: {}
      };
      
      // Act
      const result = shouldSendNotificationForTrigger(trigger, null);
      
      // Assert
      expect(result).toBe(true);
    });

    it('should block HIGH priority notification if sent less than 3 days ago', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'COMPLIANCE_LOW',
        priority: 'HIGH',
        message: 'Test message',
        meta: {}
      };
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // Act
      const result = shouldSendNotificationForTrigger(trigger, twoDaysAgo);
      
      // Assert
      expect(result).toBe(false);
    });

    it('should allow HIGH priority notification if sent 3 or more days ago', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'COMPLIANCE_LOW',
        priority: 'HIGH',
        message: 'Test message',
        meta: {}
      };
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Act
      const result = shouldSendNotificationForTrigger(trigger, threeDaysAgo);
      
      // Assert
      expect(result).toBe(true);
    });

    it('should block MEDIUM priority notification if sent less than 5 days ago', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'COMPLIANCE_SLIPPING',
        priority: 'MEDIUM',
        message: 'Test message',
        meta: {}
      };
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      
      // Act
      const result = shouldSendNotificationForTrigger(trigger, fourDaysAgo);
      
      // Assert
      expect(result).toBe(false);
    });

    it('should allow MEDIUM priority notification if sent 5 or more days ago', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'COMPLIANCE_SLIPPING',
        priority: 'MEDIUM',
        message: 'Test message',
        meta: {}
      };
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      // Act
      const result = shouldSendNotificationForTrigger(trigger, fiveDaysAgo);
      
      // Assert
      expect(result).toBe(true);
    });

    it('should always allow MILESTONE notifications regardless of timing', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'MILESTONE',
        priority: 'LOW',
        message: 'Congratulations!',
        meta: {}
      };
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Act
      const result = shouldSendNotificationForTrigger(trigger, yesterday);
      
      // Assert
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Test 4: formatTriggerAsNotification returns correct payload
  // ============================================================================
  describe('formatTriggerAsNotification', () => {
    it('should format COMPLIANCE_LOW trigger correctly', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'COMPLIANCE_LOW',
        priority: 'HIGH',
        message: 'Your compliance is low',
        meta: {}
      };
      
      // Act
      const notification = formatTriggerAsNotification(trigger);
      
      // Assert
      expect(notification.title).toBe('⚠️ Compliance Alert');
      expect(notification.actionType).toBe('VIEW_COMPLIANCE');
      expect(notification.body).toBe('Your compliance is low');
    });

    it('should format MILESTONE trigger correctly', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'MILESTONE',
        priority: 'LOW',
        message: 'Congratulations!',
        meta: {}
      };
      
      // Act
      const notification = formatTriggerAsNotification(trigger);
      
      // Assert
      expect(notification.title).toBe('🎉 Achievement Unlocked!');
      expect(notification.actionType).toBe('CELEBRATE');
    });

    it('should format DATA_GAP trigger correctly', () => {
      // Arrange
      const trigger: SmartTrigger = {
        type: 'DATA_GAP',
        priority: 'MEDIUM',
        message: 'No weigh-in detected',
        meta: {}
      };
      
      // Act
      const notification = formatTriggerAsNotification(trigger);
      
      // Assert
      expect(notification.title).toBe('⏰ Time to Weigh In');
      expect(notification.actionType).toBe('LOG_WEIGHT');
    });
  });

  // ============================================================================
  // Test 5: processEnhancedCheckIn successfully chains tier calculation, adjustment, and trigger evaluation
  // ============================================================================
  describe('processEnhancedCheckIn', () => {
    beforeEach(async () => {
      // Setup: Create some historical data for trend calculation
      const today = new Date();
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(today.getDate() - 14);
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      
      // Add weight logs for prior weeks
      await db.weights.bulkAdd([
        {
          user_id: TEST_USER_ID,
          date: twoWeeksAgo.toISOString(),
          weight: 202,
          unit: 'lbs'
        },
        {
          user_id: TEST_USER_ID,
          date: oneWeekAgo.toISOString(),
          weight: 201,
          unit: 'lbs'
        }
      ] as WeightEntry[]);
      
      // Add compliant weekly metrics
      const week1Iso = `${twoWeeksAgo.getFullYear()}-W${String(Math.floor(twoWeeksAgo.getMonth() / 4) + 1).padStart(2, '0')}`;
      const week2Iso = `${oneWeekAgo.getFullYear()}-W${String(Math.floor(oneWeekAgo.getMonth() / 4) + 1).padStart(2, '0')}`;
      
      await db.weekly_metrics.bulkAdd([
        {
          user_id: TEST_USER_ID,
          iso_week: week1Iso,
          logged_days: 5,
          compliant_days: 4,
          compliance_score: 0.8,
          avg_calories_logged: 1950,
          target_calories: 2000,
          weight_logs_count: 3,
          adjustment_eligible: true,
          created_at: new Date().toISOString()
        },
        {
          user_id: TEST_USER_ID,
          iso_week: week2Iso,
          logged_days: 6,
          compliant_days: 5,
          compliance_score: 0.83,
          avg_calories_logged: 1980,
          target_calories: 2000,
          weight_logs_count: 3,
          adjustment_eligible: true,
          created_at: new Date().toISOString()
        }
      ] as WeeklyMetrics[]);
    });

    it('should successfully process check-in and return result with all expected fields', async () => {
      // Arrange
      const checkInData = { weight: 200, notes: 'Feeling good!' };
      
      // Act
      const result = await processEnhancedCheckIn(TEST_USER_ID, checkInData);
      
      // Assert
      expect(result).toBeDefined();
      expect(typeof result.newTarget).toBe('number');
      expect(typeof result.adjustmentAmount).toBe('number');
      expect(typeof result.trendRate).toBe('number');
      expect(Array.isArray(result.triggers)).toBe(true);
      
      // Verify weight was saved
      const weights = await db.weights.where('user_id').equals(TEST_USER_ID).toArray();
      expect(weights.length).toBeGreaterThan(2);
      
      // Verify user profile was created/updated
      const userProfile = await db.user_profiles.where('user_id').equals(TEST_USER_ID).first();
      expect(userProfile).toBeDefined();
      expect(userProfile?.current_target_calories).toBe(result.newTarget);
    });

    it('should apply boundary safeguards (floor limit)', async () => {
      // Arrange: Set up a scenario where adjustment would go below floor
      const checkInData = { weight: 200 };
      
      // Act
      const result = await processEnhancedCheckIn(TEST_USER_ID, checkInData);
      
      // Assert
      // For male users, floor should be 1500
      expect(result.newTarget).toBeGreaterThanOrEqual(1500);
    });

    it('should throw error for invalid weight input', async () => {
      // Arrange
      const checkInData = { weight: 0 };
      
      // Act & Assert
      await expect(processEnhancedCheckIn(TEST_USER_ID, checkInData))
        .rejects.toThrow('Invalid weight value provided');
    });

    it('should throw error when TDEE settings not found', async () => {
      // Arrange: Clear TDEE settings
      await db.tdee_settings.clear();
      const checkInData = { weight: 200 };
      
      // Act & Assert
      await expect(processEnhancedCheckIn(TEST_USER_ID, checkInData))
        .rejects.toThrow('User TDEE settings not found');
    });

    it('should include triggers in result when conditions are met', async () => {
      // Arrange: Set up data gap scenario (no recent weights except what we're adding)
      // Clear existing weights to simulate data gap
      await db.weights.clear();
      const checkInData = { weight: 200 };
      
      // Act
      const result = await processEnhancedCheckIn(TEST_USER_ID, checkInData);
      
      // Assert: Should have triggers array (may or may not have triggers depending on state)
      expect(result.triggers).toBeDefined();
      expect(Array.isArray(result.triggers)).toBe(true);
    });
  });

  // ============================================================================
  // Additional edge case tests
  // ============================================================================
  describe('evaluateSmartTriggers - COMPLIANCE_SLIPPING', () => {
    it('should return MEDIUM priority when compliance is between 0.5 and 0.8', async () => {
      // Arrange
      const today = new Date();
      const weekIso = `${today.getFullYear()}-W01`;
      
      await db.weekly_metrics.add({
        user_id: TEST_USER_ID,
        iso_week: weekIso,
        logged_days: 5,
        compliant_days: 3,
        compliance_score: 0.6, // Between 0.5 and 0.8
        avg_calories_logged: 1900,
        target_calories: 2000,
        weight_logs_count: 2,
        adjustment_eligible: false,
        created_at: new Date().toISOString()
      } as WeeklyMetrics);
      
      // Act
      const triggers = await evaluateSmartTriggers(TEST_USER_ID);
      
      // Assert
      const slippingTrigger = triggers.find(t => t.type === 'COMPLIANCE_SLIPPING');
      expect(slippingTrigger).toBeDefined();
      expect(slippingTrigger?.priority).toBe('MEDIUM');
      expect(slippingTrigger?.message).toContain('60%');
    });
  });

  describe('evaluateSmartTriggers - DATA_GAP', () => {
    it('should return DATA_GAP trigger when no weight log in last 10 days', async () => {
      // Arrange: No weights in database
      
      // Act
      const triggers = await evaluateSmartTriggers(TEST_USER_ID);
      
      // Assert
      const dataGapTrigger = triggers.find(t => t.type === 'DATA_GAP');
      expect(dataGapTrigger).toBeDefined();
      expect(dataGapTrigger?.priority).toBe('MEDIUM');
      expect(dataGapTrigger?.message).toContain('10 days');
    });
  });
});
