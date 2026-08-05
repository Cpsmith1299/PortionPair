import { useRef, useState, type KeyboardEvent } from 'react';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { mealImages } from '../../data/assets';
import type { MealSummary, WeeklyPlan as WeeklyPlanModel } from '../../domain/mealPlan';
import './weekly-plan.css';

interface WeeklyPlanProps {
  plan: WeeklyPlanModel;
  onEditPreferences: () => void;
}

const PERSONS = ['household', 'charlie', 'sam'] as const;
type Person = (typeof PERSONS)[number];

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>;
}

function CartIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" /><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /></svg>;
}

function HeartIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21S4 16.5 2 11.5C.8 8.5 2.8 5 6.2 5c2.2 0 3.7 1.2 4.8 2.8C12 6.2 13.7 5 15.8 5c3.4 0 5.4 3.5 4.2 6.5C18 16.5 12 21 12 21Z" /></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}

function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const items = [
    { label: 'Week', icon: <CalendarIcon />, active: true },
    { label: 'Grocery', icon: <CartIcon />, active: false },
    { label: 'Favorites', icon: <HeartIcon />, active: false },
    { label: 'Profile', icon: <UserIcon />, active: false },
  ];
  return (
    <nav className={mobile ? 'mobile-nav' : 'desktop-nav'} aria-label="Primary">
      {items.map((item) => (
        <button key={item.label} type="button" aria-current={item.active ? 'page' : undefined} disabled={!item.active} aria-label={!item.active ? `${item.label}, coming soon` : item.label}>
          {mobile && <span className="nav-icon">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Portion({ person, meal }: { person: 'charlie' | 'sam'; meal: MealSummary }) {
  const details = meal[person];
  if (!details) return null;
  return (
    <div className="portion">
      <Avatar person={person} size="small" />
      <div>
        <strong>{person === 'charlie' ? 'Charlie' : 'Sam'}</strong>
        <span>{details.portion}</span>
      </div>
      <div className="portion__numbers"><strong>{details.calories}</strong><span>cal · {details.protein}g protein</span></div>
    </div>
  );
}

export function WeeklyPlan({ plan, onEditPreferences }: WeeklyPlanProps) {
  const initialDay = Math.min(2, Math.max(0, plan.meals.length - 1));
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [person, setPerson] = useState<Person>('household');
  const tabRefs = useRef<Record<Person, HTMLButtonElement | null>>({ household: null, charlie: null, sam: null });
  const selectedMeal = plan.meals[selectedDay];

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: Person) {
    const index = PERSONS.indexOf(current);
    let next: Person | undefined;
    if (event.key === 'ArrowRight') next = PERSONS[(index + 1) % PERSONS.length];
    if (event.key === 'ArrowLeft') next = PERSONS[(index - 1 + PERSONS.length) % PERSONS.length];
    if (event.key === 'Home') next = PERSONS[0];
    if (event.key === 'End') next = PERSONS[PERSONS.length - 1];
    if (!next) return;
    event.preventDefault();
    setPerson(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <span className="wordmark wordmark--large">PortionPair</span>
          <AppNavigation />
          <Avatar person="charlie" />
        </div>
      </header>

      <main className="week-main">
        <header className="week-heading">
          <div>
            <span className="eyebrow">Same meal, same table.</span>
            <h1>This week’s plan</h1>
            <p>{plan.preferences.dinners} dinners · 2 people · ${plan.preferences.weeklyBudget} budget</p>
          </div>
          <div className="week-controls">
            <button type="button" disabled aria-label="Previous week, unavailable">←</button>
            <strong>{plan.weekLabel}</strong>
            <button type="button" disabled aria-label="Next week, unavailable">→</button>
          </div>
        </header>

        <div className="person-tabs" role="tablist" aria-label="View portions for">
          {PERSONS.map((item) => (
            <button
              key={item} type="button" role="tab" aria-selected={person === item} tabIndex={person === item ? 0 : -1}
              ref={(node) => { tabRefs.current[item] = node; }}
              onKeyDown={(event) => handleTabKeyDown(event, item)} onClick={() => setPerson(item)}
            >
              {item === 'household' ? <span className="household-icon">All</span> : <Avatar person={item} size="small" />}
              {item === 'household' ? 'Household' : item === 'charlie' ? 'Charlie' : 'Sam'}
            </button>
          ))}
        </div>

        <div className="day-tabs" role="tablist" aria-label="Days this week">
          {plan.meals.map((meal, index) => (
            <button key={meal.id} type="button" role="tab" aria-selected={selectedDay === index} tabIndex={selectedDay === index ? 0 : -1} onClick={() => setSelectedDay(index)}>
              <span>{meal.day}</span><strong>{meal.date.split(' ')[1]}</strong>
            </button>
          ))}
        </div>

        <div className="week-grid">
          <section className="featured-meal" aria-labelledby="featured-meal-title">
            {selectedMeal.image ? (
              <div className="featured-meal__photo">
                <img src={mealImages[selectedMeal.image as keyof typeof mealImages]} alt={selectedMeal.imageAlt} />
                <span>{selectedMeal.time} min</span>
              </div>
            ) : (
              <div className="meal-placeholder" role="img" aria-label={`${selectedMeal.name}, image coming soon`}><span>{selectedMeal.day}</span></div>
            )}
            <div className="featured-meal__body">
              <div className="meal-title-row">
                <div>
                  <span className="eyebrow">{selectedMeal.day} · Dinner</span>
                  <h2 id="featured-meal-title">{selectedMeal.name}</h2>
                </div>
                {selectedMeal.cost && <span className="meal-cost">${selectedMeal.cost.toFixed(2)} / serving</span>}
              </div>
              {selectedMeal.tags && <div className="meal-tags">{selectedMeal.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
              {selectedMeal.charlie && (
                <div className="portions" aria-label="Personalized portions">
                  {(person === 'household' || person === 'charlie') && <Portion person="charlie" meal={selectedMeal} />}
                  {(person === 'household' || person === 'sam') && <Portion person="sam" meal={selectedMeal} />}
                </div>
              )}
              {!selectedMeal.charlie && <p className="meal-preview-copy">Your personalized portions will be ready in the detailed cooking view.</p>}
              <div className="meal-actions">
                <Button type="button" disabled>View meal details</Button>
                <Button type="button" variant="secondary" disabled>Replace meal</Button>
              </div>
            </div>
          </section>

          <aside className="week-sidebar" aria-label="Week summary">
            <section className="summary-card">
              <span className="eyebrow">Grocery list</span>
              <div className="summary-card__heading"><h2>One list for the week</h2><strong>18 items</strong></div>
              <p>Built from every dinner and combined for both portions.</p>
              <div className="progress-line"><span style={{ width: '28%' }} /></div>
              <span className="summary-meta">5 of 18 collected</span>
              <Button type="button" variant="secondary" fullWidth disabled>Open grocery list</Button>
            </section>

            <section className="summary-card summary-card--subtle">
              <span className="eyebrow">Your setup</span>
              <h2>Plan preferences</h2>
              <div className="preference-tags">{plan.preferences.diets.map((diet) => <span key={diet}>{diet}</span>)}</div>
              <p>Avoiding {plan.preferences.avoidFoods.join(', ')} · up to {plan.preferences.maxCookTime} minutes.</p>
              <Button type="button" variant="ghost" onClick={onEditPreferences}>Edit preferences</Button>
            </section>
          </aside>
        </div>

        <section className="rest-of-week" aria-labelledby="rest-of-week-heading">
          <div className="section-heading"><div><span className="eyebrow">The full table</span><h2 id="rest-of-week-heading">Rest of the week</h2></div><span>{plan.preferences.dinners} dinners planned</span></div>
          <div className="meal-list">
            {plan.meals.map((meal, index) => (
              <button key={meal.id} type="button" aria-current={selectedDay === index ? 'true' : undefined} onClick={() => setSelectedDay(index)}>
                <span className="meal-list__day">{meal.day}<small>{meal.date}</small></span>
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
