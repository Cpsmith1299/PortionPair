import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';
import { requireSupabasePublicEnv } from './env';

const PROTECTED_PREFIXES = [
  '/onboarding',
  '/week',
  '/meals',
  '/grocery',
  '/favorites',
  '/profile',
  // Reachable only via a valid recovery session (app/auth/callback/route.ts);
  // an anonymous direct visit has no session and is redirected to /login.
  '/update-password',
];
const AUTH_ONLY_PREFIXES = ['/login', '/signup'];

/**
 * Refreshes the Supabase session cookie on every request and enforces route
 * protection. Called from the root `middleware.ts`.
 *
 * Must call `getUser()` (not just read the cookie) — it revalidates the
 * session against Supabase rather than trusting a token that could be stale
 * or forged, per the `@supabase/ssr` Next.js guide.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, anonKey } = requireSupabasePublicEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthOnly) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/onboarding';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
