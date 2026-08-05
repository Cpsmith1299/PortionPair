/**
 * Fixture catalog for slice one — NOT a nutrition source.
 *
 * Only "Lemon herb chicken bowls" carries portion figures, because those are the
 * only numbers approved in CLAUDE.md §12. No calories or macros are invented
 * here for the other meals: the remaining entries render the deliberate
 * "portions in the detailed cooking view" state, exactly as the locked
 * prototype does. Real figures arrive in Milestone 3, computed by the
 * deterministic nutrition engine from verified FoodData Central mappings.
 *
 * Meal names are the accepted examples listed in CLAUDE.md §12.
 */

export interface CatalogPortion {
  portion: string;
  calories: number;
  protein: number;
}

export interface CatalogMeal {
  id: string;
  name: string;
  /** Active cooking time in minutes. */
  time: number;
  imageKey?: string;
  imageAlt?: string;
  tags?: string[];
  costPerServing?: number;
  /**
   * Indexed by member display order. Present only where CLAUDE.md supplies
   * approved figures. Undefined means "not yet calculated", not "zero".
   */
  portionsByMemberOrder?: CatalogPortion[];
}

export const DEMO_CATALOG: CatalogMeal[] = [
  {
    id: 'sheet-pan-chicken-fajitas',
    name: 'Sheet-pan chicken fajitas',
    time: 25,
  },
  {
    id: 'creamy-tomato-orzo',
    name: 'Creamy tomato orzo',
    time: 20,
  },
  {
    id: 'lemon-herb-chicken-bowls',
    name: 'Lemon herb chicken bowls',
    time: 30,
    imageKey: 'roast-chicken',
    imageAlt: 'A roast chicken resting in its pan on a wooden kitchen table',
    tags: ['High protein', 'Gluten-free'],
    costPerServing: 4.8,
    portionsByMemberOrder: [
      { portion: '6 oz chicken · 1½ cups rice', calories: 720, protein: 52 },
      { portion: '4 oz chicken · 1 cup rice', calories: 540, protein: 38 },
    ],
  },
  {
    id: 'miso-salmon-sesame-greens',
    name: 'Miso salmon with sesame greens',
    time: 25,
  },
  {
    id: 'turkey-pesto-pasta',
    name: 'Turkey pesto pasta',
    time: 20,
  },
  {
    id: 'roasted-vegetable-tacos',
    name: 'Roasted vegetable tacos',
    time: 30,
  },
  {
    id: 'ginger-beef-lettuce-bowls',
    name: 'Ginger beef lettuce bowls',
    time: 30,
  },
];

/** Photography packaged under `public/meals/` (Design System v0.2.2 assets). */
export const MEAL_IMAGES: Record<string, string> = {
  'roast-chicken': '/meals/photo-roast-chicken.jpg',
  'two-plates': '/meals/photo-two-plates.jpg',
  'two-bowls-curry': '/meals/photo-two-bowls-curry.jpg',
  'pasta-wood': '/meals/photo-pasta-wood.jpg',
  'soup-bowl': '/meals/photo-soup-bowl.jpg',
};

export function resolveMealImage(imageKey: string | undefined): string | undefined {
  return imageKey ? MEAL_IMAGES[imageKey] : undefined;
}

/** Leftovers nights reheat, they don't cook. */
export const LEFTOVERS_MEAL = {
  name: 'Leftovers night',
  time: 10,
} as const;
