import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_PREFERENCES, makeWeeklyPlan } from '../../domain/mealPlan';
import { OnboardingFlow } from './OnboardingFlow';

describe('OnboardingFlow', () => {
  it('supports preference changes and completes the generation flow', async () => {
    const user = userEvent.setup();
    const generatePlan = vi.fn(async (preferences) => makeWeeklyPlan(preferences));
    const onComplete = vi.fn();
    render(<OnboardingFlow initialPreferences={DEFAULT_PREFERENCES} generatePlan={generatePlan} onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: 'Vegetarian' }));
    await user.click(screen.getByRole('button', { name: 'Increase dinners needed' }));
    await user.click(screen.getByRole('button', { name: '+ Add' }));
    await user.type(screen.getByRole('textbox', { name: 'New food to avoid' }), 'Shellfish{Enter}');
    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));

    expect(generatePlan).toHaveBeenCalledWith(expect.objectContaining({
      dinners: 6,
      diets: expect.arrayContaining(['Vegetarian']),
      avoidFoods: expect.arrayContaining(['Shellfish']),
    }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('shows an accessible validation error when no diet is selected', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow initialPreferences={{ ...DEFAULT_PREFERENCES, diets: [] }} generatePlan={async (preferences) => makeWeeklyPlan(preferences)} onComplete={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('Check your choices')).toBeInTheDocument();
    expect(screen.getByText('Choose at least one dietary preference so we can shape the plan.')).toBeInTheDocument();
  });

  it('reports a generation failure and allows a retry', async () => {
    const user = userEvent.setup();
    const generator = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(makeWeeklyPlan(DEFAULT_PREFERENCES));
    const onComplete = vi.fn();
    render(<OnboardingFlow initialPreferences={DEFAULT_PREFERENCES} generatePlan={generator} onComplete={onComplete} />);
    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));
    expect(await screen.findByText('We couldn’t create the plan. Check your connection and try again.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create our meal plan' }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
