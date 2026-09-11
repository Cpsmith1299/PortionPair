'use client';

import { useRouter } from 'next/navigation';
import type { Household } from '@/domain/households/types';
import { PlanGenerationError } from '@/domain/meal-plans/planner';
import type { PlanPreferences, WeeklyPlan } from '@/domain/meal-plans/types';
import { generatePlanAction } from '@/features/planning/actions';
import { usePlanStore } from '@/features/planning/plan-store';
import { PlanSetupForm } from './PlanSetupForm';

interface OnboardingScreenProps {
  household: Household;
  initialPreferences: PlanPreferences;
}

/**
 * Wires the setup form to the server. Generation happens in a Server Action, so
 * planning never runs in the browser and the form stays free of transport
 * concerns.
 *
 * `household` and `initialPreferences` come from the real signed-in
 * household (Milestone 2, loaded server-side by `app/onboarding/page.tsx`)
 * rather than the old `DEMO_HOUSEHOLD` fixture and `DEFAULT_PREFERENCES`.
 * The generated plan itself still lives in `sessionStorage` via
 * `usePlanStore` until Milestone 4 persists `meal_plans`.
 */
export function OnboardingScreen({ household, initialPreferences }: OnboardingScreenProps) {
  const router = useRouter();
  const { savePlan } = usePlanStore();

  async function generatePlan(next: PlanPreferences): Promise<WeeklyPlan> {
    const result = await generatePlanAction(next);
    // The form's catch block turns this into the retryable error state.
    if (!result.ok) throw new PlanGenerationError(result.error);
    return result.plan;
  }

  function handleComplete(plan: WeeklyPlan) {
    savePlan(plan);
    router.push('/week');
  }

  return (
    <PlanSetupForm
      initialPreferences={initialPreferences}
      household={household}
      generatePlan={generatePlan}
      onComplete={handleComplete}
    />
  );
}
