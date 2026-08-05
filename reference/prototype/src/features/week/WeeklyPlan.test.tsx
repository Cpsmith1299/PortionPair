import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_PREFERENCES, makeWeeklyPlan } from '../../domain/mealPlan';
import { WeeklyPlan } from './WeeklyPlan';

describe('WeeklyPlan', () => {
  it('supports roving keyboard selection for household portion tabs', async () => {
    const user = userEvent.setup();
    render(<WeeklyPlan plan={makeWeeklyPlan(DEFAULT_PREFERENCES)} onEditPreferences={vi.fn()} />);

    const charlie = screen.getByRole('tab', { name: 'Charlie' });
    const sam = screen.getByRole('tab', { name: 'Sam' });
    await user.click(charlie);
    await user.keyboard('{ArrowRight}');

    expect(sam).toHaveFocus();
    expect(sam).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByText('Sam').length).toBeGreaterThan(0);
  });
});
