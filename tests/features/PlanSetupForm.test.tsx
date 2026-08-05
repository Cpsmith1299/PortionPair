import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PREFERENCES, type PlanPreferences } from '@/domain/meal-plans/types';
import { PlanSetupForm } from '@/features/onboarding/PlanSetupForm';
import { DeterministicPlanner } from '@/lib/planning/deterministic-planner';
import { DEMO_HOUSEHOLD } from '@/lib/planning/demo-household';

const planner = new DeterministicPlanner();

function generate(preferences: PlanPreferences) {
  return planner.generateWeeklyPlan({
    preferences,
    household: DEMO_HOUSEHOLD,
    weekStart: new Date('2026-08-03T00:00:00Z'),
  });
}

function renderForm(overrides: Partial<PlanPreferences> = {}, props: Partial<{ generatePlan: typeof generate; onComplete: () => void }> = {}) {
  const generatePlan = props.generatePlan ?? vi.fn(generate);
  const onComplete = props.onComplete ?? vi.fn();

  render(
    <PlanSetupForm
      initialPreferences={{ ...DEFAULT_PREFERENCES, ...overrides }}
      household={DEMO_HOUSEHOLD}
      generatePlan={generatePlan}
      onComplete={onComplete}
    />,
  );

  return { generatePlan, onComplete };
}

describe('PlanSetupForm', () => {
  it('supports preference changes and completes the generation flow', async () => {
    const user = userEvent.setup();
    const generatePlan = vi.fn(generate);
    const onComplete = vi.fn();
    renderForm({}, { generatePlan, onComplete });

    await user.click(screen.getByRole('button', { name: 'Vegetarian' }));
    await user.click(screen.getByRole('button', { name: 'Increase dinners needed' }));
    await user.click(screen.getByRole('button', { name: '+ Add' }));
    await user.type(screen.getByRole('textbox', { name: 'New food to avoid' }), 'Shellfish{Enter}');
    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));

    expect(generatePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        dinners: 6,
        diets: expect.arrayContaining(['Vegetarian']),
        avoidFoods: expect.arrayContaining(['Shellfish']),
      }),
    );
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('shows an accessible validation error when no diet is selected', async () => {
    const user = userEvent.setup();
    const { generatePlan } = renderForm({ diets: [] });

    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));

    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('Check your choices')).toBeInTheDocument();
    expect(
      screen.getByText('Choose at least one dietary preference so we can shape the plan.'),
    ).toBeInTheDocument();
    expect(generatePlan).not.toHaveBeenCalled();
  });

  it('reports a generation failure and allows a retry', async () => {
    const user = userEvent.setup();
    const generatePlan = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementationOnce(generate);
    const onComplete = vi.fn();
    renderForm({}, { generatePlan, onComplete });

    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));
    expect(
      await screen.findByText('We couldn’t create the plan. Check your connection and try again.'),
    ).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('moves focus to the error summary so the failure is announced', async () => {
    const user = userEvent.setup();
    renderForm({ diets: [] });

    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));

    // Regression: focusing from a frame callback raced the render that created
    // the summary, and focus fell through to <body>.
    expect(screen.getByRole('alert')).toHaveFocus();
  });

  it('re-announces the error on a second failed attempt', async () => {
    const user = userEvent.setup();
    renderForm({ diets: [] });

    const submit = screen.getByRole('button', { name: 'Create our meal plan' });
    await user.click(submit);
    await user.click(screen.getByRole('button', { name: 'High protein' }));
    await user.click(screen.getByRole('button', { name: 'High protein' }));
    await user.click(submit);

    expect(screen.getByRole('alert')).toHaveFocus();
  });

  it('focuses the new-food input when the add control opens', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: '+ Add' }));

    expect(screen.getByRole('textbox', { name: 'New food to avoid' })).toHaveFocus();
  });

  it('rejects a duplicate avoided food without adding it twice', async () => {
    const user = userEvent.setup();
    renderForm({ avoidFoods: ['Mushrooms'] });

    await user.click(screen.getByRole('button', { name: '+ Add' }));
    await user.type(screen.getByRole('textbox', { name: 'New food to avoid' }), 'mushrooms{Enter}');

    expect(screen.getByText('mushrooms is already on the list.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Remove .* from foods to avoid/ })).toHaveLength(1);
  });

  it('disables the steppers at their bounds', async () => {
    renderForm({ dinners: 7, weeklyBudget: 40 });

    expect(screen.getByRole('button', { name: 'Increase dinners needed' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease weekly budget by $5' })).toBeDisabled();
  });
});
