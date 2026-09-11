/**
 * Fail loudly at the point of use rather than silently no-op with an empty
 * URL/key (CLAUDE.md §17 — validate input at system boundaries). Every
 * Supabase client factory in this directory calls this first.
 */
export function requireSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).',
    );
  }

  return { url, anonKey };
}
