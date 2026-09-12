'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  addCustomGroceryItem,
  removeGroceryItem,
  setGroceryItemState,
  type GroceryItemView,
} from '@/lib/planning/grocery-repository';
import { createClient } from '@/lib/supabase/server';

export type GroceryActionResult = { ok: true } | { ok: false; error: string };
export type AddGroceryItemResult = { ok: true; item: GroceryItemView } | { ok: false; error: string };

const GENERIC_FAILURE = 'That didn’t save. Check your connection and try again.';

const itemIdSchema = z.string().uuid();
const stateChangeSchema = z.object({ checked: z.boolean().optional(), pantry: z.boolean().optional() });
const customItemSchema = z.object({
  groceryListId: z.string().uuid(),
  name: z.string().trim().min(1, 'Enter an item name first.').max(80),
});

/**
 * Every grocery mutation just needs an authenticated session — RLS (the
 * `grocery_items` policy, scoped through `grocery_lists` → `meal_plans` →
 * `households`) is the real authorization boundary for which row (CLAUDE.md
 * §17), so there is no separate per-item ownership check here.
 */
async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');
  return supabase;
}

export async function updateGroceryItemStateAction(itemId: unknown, changes: unknown): Promise<GroceryActionResult> {
  const parsedId = itemIdSchema.safeParse(itemId);
  const parsedChanges = stateChangeSchema.safeParse(changes);
  if (!parsedId.success || !parsedChanges.success) return { ok: false, error: GENERIC_FAILURE };

  try {
    const supabase = await requireSession();
    await setGroceryItemState(supabase, parsedId.data, parsedChanges.data);
    revalidatePath('/grocery');
    return { ok: true };
  } catch (cause) {
    console.error('[grocery] updating item state failed', cause);
    return { ok: false, error: GENERIC_FAILURE };
  }
}

export async function addCustomGroceryItemAction(input: unknown): Promise<AddGroceryItemResult> {
  const parsed = customItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC_FAILURE };

  try {
    const supabase = await requireSession();
    const item = await addCustomGroceryItem(supabase, parsed.data.groceryListId, parsed.data.name);
    revalidatePath('/grocery');
    return { ok: true, item };
  } catch (cause) {
    console.error('[grocery] adding custom item failed', cause);
    return { ok: false, error: GENERIC_FAILURE };
  }
}

export async function removeGroceryItemAction(itemId: unknown): Promise<GroceryActionResult> {
  const parsed = itemIdSchema.safeParse(itemId);
  if (!parsed.success) return { ok: false, error: GENERIC_FAILURE };

  try {
    const supabase = await requireSession();
    await removeGroceryItem(supabase, parsed.data);
    revalidatePath('/grocery');
    return { ok: true };
  } catch (cause) {
    console.error('[grocery] removing item failed', cause);
    return { ok: false, error: GENERIC_FAILURE };
  }
}
