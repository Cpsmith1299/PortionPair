import { DAYS_IN_WEEK } from './types';

/**
 * Fixed label tables rather than `Intl`. Plan labels are persisted alongside the
 * plan and rendered on both the server and the client, so they must not vary
 * with the runtime's locale or timezone database.
 */
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const MS_PER_DAY = 86_400_000;

/**
 * All plan dates are handled as UTC calendar days. A plan week is a set of
 * calendar dates, not instants, so a UTC-normalized date avoids the
 * off-by-one-day drift a local-timezone Date would introduce.
 */
export function toUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** The Monday on or before `date`. */
export function startOfWeek(date: Date): Date {
  const day = toUtcDay(date);
  // getUTCDay(): 0 = Sunday. Shift so Monday is 0.
  const offset = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - offset * MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  return new Date(toUtcDay(date).getTime() + days * MS_PER_DAY);
}

/** `2026-08-03` */
export function toIsoDate(date: Date): string {
  return toUtcDay(date).toISOString().slice(0, 10);
}

/** `Aug 3` */
export function formatDateLabel(date: Date): string {
  const day = toUtcDay(date);
  return `${MONTH_LABELS[day.getUTCMonth()]} ${day.getUTCDate()}`;
}

/** `Mon` */
export function formatDayLabel(date: Date): string {
  const day = toUtcDay(date);
  return DAY_LABELS[(day.getUTCDay() + 6) % 7]!;
}

/** `Aug 3–9`, or `Jul 30–Aug 5` when the week spans two months. */
export function formatWeekLabel(weekStart: Date): string {
  const start = toUtcDay(weekStart);
  const end = addDays(start, DAYS_IN_WEEK - 1);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();

  return sameMonth
    ? `${formatDateLabel(start)}–${end.getUTCDate()}`
    : `${formatDateLabel(start)}–${formatDateLabel(end)}`;
}

export interface WeekDay {
  dayIndex: number;
  dayLabel: string;
  dateLabel: string;
  isoDate: string;
}

/** The seven calendar days of the plan week, in order. */
export function buildWeekDays(weekStart: Date): WeekDay[] {
  const start = startOfWeek(weekStart);

  return Array.from({ length: DAYS_IN_WEEK }, (_, dayIndex) => {
    const date = addDays(start, dayIndex);
    return {
      dayIndex,
      dayLabel: formatDayLabel(date),
      dateLabel: formatDateLabel(date),
      isoDate: toIsoDate(date),
    };
  });
}
