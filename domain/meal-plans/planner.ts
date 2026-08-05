import type { Household } from '@/domain/households/types';
import type { PlanPreferences, WeeklyPlan } from './types';

export interface PlannerInput {
  preferences: PlanPreferences;
  household: Household;
  /** Any date within the target week; normalized to that week's Monday. */
  weekStart: Date;
}

/**
 * The seam between planning and everything else.
 *
 * Slice one is served by `DeterministicPlanner` (a local fixture catalog). The
 * real implementation — eligible recipes → structured AI proposal → server
 * validation → deterministic nutrition and portion engines (CLAUDE.md §8) —
 * replaces it behind this interface without touching any presentation code.
 *
 * Implementations must stay free of React, browser globals, and direct database
 * or AI SDK access.
 */
export interface Planner {
  generateWeeklyPlan(input: PlannerInput): Promise<WeeklyPlan>;
}

/** Raised for failures the UI should surface as a retryable error. */
export class PlanGenerationError extends Error {
  constructor(message = 'Plan generation failed.', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'PlanGenerationError';
  }
}
