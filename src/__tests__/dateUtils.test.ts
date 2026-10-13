import { describe, it, expect } from 'vitest';
import {
  dateString,
  parseDate,
  isValidDateString,
  weekdayOf,
  addDays,
  daysBetween,
  isBefore,
  isAfter,
  isSameOrBefore,
  isSameOrAfter,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  enumerateDates,
  maxDate,
  minDate,
} from '@/utils/dateUtils';

describe('dateUtils', () => {
  describe('dateString', () => {
    it('formats a date correctly', () => {
      expect(dateString(new Date(2024, 0, 15))).toBe('2024-01-15');
      expect(dateString(new Date(2024, 11, 31))).toBe('2024-12-31');
      expect(dateString(new Date(2024, 5, 1))).toBe('2024-06-01');
    });
  });

  describe('parseDate', () => {
    it('parses valid date strings', () => {
      expect(parseDate('2024-01-15')?.getTime()).toBe(new Date(2024, 0, 15).getTime());
      expect(parseDate('2024-12-31')?.getTime()).toBe(new Date(2024, 11, 31).getTime());
    });

    it('rejects invalid date strings', () => {
      expect(parseDate('2024-13-01')).toBeNull();
      expect(parseDate('2024-00-01')).toBeNull();
      expect(parseDate('2024-01-32')).toBeNull();
      expect(parseDate('2024-01-00')).toBeNull();
      expect(parseDate('not-a-date')).toBeNull();
      expect(parseDate('')).toBeNull();
      expect(parseDate('2024/01/15')).toBeNull();
    });

    it('rejects Feb 30', () => {
      expect(parseDate('2024-02-30')).toBeNull();
    });

    it('accepts Feb 29 in a leap year', () => {
      expect(parseDate('2024-02-29')?.getTime()).toBe(new Date(2024, 1, 29).getTime());
    });

    it('rejects Feb 29 in a non-leap year', () => {
      expect(parseDate('2023-02-29')).toBeNull();
    });
  });

  describe('isValidDateString', () => {
    it('validates correctly', () => {
      expect(isValidDateString('2024-01-15')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // leap year
      expect(isValidDateString('invalid')).toBe(false);
    });
  });

  describe('weekdayOf', () => {
    it('returns the correct weekday', () => {
      expect(weekdayOf('2024-01-14')).toBe(0); // Sunday
      expect(weekdayOf('2024-01-15')).toBe(1); // Monday
      expect(weekdayOf('2024-01-16')).toBe(2); // Tuesday
      expect(weekdayOf('2024-01-20')).toBe(6); // Saturday
    });
  });

  describe('addDays', () => {
    it('adds days correctly', () => {
      expect(addDays('2024-01-15', 1)).toBe('2024-01-16');
      expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
      expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
      expect(addDays('2024-01-15', -1)).toBe('2024-01-14');
      expect(addDays('2024-03-01', -1)).toBe('2024-02-29'); // leap year
    });
  });

  describe('daysBetween', () => {
    it('calculates the number of days between two dates', () => {
      expect(daysBetween('2024-01-15', '2024-01-20')).toBe(5);
      expect(daysBetween('2024-01-20', '2024-01-15')).toBe(-5);
      expect(daysBetween('2024-01-15', '2024-01-15')).toBe(0);
    });

    it('handles month boundaries', () => {
      expect(daysBetween('2024-01-31', '2024-02-01')).toBe(1);
      expect(daysBetween('2024-12-31', '2025-01-01')).toBe(1);
    });
  });

  describe('comparison functions', () => {
    it('isBefore', () => {
      expect(isBefore('2024-01-15', '2024-01-20')).toBe(true);
      expect(isBefore('2024-01-20', '2024-01-15')).toBe(false);
      expect(isBefore('2024-01-15', '2024-01-15')).toBe(false);
    });

    it('isAfter', () => {
      expect(isAfter('2024-01-20', '2024-01-15')).toBe(true);
      expect(isAfter('2024-01-15', '2024-01-20')).toBe(false);
      expect(isAfter('2024-01-15', '2024-01-15')).toBe(false);
    });

    it('isSameOrBefore', () => {
      expect(isSameOrBefore('2024-01-15', '2024-01-20')).toBe(true);
      expect(isSameOrBefore('2024-01-15', '2024-01-15')).toBe(true);
      expect(isSameOrBefore('2024-01-20', '2024-01-15')).toBe(false);
    });

    it('isSameOrAfter', () => {
      expect(isSameOrAfter('2024-01-20', '2024-01-15')).toBe(true);
      expect(isSameOrAfter('2024-01-15', '2024-01-15')).toBe(true);
      expect(isSameOrAfter('2024-01-15', '2024-01-20')).toBe(false);
    });
  });

  describe('startOfWeek', () => {
    it('returns the start of the week (Sunday)', () => {
      expect(startOfWeek('2024-01-17', 'sunday')).toBe('2024-01-14'); // Wednesday -> Sunday
    });

    it('returns the start of the week (Monday)', () => {
      expect(startOfWeek('2024-01-17', 'monday')).toBe('2024-01-15'); // Wednesday -> Monday
      expect(startOfWeek('2024-01-14', 'monday')).toBe('2024-01-08'); // Sunday -> previous Monday
    });
  });

  describe('endOfWeek', () => {
    it('returns the end of the week', () => {
      expect(endOfWeek('2024-01-17', 'sunday')).toBe('2024-01-20');
      expect(endOfWeek('2024-01-17', 'monday')).toBe('2024-01-21');
    });
  });

  describe('startOfMonth / endOfMonth', () => {
    it('returns the start of the month', () => {
      expect(startOfMonth('2024-01-15')).toBe('2024-01-01');
      expect(startOfMonth('2024-02-29')).toBe('2024-02-01');
    });

    it('returns the end of the month', () => {
      expect(endOfMonth('2024-01-15')).toBe('2024-01-31');
      expect(endOfMonth('2024-02-15')).toBe('2024-02-29'); // leap year
      expect(endOfMonth('2023-02-15')).toBe('2023-02-28'); // non-leap year
      expect(endOfMonth('2024-04-15')).toBe('2024-04-30');
    });
  });

  describe('isSameMonth', () => {
    it('checks if two dates are in the same month', () => {
      expect(isSameMonth('2024-01-15', '2024-01-31')).toBe(true);
      expect(isSameMonth('2024-01-15', '2024-02-01')).toBe(false);
    });
  });

  describe('enumerateDates', () => {
    it('enumerates all dates in a range', () => {
      const dates = enumerateDates('2024-01-15', '2024-01-20');
      expect(dates).toEqual(['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19', '2024-01-20']);
    });

    it('handles month boundaries', () => {
      const dates = enumerateDates('2024-01-30', '2024-02-02');
      expect(dates).toEqual(['2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02']);
    });

    it('handles year boundaries', () => {
      const dates = enumerateDates('2024-12-30', '2025-01-02');
      expect(dates).toEqual(['2024-12-30', '2024-12-31', '2025-01-01', '2025-01-02']);
    });
  });

  describe('maxDate / minDate', () => {
    it('returns the later date', () => {
      expect(maxDate('2024-01-15', '2024-01-20')).toBe('2024-01-20');
      expect(maxDate('2024-01-20', '2024-01-15')).toBe('2024-01-20');
    });

    it('returns the earlier date', () => {
      expect(minDate('2024-01-15', '2024-01-20')).toBe('2024-01-15');
      expect(minDate('2024-01-20', '2024-01-15')).toBe('2024-01-15');
    });
  });

  describe('leap year edge cases', () => {
    it('handles Feb 29 in 2024 (leap year)', () => {
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
      expect(addDays('2024-02-29', -1)).toBe('2024-02-28');
    });

    it('handles Feb 28 in 2023 (non-leap year)', () => {
      expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    });

    it('handles century non-leap year 1900', () => {
      expect(isValidDateString('1900-02-29')).toBe(false);
    });

    it('handles century leap year 2000', () => {
      expect(isValidDateString('2000-02-29')).toBe(true);
    });
  });
});
