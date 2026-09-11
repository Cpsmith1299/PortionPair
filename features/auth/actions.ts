'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './schema';

/**
 * Same generic-error-message pattern as `features/planning/actions.ts`: every
 * mutation validates on the server, and internals never leak to the client
 * (CLAUDE.md §17). Supabase's own auth error messages ("Invalid login
 * credentials", "User already registered") are safe to pass through — they
 * don't expose internals — but unexpected failures fall back to this.
 */
const GENERIC_FAILURE = 'Something went wrong. Check your details and try again.';

export type AuthActionResult = { ok: true } | { ok: false; error: string };

export type SignUpResult =
  | { ok: true; status: 'signed-in' }
  | { ok: true; status: 'confirmation-required' }
  | { ok: false; error: string };

async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  return headerList.get('origin') ?? `https://${headerList.get('host')}`;
}

/**
 * Creates the auth user. The household and its two members are provisioned
 * server-side by the `handle_new_user` database trigger (see the Milestone 2
 * migration) from the `household_name`/`member_names` metadata passed below —
 * not here — so provisioning happens even if email confirmation is on and
 * there's no session yet to run an authenticated insert with.
 */
export async function signUpAction(input: unknown): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_FAILURE };

  const { email, password, householdName, memberNames } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { household_name: householdName, member_names: memberNames },
      emailRedirectTo: `${await currentOrigin()}/auth/callback`,
    },
  });

  if (error) {
    console.error('[auth] sign up failed', error);
    return { ok: false, error: error.message || GENERIC_FAILURE };
  }
  if (!data.user) {
    return { ok: false, error: GENERIC_FAILURE };
  }

  if (!data.session) {
    // Email confirmation is required — no session yet, so there's nothing to
    // redirect into. The caller shows a "check your email" state instead.
    return { ok: true, status: 'confirmation-required' };
  }

  redirect('/onboarding');
}

export async function signInAction(input: unknown): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_FAILURE };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.error('[auth] sign in failed', error);
    return { ok: false, error: 'Incorrect email or password.' };
  }

  redirect('/onboarding');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Always reports success, even if the email doesn't match an account — never
 * lets a caller distinguish that (CLAUDE.md §17: don't leak internals; the
 * same principle covers account enumeration).
 */
export async function requestPasswordResetAction(input: unknown): Promise<AuthActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_FAILURE };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await currentOrigin()}/auth/callback?next=/update-password`,
  });

  if (error) console.error('[auth] password reset request failed', error);
  return { ok: true };
}

/** Requires an active recovery session, established by `app/auth/callback/route.ts`. */
export async function updatePasswordAction(input: unknown): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_FAILURE };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    console.error('[auth] password update failed', error);
    return { ok: false, error: GENERIC_FAILURE };
  }

  redirect('/onboarding');
}
