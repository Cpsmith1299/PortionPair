'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { GROCERY_CATEGORIES, GROCERY_CATEGORY_LABELS } from '@/domain/groceries/categorize';
import { AppNavigation } from '@/features/week/AppNavigation';
import '@/features/week/week.css';
import {
  addCustomGroceryItemAction,
  removeGroceryItemAction,
  updateGroceryItemStateAction,
} from './actions';
import type { GroceryItemView } from '@/lib/planning/grocery-repository';
import './grocery.css';

interface GroceryListViewProps {
  groceryListId: string;
  weekLabel: string;
  initialItems: GroceryItemView[];
}

export function GroceryListView({ groceryListId, weekLabel, initialItems }: GroceryListViewProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const draftInputId = useId();

  const grouped = useMemo(() => {
    const byCategory = new Map<string, GroceryItemView[]>();
    for (const item of items) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return GROCERY_CATEGORIES.map((category) => ({ category, items: byCategory.get(category) ?? [] })).filter(
      (group) => group.items.length > 0,
    );
  }, [items]);

  const checkedCount = items.filter((item) => item.checked).length;

  function patchItem(id: string, changes: Partial<GroceryItemView>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }

  async function handleToggleChecked(item: GroceryItemView) {
    patchItem(item.id, { checked: !item.checked });
    const result = await updateGroceryItemStateAction(item.id, { checked: !item.checked });
    if (!result.ok) {
      patchItem(item.id, { checked: item.checked });
      setError(result.error);
    }
  }

  async function handleTogglePantry(item: GroceryItemView) {
    patchItem(item.id, { pantry: !item.pantry });
    const result = await updateGroceryItemStateAction(item.id, { pantry: !item.pantry });
    if (!result.ok) {
      patchItem(item.id, { pantry: item.pantry });
      setError(result.error);
    }
  }

  async function handleRemove(item: GroceryItemView) {
    const previous = items;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    const result = await removeGroceryItemAction(item.id);
    if (!result.ok) {
      setItems(previous);
      setError(result.error);
    }
  }

  async function handleAddCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;

    setError('');
    const result = await addCustomGroceryItemAction({ groceryListId, name });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((current) => [...current, result.item]);
    setDraft('');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <span className="wordmark wordmark--large">PortionPair</span>
          <AppNavigation />
        </div>
      </header>

      <main className="week-main grocery-list">
        <Link href="/week" className="back-link">
          ← Back to this week
        </Link>

        <header className="grocery-list__header">
          <span className="eyebrow">{weekLabel}</span>
          <h1>Grocery list</h1>
          <p>
            {checkedCount} of {items.length} checked off
          </p>
        </header>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <p className="grocery-list__empty">
            No dinners are planned this week, so there is nothing to shop for.{' '}
            <button type="button" onClick={() => router.push('/week')}>
              Back to this week
            </button>
          </p>
        ) : (
          grouped.map((group) => (
            <section className="grocery-category" key={group.category} aria-labelledby={`category-${group.category}`}>
              <h2 id={`category-${group.category}`}>{GROCERY_CATEGORY_LABELS[group.category]}</h2>
              <ul>
                {group.items.map((item) => (
                  <li key={item.id} className={item.checked ? 'grocery-item grocery-item--checked' : 'grocery-item'}>
                    <label>
                      <input type="checkbox" checked={item.checked} onChange={() => handleToggleChecked(item)} />
                      <span className="grocery-item__name">{item.canonicalName}</span>
                      {item.displayQuantity && <span className="grocery-item__quantity">{item.displayQuantity}</span>}
                    </label>
                    <div className="grocery-item__actions">
                      <button
                        type="button"
                        className={item.pantry ? 'grocery-item__pantry grocery-item__pantry--active' : 'grocery-item__pantry'}
                        aria-pressed={item.pantry}
                        onClick={() => handleTogglePantry(item)}
                      >
                        Already have it
                      </button>
                      {item.isCustom && (
                        <button type="button" aria-label={`Remove ${item.canonicalName}`} onClick={() => handleRemove(item)}>
                          ×
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <form className="grocery-add-form" onSubmit={handleAddCustom}>
          <label className="field-label" htmlFor={draftInputId}>
            Add a custom item
          </label>
          <div className="grocery-add-form__row">
            <input
              id={draftInputId}
              className="text-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="e.g. Paper towels"
            />
            <Button type="submit">Add</Button>
          </div>
        </form>
      </main>

      <AppNavigation mobile />
    </div>
  );
}
