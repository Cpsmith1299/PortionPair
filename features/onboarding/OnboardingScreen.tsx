'use client';

import { useRouter } from 'next/navigation';
import type { Household } from '@/domain/households/types';
import { PlanGenerationError } from '@/domain/meal-plans/planner';
import type { PlanPreferences, WeeklyPlan } from '@/domain/meal-plans/types';
import { generatePlanAction } from '@/features/planning/actions';
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
 * household (Milestone 2). The generated plan is now persisted server-side
 * (Milestone 4, `meal_plans` / `member_portions`) — this screen just
 * navigates to `/week`, which reads it fresh rather than carrying it over
 * client state.
 */
export function OnboardingScreen({ household, initialPreferences }: OnboardingScreenProps) {
  const router = useRouter();

  async function generatePlan(next: PlanPreferences): Promise<WeeklyPlan> {
    const result = await generatePlanAction(next);
    // The form's catch block turns this into the retryable error state.
    if (!result.ok) throw new PlanGenerationError(result.error);
    return result.plan;
  }

  function handleComplete() {
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
