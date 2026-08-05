'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePlanStore } from '@/features/planning/plan-store';
import { WeekDashboard } from './WeekDashboard';
import './week.css';

/**
 * Guards the dashboard against being reached without a plan. Once households are
 * persisted (Milestone 2) this becomes a server-side fetch plus an auth check,
 * and the empty state becomes "generate your first week" rather than a redirect.
 */
export function WeekScreen() {
  const router = useRouter();
  const { plan, hydrated, clearPlan } = usePlanStore();

  useEffect(() => {
    if (hydrated && !plan) router.replace('/onboarding');
  }, [hydrated, plan, router]);

  if (!plan) {
    return (
      <main className="week-empty" aria-busy={!hydrated}>
        <p role="status">{hydrated ? 'Taking you back to setup…' : 'Loading your week…'}</p>
      </main>
    );
  }

  function handleEditPreferences() {
    clearPlan();
    router.push('/onboarding');
  }

  return <WeekDashboard plan={plan} onEditPreferences={handleEditPreferences} />;
}
