import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './types';
import { requireSupabasePublicEnv } from './env';

/**
 * Server client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the auth cookie via Next's cookie store.
 *
 * Server Components can't write cookies (Next throws), so `setAll` there is
 * wrapped in try/catch — the session refresh is a no-op in that case, and
 * relies on `middleware.ts` having already refreshed it for the request.
 */
export async function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — middleware already refreshed
          // the session for this request, so this is safe to ignore.
        }
      },
    },
  });
}
