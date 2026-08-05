import { useState } from 'react';
import { DEFAULT_PREFERENCES, generateWeeklyPlan, type PlanPreferences, type WeeklyPlan } from './domain/mealPlan';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { WeeklyPlan as WeeklyPlanScreen } from './features/week/WeeklyPlan';

export function App() {
  const [preferences, setPreferences] = useState<PlanPreferences>(DEFAULT_PREFERENCES);
  const [plan, setPlan] = useState<WeeklyPlan>();

  function handleComplete(nextPlan: WeeklyPlan) {
    setPreferences(nextPlan.preferences);
    setPlan(nextPlan);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  if (plan) {
    return <WeeklyPlanScreen plan={plan} onEditPreferences={() => setPlan(undefined)} />;
  }

  return <OnboardingFlow initialPreferences={preferences} generatePlan={generateWeeklyPlan} onComplete={handleComplete} />;
}
