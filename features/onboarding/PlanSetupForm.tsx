'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { sortedMembers, type Household } from '@/domain/households/types';
import {
  addAvoidFood,
  clamp,
  hasValidationErrors,
  removeAvoidFood,
  toggleDiet,
  validatePreferences,
} from '@/domain/meal-plans/preferences';
import {
  BUDGET_RANGE,
  COOK_TIMES,
  DIET_OPTIONS,
  DINNER_RANGE,
  type CookTime,
  type DietOption,
  type PlanPreferences,
  type PlanValidationErrors,
  type WeeklyPlan,
} from '@/domain/meal-plans/types';
import './onboarding.css';

export type GeneratePlan = (preferences: PlanPreferences) => Promise<WeeklyPlan>;

interface PlanSetupFormProps {
  initialPreferences: PlanPreferences;
  household: Household;
  generatePlan: GeneratePlan;
  onComplete: (plan: WeeklyPlan) => void;
}

type Status = 'idle' | 'loading' | 'error';

/**
 * Step 3 of 3 — the final household plan setup, ported from the validated
 * prototype. Steps 1–2 (member profiles and per-person calorie/macro targets)
 * arrive with persisted households in Milestone 2.
 */
export function PlanSetupForm({
  initialPreferences,
  household,
  generatePlan,
  onComplete,
}: PlanSetupFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [foodDraft, setFoodDraft] = useState('');
  const [addingFood, setAddingFood] = useState(false);
  const [foodError, setFoodError] = useState<string>();
  const [errors, setErrors] = useState<PlanValidationErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const foodInputRef = useRef<HTMLInputElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const dietaryHelpId = useId();
  const foodErrorId = useId();

  const members = sortedMembers(household);

  /*
   * Focus runs from an effect, not requestAnimationFrame. The summary and the
   * input each render only as a result of the state change that precedes the
   * focus call, so a frame callback can fire before React has committed them and
   * the focus silently falls through to <body>. An effect always runs after
   * commit, so the ref is populated. `failedAttempts` re-triggers this on every
   * subsequent failure, not just the first.
   */
  useEffect(() => {
    if (failedAttempts > 0) errorSummaryRef.current?.focus();
  }, [failedAttempts]);

  useEffect(() => {
    if (addingFood) foodInputRef.current?.focus();
  }, [addingFood]);

  function handleToggleDiet(diet: DietOption) {
    setPreferences((current) => toggleDiet(current, diet));
    setErrors((current) => ({ ...current, diets: undefined }));
  }

  function adjust(field: 'weeklyBudget' | 'dinners', delta: number, min: number, max: number) {
    setPreferences((current) => ({ ...current, [field]: clamp(current[field] + delta, min, max) }));
    if (field === 'weeklyBudget') setErrors((current) => ({ ...current, weeklyBudget: undefined }));
  }

  function startAddingFood() {
    setAddingFood(true);
    setFoodError(undefined);
  }

  function saveFood() {
    const result = addAvoidFood(preferences.avoidFoods, foodDraft);
    if (result.error) {
      setFoodError(result.error);
      return;
    }
    setPreferences((current) => ({ ...current, avoidFoods: result.foods }));
    setFoodDraft('');
    setFoodError(undefined);
    setAddingFood(false);
  }

  function handleFoodKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveFood();
    }
    if (event.key === 'Escape') {
      setAddingFood(false);
      setFoodDraft('');
      setFoodError(undefined);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validatePreferences(preferences);
    setErrors(validation);

    if (hasValidationErrors(validation)) {
      // Moves focus to the summary so the error is announced and reachable.
      setFailedAttempts((count) => count + 1);
      return;
    }

    setStatus('loading');
    setSubmitError('');

    try {
      const plan = await generatePlan(preferences);
      setStatus('idle');
      onComplete(plan);
    } catch {
      setStatus('error');
      setSubmitError('We couldn’t create the plan. Check your connection and try again.');
      setFailedAttempts((count) => count + 1);
    }
  }

  const showErrorSummary = hasValidationErrors(errors) || Boolean(submitError);

  return (
    <main className="onboarding-main">
      <form className="onboarding-card" onSubmit={handleSubmit} noValidate>
        <header className="onboarding-header">
          <button
            type="button"
            className="back-button"
            disabled
            aria-label="Back, unavailable on the final setup step"
          >
            ← Back
          </button>
          <span className="wordmark">PortionPair</span>
        </header>

        <div
          className="progress"
          role="progressbar"
          aria-valuenow={3}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label="Setup progress, step 3 of 3"
        >
          <span />
          <span />
          <span />
        </div>

        {/* A block element here: `.eyebrow`'s bottom margin is load-bearing, and
            would be dropped on an inline span. */}
        <div className="eyebrow">Step 3 of 3 · Plan setup</div>
        <h1>Let’s shape your week</h1>
        <p className="onboarding-lede">
          These choices shape tonight’s shared dinner. {members.map((member) => member.name).join('’s and ')}’s
          plates stay personalized no matter what you pick here.
        </p>

        <div className="household-summary" aria-label="Household members">
          {members.map((member) => (
            <div key={member.id}>
              <Avatar name={member.name} profileColor={member.profileColor} />
              <span>
                <strong>{member.name}</strong>
                <small>{member.name}’s serving</small>
              </span>
            </div>
          ))}
        </div>

        {showErrorSummary && (
          <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
            <strong>{submitError ? 'Plan not created' : 'Check your choices'}</strong>
            <span>{submitError || 'Fix the highlighted field, then create the plan again.'}</span>
          </div>
        )}

        <fieldset className="choice-fieldset" aria-describedby={errors.diets ? dietaryHelpId : undefined}>
          <legend>Dietary preferences</legend>
          <div className="chip-group">
            {DIET_OPTIONS.map((diet) => {
              const selected = preferences.diets.includes(diet);
              return (
                <button
                  key={diet}
                  type="button"
                  className={`choice-chip ${selected ? 'choice-chip--selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => handleToggleDiet(diet)}
                >
                  {/* Selection is carried by aria-pressed and the check, not color alone. */}
                  {selected && <span aria-hidden="true">✓</span>}
                  {diet}
                </button>
              );
            })}
          </div>
          {errors.diets && (
            <span className="field-error" id={dietaryHelpId}>
              {errors.diets}
            </span>
          )}
        </fieldset>

        <fieldset className="choice-fieldset">
          <legend>Foods to avoid</legend>
          <div className="chip-group">
            {preferences.avoidFoods.map((food) => (
              <span className="removable-chip" key={food}>
                {food}
                <button
                  type="button"
                  aria-label={`Remove ${food} from foods to avoid`}
                  onClick={() =>
                    setPreferences((current) => ({
                      ...current,
                      avoidFoods: removeAvoidFood(current.avoidFoods, food),
                    }))
                  }
                >
                  ×
                </button>
              </span>
            ))}

            {addingFood ? (
              <span className="add-food-control">
                <input
                  ref={foodInputRef}
                  value={foodDraft}
                  onChange={(event) => setFoodDraft(event.target.value)}
                  onKeyDown={handleFoodKeyDown}
                  aria-label="New food to avoid"
                  aria-invalid={Boolean(foodError)}
                  aria-describedby={foodError ? foodErrorId : undefined}
                  placeholder="Food name"
                />
                <Button type="button" onClick={saveFood}>
                  Add
                </Button>
              </span>
            ) : (
              <button type="button" className="add-chip" onClick={startAddingFood}>
                + Add
              </button>
            )}
          </div>
          {foodError && (
            <span className="field-error" id={foodErrorId} role="alert">
              {foodError}
            </span>
          )}
        </fieldset>

        <div className="stepper-grid">
          <Stepper
            label="Weekly food budget"
            value={`$${preferences.weeklyBudget}`}
            help="Typical for two people: $70–$100"
            onDecrease={() => adjust('weeklyBudget', -BUDGET_RANGE.step, BUDGET_RANGE.min, BUDGET_RANGE.max)}
            onIncrease={() => adjust('weeklyBudget', BUDGET_RANGE.step, BUDGET_RANGE.min, BUDGET_RANGE.max)}
            decreaseDisabled={preferences.weeklyBudget === BUDGET_RANGE.min}
            increaseDisabled={preferences.weeklyBudget === BUDGET_RANGE.max}
            decreaseLabel={`Decrease weekly budget by $${BUDGET_RANGE.step}`}
            increaseLabel={`Increase weekly budget by $${BUDGET_RANGE.step}`}
            error={errors.weeklyBudget}
          />
          <Stepper
            label="Dinners this week"
            value={preferences.dinners}
            help="We’ll fill the rest with leftovers"
            onDecrease={() => adjust('dinners', -1, DINNER_RANGE.min, DINNER_RANGE.max)}
            onIncrease={() => adjust('dinners', 1, DINNER_RANGE.min, DINNER_RANGE.max)}
            decreaseDisabled={preferences.dinners === DINNER_RANGE.min}
            increaseDisabled={preferences.dinners === DINNER_RANGE.max}
            decreaseLabel="Decrease dinners needed"
            increaseLabel="Increase dinners needed"
          />
        </div>

        <fieldset className="choice-fieldset cook-time-fieldset">
          <legend>Maximum cooking time</legend>
          <div className="segmented-control">
            {COOK_TIMES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                aria-pressed={preferences.maxCookTime === minutes}
                onClick={() =>
                  setPreferences((current) => ({ ...current, maxCookTime: minutes as CookTime }))
                }
              >
                {minutes} min
              </button>
            ))}
          </div>
        </fieldset>

        <div className="onboarding-action">
          <Button type="submit" fullWidth loading={status === 'loading'} loadingLabel="Creating your week…">
            Create our meal plan
          </Button>
          <span>You can change any of this later from Profile → Preferences.</span>
        </div>
      </form>
    </main>
  );
}
