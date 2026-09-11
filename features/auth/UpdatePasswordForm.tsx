'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { updatePasswordAction } from './actions';
import './auth.css';

type Status = 'idle' | 'loading' | 'error';

/** Reached only via `app/auth/callback/route.ts`, which establishes the recovery session. */
export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (failedAttempts > 0) errorSummaryRef.current?.focus();
  }, [failedAttempts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setError('');

    const result = await updatePasswordAction({ password });

    if (!result.ok) {
      setStatus('error');
      setError(result.error);
      setFailedAttempts((count) => count + 1);
      return;
    }

    // updatePasswordAction redirects server-side on success; this covers the moment before that lands.
    router.push('/onboarding');
  }

  return (
    <main className="auth-main">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <header className="auth-header">
          <span className="wordmark">PortionPair</span>
        </header>

        <div className="eyebrow">Set a new password</div>
        <h1>Choose a new password</h1>

        {status === 'error' && error && (
          <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
            <strong>Couldn&rsquo;t update password</strong>
            <span>{error}</span>
          </div>
        )}

        <div className="auth-fields">
          <div className="field-group">
            <label className="field-label" htmlFor="password">New password</label>
            <input
              id="password"
              className="text-input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className="field-help">At least 8 characters.</span>
          </div>
        </div>

        <div className="auth-action">
          <Button type="submit" fullWidth loading={status === 'loading'} loadingLabel="Saving…">
            Save password
          </Button>
        </div>
      </form>
    </main>
  );
}
