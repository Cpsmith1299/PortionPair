/**
 * Curated starter recipe catalog (CLAUDE.md §15 Milestone 3, §8 "Recipe strategy").
 *
 * These are the seven meals CLAUDE.md §12 names as accepted examples — the
 * brief calls for 40–75 recipes at full strength, so this batch is a starting
 * point to prove the ingredient/nutrition/portion pipeline end to end, not the
 * finished catalog. Grow it by adding entries here and to `ingredients.ts`;
 * nothing else needs to change.
 *
 * Quantities are written for the base `servings` yield; the portion engine
 * (`domain/portions/scale.ts`) derives each member's actual plate from there.
 * This catalog is not wired into `DeterministicPlanner` yet — that swap, and
 * the AI-proposal step ahead of it, is Milestone 4 (CLAUDE.md §15).
 */

import type { Recipe } from './types';

export const RECIPE_CATALOG: Recipe[] = [
  {
    id: 'lemon-herb-chicken-bowls',
    slug: 'lemon-herb-chicken-bowls',
    name: 'Lemon herb chicken bowls',
    description: 'Roasted chicken over rice with roasted vegetables and a bright lemon herb dressing.',
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    dietaryTags: ['High protein', 'Gluten-free'],
    allergenTags: [],
    imageKey: 'roast-chicken',
    imageAlt: 'A roast chicken resting in its pan on a wooden kitchen table',
    costPerServing: 4.8,
    status: 'verified',
    ingredients: [
      { ingredientId: 'chicken-breast', role: 'protein', quantity: { amount: 340, unit: 'g' } },
      { ingredientId: 'white-rice-cooked', role: 'carb', quantity: { amount: 2.5, unit: 'cup' } },
      { ingredientId: 'roasted-mixed-vegetables', role: 'vegetable', quantity: { amount: 1.75, unit: 'cup' } },
      { ingredientId: 'lemon-herb-dressing', role: 'fat', quantity: { amount: 3.5, unit: 'tbsp' } },
    ],
    instructions: [
      'Season chicken breasts and roast at 425°F until cooked through, about 20 minutes.',
      'Toss vegetables with a little oil and roast alongside the chicken.',
      'Whisk together olive oil, lemon juice, and chopped herbs for the dressing.',
      'Slice the chicken and serve over rice with roasted vegetables, finished with dressing.',
    ],
  },
  {
    id: 'miso-salmon-sesame-greens',
    slug: 'miso-salmon-sesame-greens',
    name: 'Miso salmon with sesame greens',
    description: 'Miso-glazed salmon over quick sesame-sautéed greens.',
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 2,
    dietaryTags: ['High protein'],
    allergenTags: ['fish', 'soy'],
    costPerServing: 6.5,
    status: 'verified',
    ingredients: [
      { ingredientId: 'salmon-atlantic', role: 'protein', quantity: { amount: 340, unit: 'g' } },
      { ingredientId: 'sesame-sauteed-greens', role: 'vegetable', quantity: { amount: 2.5, unit: 'cup' } },
      { ingredientId: 'miso-ginger-glaze', role: 'fat', quantity: { amount: 3, unit: 'tbsp' } },
    ],
    instructions: [
      'Brush salmon fillets with miso ginger glaze and broil until just cooked through.',
      'Sauté greens with a little sesame oil until wilted.',
      'Serve salmon over the greens with any remaining glaze spooned on top.',
    ],
  },
  {
    id: 'turkey-pesto-pasta',
    slug: 'turkey-pesto-pasta',
    name: 'Turkey pesto pasta',
    description: 'Ground turkey and cherry tomatoes tossed with pasta and basil pesto.',
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 2,
    dietaryTags: ['Balanced'],
    allergenTags: ['gluten', 'tree-nut', 'dairy'],
    costPerServing: 5.2,
    status: 'verified',
    ingredients: [
      { ingredientId: 'ground-turkey-93', role: 'protein', quantity: { amount: 300, unit: 'g' } },
      { ingredientId: 'spinach-pasta-cooked', role: 'carb', quantity: { amount: 280, unit: 'g' } },
      { ingredientId: 'cherry-tomatoes', role: 'vegetable', quantity: { amount: 1.3, unit: 'cup' } },
      { ingredientId: 'basil-pesto', role: 'fat', quantity: { amount: 4, unit: 'tbsp' } },
      { ingredientId: 'parmesan-grated', role: 'other', quantity: { amount: 3, unit: 'tbsp' }, preparationNote: 'to finish' },
    ],
    instructions: [
      'Cook pasta according to package directions; reserve a little pasta water.',
      'Brown ground turkey in a skillet, breaking it up as it cooks.',
      'Add cherry tomatoes and cook until just softened.',
      'Toss the pasta, turkey, and tomatoes with pesto, loosening with pasta water as needed.',
      'Finish with grated parmesan.',
    ],
  },
  {
    id: 'roasted-vegetable-tacos',
    slug: 'roasted-vegetable-tacos',
    name: 'Roasted vegetable tacos',
    description: 'Black beans and roasted sweet potato in corn tortillas with avocado.',
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    dietaryTags: ['Vegetarian', 'Gluten-free'],
    allergenTags: [],
    costPerServing: 3.9,
    status: 'verified',
    ingredients: [
      { ingredientId: 'black-beans-canned', role: 'protein', quantity: { amount: 300, unit: 'g' } },
      { ingredientId: 'corn-tortilla', role: 'carb', quantity: { amount: 6, unit: 'piece' } },
      { ingredientId: 'roasted-sweet-potato-pepper', role: 'vegetable', quantity: { amount: 2.5, unit: 'cup' } },
      { ingredientId: 'avocado', role: 'fat', quantity: { amount: 1, unit: 'piece' } },
    ],
    instructions: [
      'Roast diced sweet potato and bell pepper until tender and lightly charred.',
      'Warm the black beans with a pinch of cumin and chili powder.',
      'Warm the tortillas.',
      'Fill tortillas with beans, roasted vegetables, and sliced avocado.',
    ],
  },
  {
    id: 'ginger-beef-lettuce-bowls',
    slug: 'ginger-beef-lettuce-bowls',
    name: 'Ginger beef lettuce bowls',
    description: 'Ginger-soy beef and quick-pickled carrots wrapped in butter lettuce.',
    prepMinutes: 15,
    cookMinutes: 15,
    servings: 2,
    dietaryTags: ['Low-carb'],
    allergenTags: ['soy', 'gluten'],
    costPerServing: 5.6,
    status: 'verified',
    ingredients: [
      { ingredientId: 'beef-flank-steak', role: 'protein', quantity: { amount: 320, unit: 'g' } },
      { ingredientId: 'butter-lettuce', role: 'vegetable', quantity: { amount: 12, unit: 'piece' } },
      { ingredientId: 'pickled-carrots', role: 'vegetable', quantity: { amount: 1.5, unit: 'cup' } },
      { ingredientId: 'ginger-soy-glaze', role: 'fat', quantity: { amount: 3, unit: 'tbsp' } },
    ],
    instructions: [
      'Slice beef thinly against the grain and stir-fry over high heat until browned.',
      'Toss with ginger soy glaze.',
      'Serve in butter lettuce leaves topped with quick-pickled carrots.',
    ],
  },
  {
    id: 'creamy-tomato-orzo',
    slug: 'creamy-tomato-orzo',
    name: 'Creamy tomato orzo',
    description: 'Orzo simmered with crushed tomatoes, spinach, and a little cream.',
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    dietaryTags: ['Vegetarian'],
    allergenTags: ['gluten', 'dairy'],
    costPerServing: 3.6,
    status: 'verified',
    ingredients: [
      { ingredientId: 'parmesan-grated', role: 'protein', quantity: { amount: 4, unit: 'tbsp' } },
      { ingredientId: 'orzo-cooked', role: 'carb', quantity: { amount: 300, unit: 'g' } },
      { ingredientId: 'crushed-tomatoes', role: 'vegetable', quantity: { amount: 1.5, unit: 'cup' } },
      { ingredientId: 'baby-spinach', role: 'vegetable', quantity: { amount: 2, unit: 'cup' } },
      { ingredientId: 'heavy-cream', role: 'fat', quantity: { amount: 4, unit: 'tbsp' } },
    ],
    instructions: [
      'Simmer orzo in a mix of stock and crushed tomatoes until tender.',
      'Stir in spinach until wilted and cream until glossy.',
      'Finish with grated parmesan.',
    ],
  },
  {
    id: 'sheet-pan-chicken-fajitas',
    slug: 'sheet-pan-chicken-fajitas',
    name: 'Sheet-pan chicken fajitas',
    description: 'Roasted chicken, peppers, and onions in flour tortillas.',
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    dietaryTags: ['High protein'],
    allergenTags: ['gluten'],
    costPerServing: 4.5,
    status: 'verified',
    ingredients: [
      { ingredientId: 'chicken-breast', role: 'protein', quantity: { amount: 320, unit: 'g' } },
      { ingredientId: 'flour-tortilla', role: 'carb', quantity: { amount: 6, unit: 'piece' } },
      { ingredientId: 'roasted-peppers-onions', role: 'vegetable', quantity: { amount: 2.5, unit: 'cup' } },
      { ingredientId: 'olive-oil', role: 'other', quantity: { amount: 2, unit: 'tbsp' } },
    ],
    instructions: [
      'Toss sliced chicken, peppers, and onions with olive oil and fajita seasoning.',
      'Roast on a sheet pan at 425°F until the chicken is cooked through, about 20 minutes.',
      'Warm the tortillas and serve everything alongside for building fajitas.',
    ],
  },
];

export const RECIPE_LOOKUP: Record<string, Recipe> = Object.fromEntries(
  RECIPE_CATALOG.map((recipe) => [recipe.id, recipe]),
);
