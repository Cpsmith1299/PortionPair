import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Stepper } from '../../components/Stepper';
import {
  COOK_TIMES,
  DIET_OPTIONS,
  addAvoidFood,
  validatePreferences,
  type CookTime,
  type DietOption,
  type PlanPreferences,
  type WeeklyPlan,
} from '../../domain/mealPlan';
import './onboarding.css';

interface OnboardingFlowProps {
  initialPreferences: PlanPreferences;
  generatePlan: (preferences: PlanPreferences) => Promise<WeeklyPlan>;
  onComplete: (plan: WeeklyPlan) => void;
}

export function OnboardingFlow({ initialPreferences, generatePlan, onComplete }: OnboardingFlowProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [foodDraft, setFoodDraft] = useState('');
  const [addingFood, setAddingFood] = useState(false);
  const [foodError, setFoodError] = useState<string>();
  const [errors, setErrors] = useState<ReturnType<typeof validatePreferences>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const foodInputRef = useRef<HTMLInputElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const dietaryHelpId = useId();

  function toggleDiet(diet: DietOption) {
    setPreferences((current) => ({
      ...current,
      diets: current.diets.includes(diet) ? current.diets.filter((item) => item !== diet) : [...current.diets, diet],
    }));
    setErrors((current) => ({ ...current, diets: undefined }));
  }

  function adjustNumber(field: 'weeklyBudget' | 'dinners', delta: number, min: number, max: number) {
    setPreferences((current) => ({ ...current, [field]: Math.min(max, Math.max(min, current[field] + delta)) }));
    if (field === 'weeklyBudget') setErrors((current) => ({ ...current, weeklyBudget: undefined }));
  }

  function startAddingFood() {
    setAddingFood(true);
    setFoodError(undefined);
    requestAnimationFrame(() => foodInputRef.current?.focus());
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
    if (Object.keys(validation).length > 0) {
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    setStatus('loading');
    setSubmitError('');
    try {
      const plan = await generatePlan(preferences);
      onComplete(plan);
    } catch {
      setStatus('error');
      setSubmitError('We couldn’t create the plan. Check your connection and try again.');
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
    }
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <main className="onboarding-main">
      <form className="onboarding-card" onSubmit={handleSubmit} noValidate>
        <header className="onboarding-header">
          <button type="button" className="back-button" disabled aria-label="Back, unavailable on the final setup step">← Back</button>
          <span className="wordmark">PortionPair</span>
        </header>

        <div className="progress" role="progressbar" aria-valuenow={3} aria-valuemin={1} aria-valuemax={3} aria-label="Setup progress, step 3 of 3">
          <span /><span /><span />
        </div>

        <div className="eyebrow">Step 3 of 3 · Plan setup</div>
        <h1>Let’s shape your week</h1>
        <p className="onboarding-lede">These choices shape tonight’s shared dinner. Charlie’s and Sam’s plates stay personalized no matter what you pick here.</p>

        <div className="household-summary" aria-label="Household members">
          <div><Avatar person="charlie" /><span><strong>Charlie</strong><small>Charlie’s serving</small></span></div>
          <div><Avatar person="sam" /><span><strong>Sam</strong><small>Sam’s serving</small></span></div>
        </div>

        {(hasErrors || submitError) && (
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
                <button key={diet} type="button" className={`choice-chip ${selected ? 'choice-chip--selected' : ''}`} aria-pressed={selected} onClick={() => toggleDiet(diet)}>
                  {selected && <span aria-hidden="true">✓</span>}{diet}
                </button>
              );
            })}
          </div>
          {errors.diets && <span className="field-error" id={dietaryHelpId}>{errors.diets}</span>}
        </fieldset>

        <fieldset className="choice-fieldset">
          <legend>Foods to avoid</legend>
          <div className="chip-group">
            {preferences.avoidFoods.map((food) => (
              <span className="removable-chip" key={food}>
                {food}
                <button type="button" aria-label={`Remove ${food} from foods to avoid`} onClick={() => setPreferences((current) => ({ ...current, avoidFoods: current.avoidFoods.filter((item) => item !== food) }))}>×</button>
              </span>
            ))}
            {addingFood ? (
              <span className="add-food-control">
                <input ref={foodInputRef} value={foodDraft} onChange={(event) => setFoodDraft(event.target.value)} onKeyDown={handleFoodKeyDown} aria-label="New food to avoid" aria-invalid={Boolean(foodError)} aria-describedby={foodError ? 'food-error' : undefined} placeholder="Food name" />
                <Button type="button" onClick={saveFood}>Add</Button>
              </span>
            ) : (
              <button type="button" className="add-chip" onClick={startAddingFood}>+ Add</button>
            )}
          </div>
          {foodError && <span className="field-error" id="food-error" role="alert">{foodError}</span>}
        </fieldset>

        <div className="stepper-grid">
          <Stepper
            label="Weekly food budget" value={`$${preferences.weeklyBudget}`} help="Typical for two people: $70–$100"
            onDecrease={() => adjustNumber('weeklyBudget', -5, 40, 200)} onIncrease={() => adjustNumber('weeklyBudget', 5, 40, 200)}
            decreaseDisabled={preferences.weeklyBudget === 40} increaseDisabled={preferences.weeklyBudget === 200}
            decreaseLabel="Decrease weekly budget by $5" increaseLabel="Increase weekly budget by $5" error={errors.weeklyBudget}
          />
          <Stepper
            label="Dinners this week" value={preferences.dinners} help="We’ll fill the rest with leftovers"
            onDecrease={() => adjustNumber('dinners', -1, 3, 7)} onIncrease={() => adjustNumber('dinners', 1, 3, 7)}
            decreaseDisabled={preferences.dinners === 3} increaseDisabled={preferences.dinners === 7}
            decreaseLabel="Decrease dinners needed" increaseLabel="Increase dinners needed"
          />
        </div>

        <fieldset className="choice-fieldset cook-time-fieldset">
          <legend>Maximum cooking time</legend>
          <div className="segmented-control">
            {COOK_TIMES.map((minutes) => (
              <button key={minutes} type="button" aria-pressed={preferences.maxCookTime === minutes} onClick={() => setPreferences((current) => ({ ...current, maxCookTime: minutes as CookTime }))}>
                {minutes} min
              </button>
            ))}
          </div>
        </fieldset>

        <div className="onboarding-action">
          <Button type="submit" fullWidth loading={status === 'loading'}>Create our meal plan</Button>
          <span>You can change any of this later from Profile → Preferences.</span>
        </div>
      </form>
    </main>
  );
}
