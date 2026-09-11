'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { requireSupabasePublicEnv } from './env';

/**
 * Browser client for client components. Only ever uses the anon key — the
 * service-role key never enters a client bundle (CLAUDE.md §17).
 */
export function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
