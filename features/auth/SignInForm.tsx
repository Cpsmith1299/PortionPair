'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { signInAction } from './actions';
import './auth.css';

type Status = 'idle' | 'loading' | 'error';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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

    const result = await signInAction({ email, password });

    if (!result.ok) {
      setStatus('error');
      setError(result.error);
      setFailedAttempts((count) => count + 1);
      return;
    }

    // signInAction redirects server-side on success; this covers the moment before that lands.
    router.push('/onboarding');
  }

  return (
    <main className="auth-main">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <header className="auth-header">
          <span className="wordmark">PortionPair</span>
        </header>

        <div className="eyebrow">Welcome back</div>
        <h1>Log in</h1>

        {status === 'error' && error && (
          <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
            <strong>Couldn&rsquo;t log in</strong>
            <span>{error}</span>
          </div>
        )}

        <div className="auth-fields">
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="text-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="text-input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>

        <div className="auth-action">
          <Button type="submit" fullWidth loading={status === 'loading'} loadingLabel="Logging in…">
            Log in
          </Button>
          <span><Link href="/reset-password">Forgot your password?</Link></span>
        </div>

        <p className="auth-footer">
          New to PortionPair? <Link href="/signup">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
