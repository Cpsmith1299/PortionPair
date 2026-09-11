/**
 * Hand-written to match `supabase/migrations/20260911000000_identity_and_households.sql`.
 * There's no Supabase CLI wired into this environment to generate this from
 * the live schema, so it's maintained by hand — keep it in sync with the
 * migration when either changes. Only the tables this milestone reads/writes
 * are typed; `nutrition_targets` and `dietary_preferences` are deferred
 * (see the Milestone 2 plan).
 *
 * `Relationships: []`, `Views: {}`, and `Functions: {}` aren't unused
 * boilerplate — `@supabase/postgrest-js`'s `GenericSchema`/`GenericTable`
 * constraints require them to be present for the client to infer real row
 * types at all; omitting them silently collapses every query result to
 * `never` instead of failing to compile.
 */

import type { ProfileColor } from '@/domain/households/types';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; created_at: string };
        Insert: { id: string; created_at?: string };
        Update: { id?: string; created_at?: string };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          plan_tier: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          plan_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          plan_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          display_order: number;
          profile_color: ProfileColor;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          display_order: number;
          profile_color: ProfileColor;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          display_order?: number;
          profile_color?: ProfileColor;
          created_at?: string;
        };
        Relationships: [];
      };
      household_preferences: {
        Row: {
          id: string;
          household_id: string;
          diets: string[];
          avoid_foods: string[];
          weekly_budget_cents: number;
          dinners: number;
          max_cook_time: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          diets: string[];
          avoid_foods: string[];
          weekly_budget_cents: number;
          dinners: number;
          max_cook_time: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          diets?: string[];
          avoid_foods?: string[];
          weekly_budget_cents?: number;
          dinners?: number;
          max_cook_time?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
