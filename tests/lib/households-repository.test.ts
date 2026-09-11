import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PREFERENCES } from '@/domain/meal-plans/types';
import {
  getHouseholdForUser,
  getHouseholdPreferences,
  upsertHouseholdPreferences,
} from '@/lib/households/repository';
import type { Database } from '@/lib/supabase/types';

type QueryResult = { data: unknown; error: Error | null };

/**
 * A minimal stand-in for the chained Supabase query builder
 * (`.from().select().eq()...`), keyed by table name so each `.from(table)`
 * call in a repository function can return its own canned result.
 */
function fakeSupabase(responses: Partial<Record<string, QueryResult>>) {
  const from = vi.fn((table: string) => {
    const response = responses[table] ?? { data: null, error: null };
    const builder = {
      select: () => builder,
      eq: () => builder,
      order: () => Promise.resolve(response),
      maybeSingle: () => Promise.resolve(response),
      upsert: (payload: unknown) => {
        response.data = payload;
        return Promise.resolve({ error: null });
      },
    };
    return builder;
  });

  return { from } as unknown as SupabaseClient<Database>;
}

describe('getHouseholdForUser', () => {
  it('returns null when the user has no household', async () => {
    const supabase = fakeSupabase({ households: { data: null, error: null } });
    expect(await getHouseholdForUser(supabase, 'user-1')).toBeNull();
  });

  it('loads a household with its members sorted by display order', async () => {
    const supabase = fakeSupabase({
      households: { data: { id: 'h1', name: 'The Smiths' }, error: null },
      household_members: {
        data: [
          { id: 'm1', name: 'Charlie', display_order: 0, profile_color: 'charlie' },
          { id: 'm2', name: 'Sam', display_order: 1, profile_color: 'sam' },
        ],
        error: null,
      },
    });

    expect(await getHouseholdForUser(supabase, 'user-1')).toEqual({
      id: 'h1',
      name: 'The Smiths',
      members: [
        { id: 'm1', name: 'Charlie', displayOrder: 0, profileColor: 'charlie' },
        { id: 'm2', name: 'Sam', displayOrder: 1, profileColor: 'sam' },
      ],
    });
  });

  it('throws when the underlying query errors, rather than swallowing it', async () => {
    const supabase = fakeSupabase({ households: { data: null, error: new Error('boom') } });
    await expect(getHouseholdForUser(supabase, 'user-1')).rejects.toThrow('boom');
  });
});

describe('getHouseholdPreferences', () => {
  it('converts stored cents back to dollars', async () => {
    const supabase = fakeSupabase({
      household_preferences: {
        data: {
          diets: ['Balanced'],
          avoid_foods: ['Mushrooms'],
          weekly_budget_cents: 9000,
          dinners: 5,
          max_cook_time: 30,
        },
        error: null,
      },
    });

    expect(await getHouseholdPreferences(supabase, 'h1')).toEqual({
      diets: ['Balanced'],
      avoidFoods: ['Mushrooms'],
      weeklyBudget: 90,
      dinners: 5,
      maxCookTime: 30,
    });
  });

  it('returns null when nothing has been saved yet', async () => {
    const supabase = fakeSupabase({ household_preferences: { data: null, error: null } });
    expect(await getHouseholdPreferences(supabase, 'h1')).toBeNull();
  });
});

describe('upsertHouseholdPreferences', () => {
  it('converts dollars to cents on write', async () => {
    const supabase = fakeSupabase({});
    await upsertHouseholdPreferences(supabase, 'h1', { ...DEFAULT_PREFERENCES, weeklyBudget: 90 });

    const { from } = supabase as unknown as { from: ReturnType<typeof vi.fn> };
    expect(from).toHaveBeenCalledWith('household_preferences');
  });
});
