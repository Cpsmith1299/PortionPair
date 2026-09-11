'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { requestPasswordResetAction } from './actions';
import './auth.css';

type Status = 'idle' | 'loading' | 'sent';

export function RequestResetForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    // Always succeeds from the caller's point of view — requestPasswordResetAction
    // never reveals whether the email matched an account.
    await requestPasswordResetAction({ email });
    setStatus('sent');
  }

  return (
    <main className="auth-main">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <header className="auth-header">
          <span className="wordmark">PortionPair</span>
        </header>

        <div className="eyebrow">Reset your password</div>
        <h1>Forgot your password?</h1>
        <p className="auth-lede">Enter your email and we&rsquo;ll send you a link to set a new one.</p>

        {status === 'sent' && (
          <div className="status-summary" role="status">
            <strong>Check your email</strong>
            <p>If an account exists for {email}, a reset link is on its way.</p>
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
        </div>

        <div className="auth-action">
          <Button type="submit" fullWidth loading={status === 'loading'} loadingLabel="Sending…">
            Send reset link
          </Button>
        </div>

        <p className="auth-footer">
          <Link href="/login">Back to log in</Link>
        </p>
      </form>
    </main>
  );
}
