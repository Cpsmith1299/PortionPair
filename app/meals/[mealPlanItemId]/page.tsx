import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { MealDetailsView } from '@/features/meals/MealDetailsView';
import { getMealPlanItemDetails } from '@/lib/planning/repository';
import { getHouseholdForUser } from '@/lib/households/repository';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Meal details — PortionPair',
};

export const dynamic = 'force-dynamic';

interface MealDetailsPageProps {
  params: Promise<{ mealPlanItemId: string }>;
}

/** CLAUDE.md §10 screen family #4 — meal details and cooking view. */
export default async function MealDetailsPage({ params }: MealDetailsPageProps) {
  const { mealPlanItemId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const household = await getHouseholdForUser(supabase, user.id);
  if (!household) redirect('/login');

  const details = await getMealPlanItemDetails(supabase, household, mealPlanItemId);
  if (!details) notFound();

  return (
    <MealDetailsView
      mealPlanItemId={details.mealPlanItemId}
      dayLabel={details.dayLabel}
      dateLabel={details.dateLabel}
      recipe={details.recipe}
      portions={details.portions}
    />
  );
}
