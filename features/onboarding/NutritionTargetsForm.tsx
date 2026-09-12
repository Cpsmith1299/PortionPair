'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { sortedMembers, type Household } from '@/domain/households/types';
import {
  CALORIE_RANGE,
  DEFAULT_MEMBER_TARGET,
  PROTEIN_RANGE,
  hasNutritionTargetErrors,
  validateNutritionTarget,
  type MemberNutritionTargetInput,
  type NutritionTargetValidationErrors,
} from '@/domain/households/nutrition-targets';
import './onboarding.css';

export type SaveNutritionTargets = (targets: MemberNutritionTargetInput[]) => Promise<void>;

interface NutritionTargetsFormProps {
  household: Household;
  initialTargets: Record<string, { calories: number; proteinG: number }>;
  onSave: SaveNutritionTargets;
  onComplete: () => void;
}

type Status = 'idle' | 'loading' | 'error';

/**
 * Step 2 of 3 — the piece Milestone 2 deferred. Deliberately just two
 * numbers per member (CLAUDE.md §3: "manual target entry or an editable
 * in-app estimate... always editable"), not the full Person 1/2 profile and
 * preferences wizard from the first-time flow.
 */
export function NutritionTargetsForm({
  household,
  initialTargets,
  onSave,
  onComplete,
}: NutritionTargetsFormProps) {
  const members = sortedMembers(household);

  const [values, setValues] = useState<Record<string, { calories: number; proteinG: number }>>(() =>
    Object.fromEntries(members.map((member) => [member.id, initialTargets[member.id] ?? DEFAULT_MEMBER_TARGET])),
  );
  const [errors, setErrors] = useState<Record<string, NutritionTargetValidationErrors>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const helpId = useId();

  // Runs from an effect, not inline in the submit handler, so it fires only
  // after React has committed the summary — see PlanSetupForm's identical note.
  useEffect(() => {
    if (failedAttempts > 0) errorSummaryRef.current?.focus();
  }, [failedAttempts]);

  function updateValue(memberId: string, field: 'calories' | 'proteinG', raw: string) {
    const parsed = Number(raw);
    setValues((current) => ({
      ...current,
      [memberId]: { ...current[memberId]!, [field]: Number.isFinite(parsed) ? parsed : 0 },
    }));
    setErrors((current) => ({ ...current, [memberId]: { ...current[memberId], [field]: undefined } }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, NutritionTargetValidationErrors> = {};
    for (const member of members) {
      nextErrors[member.id] = validateNutritionTarget(values[member.id]!);
    }
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(hasNutritionTargetErrors)) {
      setFailedAttempts((count) => count + 1);
      return;
    }

    setStatus('loading');
    setSubmitError('');

    try {
      await onSave(members.map((member) => ({ memberId: member.id, ...values[member.id]! })));
      setStatus('idle');
      onComplete();
    } catch {
      setStatus('error');
      setSubmitError('We couldn’t save these targets. Check your connection and try again.');
      setFailedAttempts((count) => count + 1);
    }
  }

  const showErrorSummary = Object.values(errors).some(hasNutritionTargetErrors) || Boolean(submitError);

  return (
    <main className="onboarding-main">
      <form className="onboarding-card" onSubmit={handleSubmit} noValidate>
        <header className="onboarding-header">
          <button type="button" className="back-button" disabled aria-label="Back, unavailable on this step">
            ← Back
          </button>
          <span className="wordmark">PortionPair</span>
        </header>

        <div
          className="progress"
          role="progressbar"
          aria-valuenow={2}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Setup progress, step 2 of 3"
        >
          <span />
          <span />
          <span style={{ background: 'var(--color-border-default)' }} />
        </div>

        <div className="eyebrow">Step 2 of 3 · Nutrition targets</div>
        <h1>Set each person’s targets</h1>
        <p className="onboarding-lede" id={helpId}>
          This is what the portion engine scales every meal toward. A rough estimate is fine to start —
          you can change either target any time.
        </p>

        {showErrorSummary && (
          <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
            <strong>{submitError ? 'Targets not saved' : 'Check your numbers'}</strong>
            <span>{submitError || 'Fix the highlighted field, then continue.'}</span>
          </div>
        )}

        <div className="target-members">
          {members.map((member) => {
            const memberErrors = errors[member.id] ?? {};
            const caloriesId = `${member.id}-calories`;
            const proteinId = `${member.id}-protein`;

            return (
              <fieldset className="target-member" key={member.id}>
                <legend>
                  <Avatar name={member.name} profileColor={member.profileColor} size="small" />
                  {member.name}
                </legend>

                <div className="target-grid">
                  <div className="field-group">
                    <label className="field-label" htmlFor={caloriesId}>
                      Daily calories
                    </label>
                    <input
                      id={caloriesId}
                      className="text-input"
                      type="number"
                      inputMode="numeric"
                      min={CALORIE_RANGE.min}
                      max={CALORIE_RANGE.max}
                      step={CALORIE_RANGE.step}
                      value={values[member.id]!.calories}
                      aria-invalid={Boolean(memberErrors.calories)}
                      aria-describedby={memberErrors.calories ? `${caloriesId}-error` : undefined}
                      onChange={(event) => updateValue(member.id, 'calories', event.target.value)}
                    />
                    {memberErrors.calories && (
                      <span className="field-error" id={`${caloriesId}-error`} role="alert">
                        {memberErrors.calories}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label className="field-label" htmlFor={proteinId}>
                      Daily protein (g)
                    </label>
                    <input
                      id={proteinId}
                      className="text-input"
                      type="number"
                      inputMode="numeric"
                      min={PROTEIN_RANGE.min}
                      max={PROTEIN_RANGE.max}
                      step={PROTEIN_RANGE.step}
                      value={values[member.id]!.proteinG}
                      aria-invalid={Boolean(memberErrors.proteinG)}
                      aria-describedby={memberErrors.proteinG ? `${proteinId}-error` : undefined}
                      onChange={(event) => updateValue(member.id, 'proteinG', event.target.value)}
                    />
                    {memberErrors.proteinG && (
                      <span className="field-error" id={`${proteinId}-error`} role="alert">
                        {memberErrors.proteinG}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="onboarding-action">
          <Button type="submit" fullWidth loading={status === 'loading'} loadingLabel="Saving targets…">
            Continue
          </Button>
          <span>You can change any of this later.</span>
        </div>
      </form>
    </main>
  );
}
