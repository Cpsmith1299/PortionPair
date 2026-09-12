'use client';

import { useRouter } from 'next/navigation';
import type { Household } from '@/domain/households/types';
import type { MemberNutritionTargetInput } from '@/domain/households/nutrition-targets';
import { saveNutritionTargetsAction } from './actions';
import { NutritionTargetsForm } from './NutritionTargetsForm';

interface NutritionTargetsScreenProps {
  household: Household;
  initialTargets: Record<string, { calories: number; proteinG: number }>;
}

/** Wires the targets form to the server action; step 3 (`/onboarding`) reads what this saves. */
export function NutritionTargetsScreen({ household, initialTargets }: NutritionTargetsScreenProps) {
  const router = useRouter();

  async function handleSave(targets: MemberNutritionTargetInput[]) {
    const result = await saveNutritionTargetsAction(targets);
    if (!result.ok) throw new Error(result.error);
  }

  function handleComplete() {
    router.push('/onboarding');
  }

  return (
    <NutritionTargetsForm
      household={household}
      initialTargets={initialTargets}
      onSave={handleSave}
      onComplete={handleComplete}
    />
  );
}
