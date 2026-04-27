import { describe, it, expect } from 'vitest';
import { 
  getISOWeek, 
  getISOWeekDates,
} from './paceCoach';

describe('Phase 1: Weekly Compliance Engine - Pure Functions', () => {
  describe('getISOWeek', () => {
    it('should return correct ISO week format', () => {
      const date = new Date('2024-01-01'); // Monday of week 1
      const isoWeek = getISOWeek(date);
      expect(isoWeek).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should handle year boundary correctly', () => {
      // Dec 31, 2024 is a Tuesday, should be in week 1 of 2025
      const date = new Date('2024-12-31');
      const isoWeek = getISOWeek(date);
      expect(isoWeek).toBe('2025-W01');
    });

    it('should return consistent week for dates in same week', () => {
      const monday = new Date('2024-01-15');
      const sunday = new Date('2024-01-21');
      expect(getISOWeek(monday)).toBe(getISOWeek(sunday));
    });
  });

  describe('getISOWeekDates', () => {
    it('should return correct start (Monday) and end (Sunday) dates', () => {
      const isoWeek = '2024-W03';
      const { start, end } = getISOWeekDates(isoWeek);
      
      // Start should be Monday
      expect(start.getUTCDay()).toBe(1);
      // End should be Sunday
      expect(end.getUTCDay()).toBe(0);
      
      // Should be 6 days apart
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(6);
    });

    it('should handle different weeks correctly', () => {
      const isoWeek = '2024-W10';
      const { start, end } = getISOWeekDates(isoWeek);
      
      expect(start.getUTCDay()).toBe(1);
      expect(end.getUTCDay()).toBe(0);
    });
  });
});
