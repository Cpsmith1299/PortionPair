'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { combineScaledIngredientLines } from '@/domain/portions/aggregate';
import type { MealDetailsPortion } from '@/lib/planning/repository';
import { formatIngredientQuantity } from '@/domain/recipes/portion-text';
import { INGREDIENT_LOOKUP } from '@/domain/recipes/ingredients';
import type { Recipe } from '@/domain/recipes/types';
import { replaceMealAction } from '@/features/planning/actions';
import { AppNavigation } from '@/features/week/AppNavigation';
import '@/features/week/week.css';
import './meal-details.css';

const ROLE_ORDER = ['protein', 'carb', 'vegetable', 'fat', 'other'] as const;

interface MealDetailsViewProps {
  mealPlanItemId: string;
  dayLabel: string;
  dateLabel: string;
  recipe: Recipe;
  portions: MealDetailsPortion[];
}

export function MealDetailsView({ mealPlanItemId, dayLabel, dateLabel, recipe, portions }: MealDetailsViewProps) {
  const router = useRouter();
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState('');

  const combined = combineScaledIngredientLines(portions.map((portion) => portion.scaledIngredients));
  const orderedCombined = [...combined].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );

  async function handleReplace() {
    setReplacing(true);
    setError('');
    const result = await replaceMealAction(mealPlanItemId);
    setReplacing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <span className="wordmark wordmark--large">PortionPair</span>
          <AppNavigation />
        </div>
      </header>

      <main className="week-main meal-details">
        <Link href="/week" className="meal-details__back">
          ← Back to this week
        </Link>

        <header className="meal-details__header">
          <span className="eyebrow">
            {dayLabel} · Dinner{dateLabel ? ` · ${dateLabel}` : ''}
          </span>
          <h1>{recipe.name}</h1>
          <p>{recipe.description}</p>
          <div className="meal-tags">
            {recipe.dietaryTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p className="meal-details__meta">
            {recipe.prepMinutes + recipe.cookMinutes} min
            {recipe.costPerServing !== undefined && ` · ~$${recipe.costPerServing.toFixed(2)} / serving`}
          </p>
        </header>

        <div className="meal-details__grid">
          <section aria-labelledby="ingredients-heading">
            <h2 id="ingredients-heading">Total household ingredients</h2>
            <ul className="ingredient-list">
              {orderedCombined.map((line) => (
                <li key={line.ingredientId}>{formatIngredientQuantity(line.ingredientId, line.grams, INGREDIENT_LOOKUP)}</li>
              ))}
            </ul>

            <h2>Instructions</h2>
            <ol className="instruction-list">
              {recipe.instructions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>

          <aside aria-labelledby="portions-heading">
            <h2 id="portions-heading">Individual portions</h2>
            {portions.map((portion) => (
              <div className="portion-detail" key={portion.member.id}>
                <div className="portion-detail__header">
                  <Avatar name={portion.member.name} profileColor={portion.member.profileColor} size="small" />
                  <strong>{portion.member.name}</strong>
                  <span>
                    {portion.calories} cal · {portion.proteinG}g protein
                  </span>
                </div>
                <ul className="ingredient-list ingredient-list--compact">
                  {portion.scaledIngredients.map((line) => (
                    <li key={line.ingredientId}>{formatIngredientQuantity(line.ingredientId, line.grams, INGREDIENT_LOOKUP)}</li>
                  ))}
                </ul>
                {portion.warnings.length > 0 && (
                  <p className="portion-detail__note">{portion.warnings.join(' ')}</p>
                )}
              </div>
            ))}

            <p className="estimate-note">Portions and nutrition are estimates, and vary by brand and cooking method.</p>

            <Button type="button" variant="secondary" fullWidth loading={replacing} loadingLabel="Replacing…" onClick={handleReplace}>
              Replace this meal
            </Button>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
          </aside>
        </div>
      </main>

      <AppNavigation mobile />
    </div>
  );
}
