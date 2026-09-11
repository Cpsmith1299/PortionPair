'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { signUpAction } from './actions';
import './auth.css';

type Status = 'idle' | 'loading' | 'error' | 'confirmation-required';

/**
 * Collects just enough to create a real household at signup — a household
 * name and both members' names — per the Milestone 2 scope decision to defer
 * the full Person 1/Person 2 profile-and-preferences wizard from CLAUDE.md's
 * first-time flow to a later pass.
 */
export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [member1Name, setMember1Name] = useState('');
  const [member2Name, setMember2Name] = useState('');
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

    const result = await signUpAction({
      email,
      password,
      householdName,
      memberNames: [member1Name, member2Name],
    });

    if (!result.ok) {
      setStatus('error');
      setError(result.error);
      setFailedAttempts((count) => count + 1);
      return;
    }

    if (result.status === 'confirmation-required') {
      setStatus('confirmation-required');
      return;
    }

    // Signed in immediately (email confirmation off) — signUpAction already
    // redirects server-side; this covers the moment before that lands.
    router.push('/onboarding');
  }

  const showErrorSummary = status === 'error' && Boolean(error);

  return (
    <main className="auth-main">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <header className="auth-header">
          <span className="wordmark">PortionPair</span>
        </header>

        <div className="eyebrow">Create your account</div>
        <h1>Set up your household</h1>
        <p className="auth-lede">One account, one shared plan. You can invite your partner to log in later.</p>

        {showErrorSummary && (
          <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
            <strong>Account not created</strong>
            <span>{error}</span>
          </div>
        )}

        {status === 'confirmation-required' && (
          <div className="status-summary" role="status">
            <strong>Check your email</strong>
            <p>We sent a confirmation link to {email}. Follow it to finish setting up your household.</p>
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
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className="field-help">At least 8 characters.</span>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="household-name">Household name</label>
            <input
              id="household-name"
              className="text-input"
              type="text"
              placeholder="e.g. The Smiths"
              required
              value={householdName}
              onChange={(event) => setHouseholdName(event.target.value)}
            />
          </div>

          <div className="auth-fields-row">
            <div className="field-group">
              <label className="field-label" htmlFor="member-1-name">Your name</label>
              <input
                id="member-1-name"
                className="text-input"
                type="text"
                required
                value={member1Name}
                onChange={(event) => setMember1Name(event.target.value)}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="member-2-name">Partner&rsquo;s name</label>
              <input
                id="member-2-name"
                className="text-input"
                type="text"
                required
                value={member2Name}
                onChange={(event) => setMember2Name(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="auth-action">
          <Button type="submit" fullWidth loading={status === 'loading'} loadingLabel="Creating your account…">
            Create account
          </Button>
        </div>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
