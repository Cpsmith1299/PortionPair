'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { PlanPreferences, WeeklyPlan } from '@/domain/meal-plans/types';
import { DEFAULT_PREFERENCES } from '@/domain/meal-plans/types';

/**
 * SLICE-ONE SCAFFOLDING — replaced in Milestone 2.
 *
 * There are no accounts or database yet, so the generated plan lives in
 * sessionStorage purely so a refresh on /week does not drop the user back to
 * setup. Once Supabase lands, plans are read from `meal_plans` /
 * `member_portions` by household and this file goes away.
 *
 * sessionStorage rather than localStorage is deliberate: diet and goal data is
 * sensitive (CLAUDE.md §17) and should not outlive the browser session.
 *
 * Modelled as an external store rather than an effect that seeds state, so
 * there is no cascading render on mount and no server/client hydration
 * mismatch — the server snapshot is always "no plan".
 */
const STORAGE_KEY = 'portionpair.plan.v1';

let cachedPlan: WeeklyPlan | undefined;
let hasReadStorage = false;
const listeners = new Set<() => void>();

function readFromStorage(): WeeklyPlan | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as WeeklyPlan) : undefined;
  } catch {
    // Corrupt or unavailable storage just means "no saved plan".
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing actionable.
    }
    return undefined;
  }
}

function getSnapshot(): WeeklyPlan | undefined {
  // Read through once, then serve the cache — getSnapshot must be cheap and
  // must return a referentially stable value between changes.
  if (!hasReadStorage) {
    cachedPlan = readFromStorage();
    hasReadStorage = true;
  }
  return cachedPlan;
}

/** The server has no session, so it always renders the "no plan" branch. */
function getServerSnapshot(): WeeklyPlan | undefined {
  return undefined;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setPlan(plan: WeeklyPlan | undefined) {
  cachedPlan = plan;
  hasReadStorage = true;

  try {
    if (plan) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private-mode quota failures must not break the flow; the in-memory plan
    // still renders for this navigation.
  }

  listeners.forEach((listener) => listener());
}

const subscribeToHydration = () => () => {};

/** False during SSR and the hydration pass, true once the client has taken over. */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

interface PlanStore {
  plan: WeeklyPlan | undefined;
  preferences: PlanPreferences;
  savePlan: (plan: WeeklyPlan) => void;
  clearPlan: () => void;
  hydrated: boolean;
}

/**
 * No provider needed: the store lives in module scope and is subscribed to
 * directly, so the root layout stays a pure server component.
 */
export function usePlanStore(): PlanStore {
  const plan = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useIsHydrated();

  const savePlan = useCallback((next: WeeklyPlan) => setPlan(next), []);
  const clearPlan = useCallback(() => setPlan(undefined), []);

  return useMemo(
    () => ({
      plan,
      preferences: plan?.preferences ?? DEFAULT_PREFERENCES,
      savePlan,
      clearPlan,
      hydrated,
    }),
    [plan, savePlan, clearPlan, hydrated],
  );
}

/** Test seam: drops any cached plan so suites do not leak state between cases. */
export function resetPlanStoreForTests() {
  cachedPlan = undefined;
  hasReadStorage = false;
  listeners.clear();
}
