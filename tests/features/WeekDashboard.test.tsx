import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PREFERENCES, type PlanPreferences, type WeeklyPlan } from '@/domain/meal-plans/types';
import { WeekDashboard } from '@/features/week/WeekDashboard';
import { DeterministicPlanner } from '@/lib/planning/deterministic-planner';
import { DEMO_HOUSEHOLD } from '@/lib/planning/demo-household';

const planner = new DeterministicPlanner();

async function buildPlan(overrides: Partial<PlanPreferences> = {}): Promise<WeeklyPlan> {
  return planner.generateWeeklyPlan({
    preferences: { ...DEFAULT_PREFERENCES, ...overrides },
    household: DEMO_HOUSEHOLD,
    weekStart: new Date('2026-08-03T00:00:00Z'),
  });
}

describe('WeekDashboard', () => {
  let plan: WeeklyPlan;

  beforeEach(async () => {
    plan = await buildPlan({ dinners: 7 });
  });

  it('supports roving keyboard selection for household portion tabs', async () => {
    const user = userEvent.setup();
    render(<WeekDashboard plan={plan} onEditPreferences={vi.fn()} />);

    const household = screen.getByRole('tab', { name: 'Household' });
    const charlie = screen.getByRole('tab', { name: 'Charlie' });

    await user.click(household);
    await user.keyboard('{ArrowRight}');

    expect(charlie).toHaveFocus();
    expect(charlie).toHaveAttribute('aria-selected', 'true');
    expect(household).toHaveAttribute('aria-selected', 'false');
  });

  it('wraps focus around the ends and supports Home/End', async () => {
    const user = userEvent.setup();
    render(<WeekDashboard plan={plan} onEditPreferences={vi.fn()} />);

    const household = screen.getByRole('tab', { name: 'Household' });
    const sam = screen.getByRole('tab', { name: 'Sam' });

    await user.click(household);
    await user.keyboard('{ArrowLeft}');
    expect(sam).toHaveFocus();

    await user.keyboard('{Home}');
    expect(household).toHaveFocus();

    await user.keyboard('{End}');
    expect(sam).toHaveFocus();
  });

  it('keeps exactly one portion tab in the tab order', async () => {
    render(<WeekDashboard plan={plan} onEditPreferences={vi.fn()} />);

    const tabs = screen
      .getAllByRole('tab')
      .filter((tab) => tab.closest('.person-tabs'));

    expect(tabs.filter((tab) => tab.getAttribute('tabindex') === '0')).toHaveLength(1);
  });

  it('narrows the visible portions to the selected member', async () => {
    const user = userEvent.setup();
    render(<WeekDashboard plan={plan} onEditPreferences={vi.fn()} />);

    // The featured meal is the one with approved portion figures.
    expect(screen.getByText('6 oz chicken · 1½ cups rice')).toBeInTheDocument();
    expect(screen.getByText('4 oz chicken · 1 cup rice')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Sam' }));

    expect(screen.queryByText('6 oz chicken · 1½ cups rice')).not.toBeInTheDocument();
    expect(screen.getByText('4 oz chicken · 1 cup rice')).toBeInTheDocument();
  });

  it('shows all seven days including leftovers nights', async () => {
    const threeDinners = await buildPlan({ dinners: 3 });
    render(<WeekDashboard plan={threeDinners} onEditPreferences={vi.fn()} />);

    const dayTabs = screen.getAllByRole('tab').filter((tab) => tab.closest('.day-tabs'));
    expect(dayTabs).toHaveLength(7);
    expect(screen.getAllByText('Leftovers night')).toHaveLength(4);
  });

  it('labels nutrition as an estimate wherever figures are shown', () => {
    render(<WeekDashboard plan={plan} onEditPreferences={vi.fn()} />);

    expect(
      screen.getByText(/Portions and nutrition are estimates/),
    ).toBeInTheDocument();
  });

  it('returns to setup when preferences are edited', async () => {
    const user = userEvent.setup();
    const onEditPreferences = vi.fn();
    render(<WeekDashboard plan={plan} onEditPreferences={onEditPreferences} />);

    await user.click(screen.getByRole('button', { name: 'Edit preferences' }));

    expect(onEditPreferences).toHaveBeenCalledOnce();
  });
});
