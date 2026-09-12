import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { GroceryListView } from '@/features/grocery/GroceryListView';
import { getOrBuildGroceryList } from '@/lib/planning/grocery-repository';
import { getMostRecentMealPlan } from '@/lib/planning/repository';
import { getHouseholdForUser } from '@/lib/households/repository';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Grocery list — PortionPair',
};

export const dynamic = 'force-dynamic';

/** CLAUDE.md §10 screen family #6 — the grocery list, combined and categorized. */
export default async function GroceryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const household = await getHouseholdForUser(supabase, user.id);
  if (!household) redirect('/login');

  const plan = await getMostRecentMealPlan(supabase, household);
  if (!plan?.id) redirect('/onboarding');

  const { groceryListId, items } = await getOrBuildGroceryList(supabase, plan.id, plan);

  return <GroceryListView groceryListId={groceryListId} weekLabel={plan.weekLabel} initialItems={items} />;
}
