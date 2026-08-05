'use client';

import { useRouter } from 'next/navigation';
import { PlanGenerationError } from '@/domain/meal-plans/planner';
import type { PlanPreferences, WeeklyPlan } from '@/domain/meal-plans/types';
import { generatePlanAction } from '@/features/planning/actions';
import { usePlanStore } from '@/features/planning/plan-store';
import { DEMO_HOUSEHOLD } from '@/lib/planning/demo-household';
import { PlanSetupForm } from './PlanSetupForm';

/**
 * Wires the setup form to the server. Generation happens in a Server Action, so
 * planning never runs in the browser and the form stays free of transport
 * concerns.
 */
export function OnboardingScreen() {
  const router = useRouter();
  const { preferences, savePlan } = usePlanStore();

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
      initialPreferences={preferences}
      household={DEMO_HOUSEHOLD}
      generatePlan={generatePlan}
      onComplete={handleComplete}
    />
  );
}
