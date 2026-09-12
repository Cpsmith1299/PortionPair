'use client';

import { useRouter } from 'next/navigation';
import type { WeeklyPlan } from '@/domain/meal-plans/types';
import { WeekDashboard } from './WeekDashboard';
import './week.css';

interface WeekScreenProps {
  plan: WeeklyPlan;
}

/**
 * The plan is loaded server-side by `app/week/page.tsx` (Milestone 4) — this
 * component just renders it and handles the one client-side navigation
 * ("edit preferences" clears nothing locally anymore, since there is no
 * local plan state left to clear).
 */
export function WeekScreen({ plan }: WeekScreenProps) {
  const router = useRouter();

  function handleEditPreferences() {
    router.push('/onboarding');
  }

  return <WeekDashboard plan={plan} onEditPreferences={handleEditPreferences} />;
}
