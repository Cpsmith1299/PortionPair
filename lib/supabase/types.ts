/**
 * Hand-written to match the migrations in `supabase/migrations/`. There's no
 * Supabase CLI wired into this environment to generate this from the live
 * schema, so it's maintained by hand — keep it in sync with the migrations
 * when either changes. Only the tables the app reads/writes are typed;
 * `dietary_preferences` is still deferred (see the Milestone 2 plan).
 * `recipes` / `ingredients` / etc. (Milestone 3) aren't typed here either —
 * the app never queries them directly, since `domain/recipes/catalog.ts` is
 * the source of truth read at generation time; they're DB-mirrored for a
 * future admin workflow and Milestone 4's AI-proposal validation step.
 *
 * `Relationships: []`, `Views: {}`, and `Functions: {}` aren't unused
 * boilerplate — `@supabase/postgrest-js`'s `GenericSchema`/`GenericTable`
 * constraints require them to be present for the client to infer real row
 * types at all; omitting them silently collapses every query result to
 * `never` instead of failing to compile.
 */

import type { ProfileColor } from '@/domain/households/types';

/** Loose shape for jsonb columns — callers narrow with the real domain type after reading. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

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
      nutrition_targets: {
        Row: {
          id: string;
          household_member_id: string;
          calories: number;
          protein_g: number;
          carbs_g: number | null;
          fat_g: number | null;
          calculation_method: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_member_id: string;
          calories: number;
          protein_g: number;
          carbs_g?: number | null;
          fat_g?: number | null;
          calculation_method?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_member_id?: string;
          calories?: number;
          protein_g?: number;
          carbs_g?: number | null;
          fat_g?: number | null;
          calculation_method?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_plans: {
        Row: {
          id: string;
          household_id: string;
          week_start: string;
          status: string;
          source: string;
          preferences_snapshot: Json;
          estimated_cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          week_start: string;
          status?: string;
          source?: string;
          preferences_snapshot?: Json;
          estimated_cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          week_start?: string;
          status?: string;
          source?: string;
          preferences_snapshot?: Json;
          estimated_cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_plan_items: {
        Row: {
          id: string;
          meal_plan_id: string;
          day_index: number;
          recipe_id: string | null;
          kind: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_id: string;
          day_index: number;
          recipe_id?: string | null;
          kind: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meal_plan_id?: string;
          day_index?: number;
          recipe_id?: string | null;
          kind?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      member_portions: {
        Row: {
          id: string;
          meal_plan_item_id: string;
          household_member_id: string;
          portion_summary: string;
          calories: number;
          protein_g: number;
          carbs_g: number | null;
          fat_g: number | null;
          scaled_ingredients: Json;
          warnings: string[];
          calculation_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_plan_item_id: string;
          household_member_id: string;
          portion_summary: string;
          calories: number;
          protein_g: number;
          carbs_g?: number | null;
          fat_g?: number | null;
          scaled_ingredients?: Json;
          warnings?: string[];
          calculation_version: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_plan_item_id?: string;
          household_member_id?: string;
          portion_summary?: string;
          calories?: number;
          protein_g?: number;
          carbs_g?: number | null;
          fat_g?: number | null;
          scaled_ingredients?: Json;
          warnings?: string[];
          calculation_version?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      grocery_lists: {
        Row: { id: string; meal_plan_id: string; status: string; created_at: string; updated_at: string };
        Insert: {
          id?: string;
          meal_plan_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meal_plan_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      grocery_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          ingredient_id: string | null;
          canonical_name: string;
          category: string;
          total_grams: number | null;
          display_quantity: string | null;
          checked: boolean;
          pantry: boolean;
          is_custom: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grocery_list_id: string;
          ingredient_id?: string | null;
          canonical_name: string;
          category: string;
          total_grams?: number | null;
          display_quantity?: string | null;
          checked?: boolean;
          pantry?: boolean;
          is_custom?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          grocery_list_id?: string;
          ingredient_id?: string | null;
          canonical_name?: string;
          category?: string;
          total_grams?: number | null;
          display_quantity?: string | null;
          checked?: boolean;
          pantry?: boolean;
          is_custom?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      upsert_meal_plan: {
        Args: {
          p_household_id: string;
          p_week_start: string;
          p_source: string;
          p_preferences: Json;
          p_estimated_cost: number | null;
          p_items: Json;
        };
        Returns: string;
      };
      replace_meal_plan_item: {
        Args: {
          p_item_id: string;
          p_recipe_id: string | null;
          p_kind: string;
          p_portions: Json;
        };
        Returns: undefined;
      };
    };
  };
}
