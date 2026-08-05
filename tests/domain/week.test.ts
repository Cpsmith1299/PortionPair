import { describe, expect, it } from 'vitest';
import { buildWeekDays, formatWeekLabel, startOfWeek, toIsoDate } from '@/domain/meal-plans/week';

describe('plan week dates', () => {
  it('normalizes any day of the week to its Monday', () => {
    // Sunday 2026-08-09 belongs to the week starting Monday 2026-08-03.
    expect(toIsoDate(startOfWeek(new Date('2026-08-09T00:00:00Z')))).toBe('2026-08-03');
    expect(toIsoDate(startOfWeek(new Date('2026-08-03T00:00:00Z')))).toBe('2026-08-03');
    expect(toIsoDate(startOfWeek(new Date('2026-08-06T23:59:00Z')))).toBe('2026-08-03');
  });

  it('labels a week within one month compactly, and a straddling week in full', () => {
    expect(formatWeekLabel(new Date('2026-08-03T00:00:00Z'))).toBe('Aug 3–9');
    expect(formatWeekLabel(new Date('2026-07-27T00:00:00Z'))).toBe('Jul 27–Aug 2');
  });

  it('builds seven consecutive labelled days', () => {
    const days = buildWeekDays(new Date('2026-08-03T00:00:00Z'));

    expect(days).toHaveLength(7);
    expect(days[0]).toMatchObject({ dayLabel: 'Mon', dateLabel: 'Aug 3', isoDate: '2026-08-03' });
    expect(days[6]).toMatchObject({ dayLabel: 'Sun', dateLabel: 'Aug 9', isoDate: '2026-08-09' });
  });

  it('crosses a month boundary without skipping or repeating a day', () => {
    const days = buildWeekDays(new Date('2026-07-27T00:00:00Z'));

    expect(days.map((day) => day.isoDate)).toEqual([
      '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30',
      '2026-07-31', '2026-08-01', '2026-08-02',
    ]);
  });
});
