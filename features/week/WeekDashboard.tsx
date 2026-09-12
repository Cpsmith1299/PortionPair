'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { sortedMembers, type HouseholdMember } from '@/domain/households/types';
import type { MemberPortion, PlannedMeal, WeeklyPlan } from '@/domain/meal-plans/types';
import { replaceMealAction } from '@/features/planning/actions';
import { resolveMealImage } from '@/lib/planning/demo-catalog';
import { AppNavigation } from './AppNavigation';
import './week.css';

interface WeekDashboardProps {
  plan: WeeklyPlan;
  onEditPreferences: () => void;
}

/** `household` shows every member's portion side by side; otherwise one member. */
type PortionView = 'household' | string;

export function WeekDashboard({ plan, onEditPreferences }: WeekDashboardProps) {
  const router = useRouter();
  const members = sortedMembers(plan.household);
  const views: PortionView[] = ['household', ...members.map((member) => member.id)];

  const [selectedDay, setSelectedDay] = useState(() => initialDayIndex(plan.meals));
  const [view, setView] = useState<PortionView>('household');
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState('');

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedMeal = plan.meals[selectedDay];

  async function handleReplaceMeal() {
    if (!selectedMeal?.mealPlanItemId) return;
    setReplacing(true);
    setReplaceError('');

    const result = await replaceMealAction(selectedMeal.mealPlanItemId);
    setReplacing(false);

    if (!result.ok) {
      setReplaceError(result.error);
      return;
    }
    router.refresh();
  }

  /** Roving focus: arrows move focus and selection together (CLAUDE.md §11). */
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: PortionView) {
    const index = views.indexOf(current);
    let next: PortionView | undefined;

    if (event.key === 'ArrowRight') next = views[(index + 1) % views.length];
    if (event.key === 'ArrowLeft') next = views[(index - 1 + views.length) % views.length];
    if (event.key === 'Home') next = views[0];
    if (event.key === 'End') next = views[views.length - 1];
    if (!next) return;

    event.preventDefault();
    setView(next);
    tabRefs.current[next]?.focus();
  }

  if (!selectedMeal) return null;

  const visiblePortions = selectedMeal.portions.filter(
    (portion) => view === 'household' || portion.memberId === view,
  );
  const dinnersPlanned = plan.meals.filter((meal) => meal.kind === 'cooked').length;
  const mealImage = resolveMealImage(selectedMeal.imageKey);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <span className="wordmark wordmark--large">PortionPair</span>
          <AppNavigation />
          {members[0] && <Avatar name={members[0].name} profileColor={members[0].profileColor} />}
        </div>
      </header>

      <main className="week-main">
        <header className="week-heading">
          <div>
            <span className="eyebrow">Same meal, same table.</span>
            <h1>This week’s plan</h1>
            <p>
              {dinnersPlanned} dinners · {members.length} people · ${plan.preferences.weeklyBudget} budget
            </p>
          </div>
          <div className="week-controls">
            <button type="button" disabled aria-label="Previous week, unavailable">
              ←
            </button>
            <strong>{plan.weekLabel}</strong>
            <button type="button" disabled aria-label="Next week, unavailable">
              →
            </button>
          </div>
        </header>

        <div className="person-tabs" role="tablist" aria-label="View portions for">
          {views.map((item) => {
            const member = members.find((candidate) => candidate.id === item);
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={view === item}
                tabIndex={view === item ? 0 : -1}
                ref={(node) => {
                  tabRefs.current[item] = node;
                }}
                onKeyDown={(event) => handleTabKeyDown(event, item)}
                onClick={() => setView(item)}
              >
                {member ? (
                  <Avatar name={member.name} profileColor={member.profileColor} size="small" />
                ) : (
                  <span className="household-icon" aria-hidden="true">
                    All
                  </span>
                )}
                {member ? member.name : 'Household'}
              </button>
            );
          })}
        </div>

        <div className="day-tabs" role="tablist" aria-label="Days this week">
          {plan.meals.map((meal, index) => (
            <button
              key={meal.id}
              type="button"
              role="tab"
              aria-selected={selectedDay === index}
              tabIndex={selectedDay === index ? 0 : -1}
              onClick={() => setSelectedDay(index)}
            >
              <span>{meal.dayLabel}</span>
              <strong>{meal.dateLabel.split(' ')[1]}</strong>
            </button>
          ))}
        </div>

        <div className="week-grid">
          <section className="featured-meal" aria-labelledby="featured-meal-title">
            {mealImage ? (
              <div className="featured-meal__photo">
                <Image
                  src={mealImage}
                  alt={selectedMeal.imageAlt ?? ''}
                  fill
                  sizes="(min-width: 64rem) 46rem, 100vw"
                  priority
                />
                <span>{selectedMeal.time} min</span>
              </div>
            ) : (
              /* A deliberate UI state, not a failed image request. */
              <div
                className="meal-placeholder"
                role="img"
                aria-label={`${selectedMeal.name}, image coming soon`}
              >
                <span>{selectedMeal.dayLabel}</span>
              </div>
            )}

            <div className="featured-meal__body">
              <div className="meal-title-row">
                <div>
                  <span className="eyebrow">{selectedMeal.dayLabel} · Dinner</span>
                  <h2 id="featured-meal-title">{selectedMeal.name}</h2>
                </div>
                {selectedMeal.costPerServing !== undefined && (
                  <span className="meal-cost">
                    ~${selectedMeal.costPerServing.toFixed(2)} / serving
                  </span>
                )}
              </div>

              {selectedMeal.tags && (
                <div className="meal-tags">
                  {selectedMeal.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}

              {visiblePortions.length > 0 ? (
                <>
                  <div className="portions" aria-label="Personalized portions">
                    {visiblePortions.map((portion) => (
                      <Portion
                        key={portion.memberId}
                        portion={portion}
                        member={members.find((member) => member.id === portion.memberId)}
                      />
                    ))}
                  </div>
                  <p className="estimate-note">
                    Portions and nutrition are estimates, and vary by brand and cooking method.
                  </p>
                </>
              ) : (
                <p className="meal-preview-copy">
                  {selectedMeal.kind === 'leftovers'
                    ? 'Reheat what you cooked earlier this week — no new shopping needed.'
                    : 'Your personalized portions will be ready in the detailed cooking view.'}
                </p>
              )}

              <div className="meal-actions">
                {selectedMeal.mealPlanItemId && selectedMeal.kind === 'cooked' ? (
                  <Link className="button button--primary" href={`/meals/${selectedMeal.mealPlanItemId}`}>
                    View meal details
                  </Link>
                ) : (
                  <Button type="button" disabled>
                    View meal details
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!selectedMeal.mealPlanItemId || selectedMeal.kind !== 'cooked'}
                  loading={replacing}
                  loadingLabel="Replacing…"
                  onClick={handleReplaceMeal}
                >
                  Replace meal
                </Button>
              </div>
              {replaceError && (
                <p className="field-error" role="alert">
                  {replaceError}
                </p>
              )}
            </div>
          </section>

          <aside className="week-sidebar" aria-label="Week summary">
            <section className="summary-card">
              <span className="eyebrow">Grocery list</span>
              <div className="summary-card__heading">
                <h2>One list for the week</h2>
              </div>
              <p>Built from every dinner and combined for both portions.</p>
              <Link className="button button--secondary button--full" href="/grocery">
                Open grocery list
              </Link>
            </section>

            <section className="summary-card summary-card--subtle">
              <span className="eyebrow">Your setup</span>
              <h2>Plan preferences</h2>
              <div className="preference-tags">
                {plan.preferences.diets.map((diet) => (
                  <span key={diet}>{diet}</span>
                ))}
              </div>
              <p>
                {plan.preferences.avoidFoods.length > 0
                  ? `Avoiding ${plan.preferences.avoidFoods.join(', ')} · up to ${plan.preferences.maxCookTime} minutes.`
                  : `Up to ${plan.preferences.maxCookTime} minutes.`}
              </p>
              <Button type="button" variant="ghost" onClick={onEditPreferences}>
                Edit preferences
              </Button>
            </section>
          </aside>
        </div>

        <section className="rest-of-week" aria-labelledby="rest-of-week-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">The full table</span>
              <h2 id="rest-of-week-heading">Rest of the week</h2>
            </div>
            <span>{dinnersPlanned} dinners planned</span>
          </div>
          <div className="meal-list">
            {plan.meals.map((meal, index) => (
              <button
                key={meal.id}
                type="button"
                aria-current={selectedDay === index ? 'true' : undefined}
                onClick={() => setSelectedDay(index)}
              >
                <span className="meal-list__day">
                  {meal.dayLabel}
                  <small>{meal.dateLabel}</small>
                </span>
                <span className="meal-list__name">{meal.name}</span>
                <span className="meal-list__time">{meal.time} min</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <AppNavigation mobile />
    </div>
  );
}

/**
 * Which day the dashboard opens on.
 *
 * Prefers the first cooked day that can actually show portions, so the screen
 * leads with the product's whole answer — the meal *and* each person's share —
 * rather than a day whose figures are not calculated yet. Once every meal
 * carries real portions (Milestone 3), the first cooked day wins on its own.
 *
 * Milestone 2 replaces this with "today, when today falls inside the plan week".
 */
function initialDayIndex(meals: PlannedMeal[]): number {
  const withPortions = meals.findIndex((meal) => meal.kind === 'cooked' && meal.portions.length > 0);
  if (withPortions !== -1) return withPortions;

  const firstCooked = meals.findIndex((meal) => meal.kind === 'cooked');
  return firstCooked === -1 ? 0 : firstCooked;
}

function Portion({ portion, member }: { portion: MemberPortion; member: HouseholdMember | undefined }) {
  if (!member) return null;

  return (
    <div className="portion">
      <Avatar name={member.name} profileColor={member.profileColor} size="small" />
      <div>
        <strong>{member.name}</strong>
        <span>{portion.portion}</span>
      </div>
      <div className="portion__numbers">
        <strong>{portion.calories}</strong>
        <span>cal · {portion.protein}g protein</span>
      </div>
    </div>
  );
}

export type { PlannedMeal };
