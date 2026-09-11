import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Lands both email-confirmation and password-recovery links from Supabase
 * (`emailRedirectTo` / `redirectTo` in features/auth/actions.ts both point
 * here). Exchanges the one-time code for a session, then continues to
 * wherever the link was for — `?next=/update-password` for recovery,
 * `/onboarding` otherwise.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth] callback code exchange failed', error);
  }

  return NextResponse.redirect(`${origin}/login`);
}
