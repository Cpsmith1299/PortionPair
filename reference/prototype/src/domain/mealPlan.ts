export const DIET_OPTIONS = [
  'Balanced',
  'High protein',
  'Vegetarian',
  'Gluten-free',
  'Low-carb',
  'Dairy-free',
] as const;

export const COOK_TIMES = [20, 30, 45, 60] as const;

export type DietOption = (typeof DIET_OPTIONS)[number];
export type CookTime = (typeof COOK_TIMES)[number];

export interface PlanPreferences {
  diets: DietOption[];
  avoidFoods: string[];
  weeklyBudget: number;
  dinners: number;
  maxCookTime: CookTime;
}

export interface PlanValidationErrors {
  diets?: string;
  weeklyBudget?: string;
}

export interface MealSummary {
  id: string;
  day: string;
  date: string;
  name: string;
  time: number;
  image?: string;
  imageAlt?: string;
  tags?: string[];
  cost?: number;
  charlie?: { calories: number; protein: number; portion: string };
  sam?: { calories: number; protein: number; portion: string };
}

export interface WeeklyPlan {
  weekLabel: string;
  preferences: PlanPreferences;
  meals: MealSummary[];
}

export const DEFAULT_PREFERENCES: PlanPreferences = {
  diets: ['Balanced', 'Gluten-free'],
  avoidFoods: ['Mushrooms', 'Cilantro', 'Blue cheese'],
  weeklyBudget: 90,
  dinners: 5,
  maxCookTime: 30,
};

export function validatePreferences(preferences: PlanPreferences): PlanValidationErrors {
  const errors: PlanValidationErrors = {};
  if (preferences.diets.length === 0) {
    errors.diets = 'Choose at least one dietary preference so we can shape the plan.';
  }
  if (preferences.weeklyBudget < 50) {
    errors.weeklyBudget = 'Set a budget of at least $50 for two people.';
  }
  return errors;
}

export function addAvoidFood(current: string[], draft: string): { foods: string[]; error?: string } {
  const normalized = draft.trim();
  if (!normalized) return { foods: current, error: 'Enter a food name first.' };
  if (current.some((food) => food.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
    return { foods: current, error: `${normalized} is already on the list.` };
  }
  return { foods: [...current, normalized] };
}

export function makeWeeklyPlan(preferences: PlanPreferences): WeeklyPlan {
  const allMeals: MealSummary[] = [
    { id: 'fajitas', day: 'Mon', date: 'Aug 3', name: 'Sheet-pan chicken fajitas', time: 25 },
    { id: 'orzo', day: 'Tue', date: 'Aug 4', name: 'Creamy tomato orzo', time: 20 },
    {
      id: 'lemon-chicken', day: 'Wed', date: 'Aug 5', name: 'Lemon herb chicken bowls', time: 30,
      image: 'roastChicken', imageAlt: 'A roast chicken resting in its pan on a wooden kitchen table',
      tags: ['High protein', 'Gluten-free'], cost: 4.8,
      charlie: { calories: 720, protein: 52, portion: '6 oz chicken · 1½ cups rice' },
      sam: { calories: 540, protein: 38, portion: '4 oz chicken · 1 cup rice' },
    },
    { id: 'salmon', day: 'Thu', date: 'Aug 6', name: 'Miso salmon with sesame greens', time: 25 },
    { id: 'pasta', day: 'Fri', date: 'Aug 7', name: 'Turkey pesto pasta', time: 20 },
    { id: 'tacos', day: 'Sat', date: 'Aug 8', name: 'Roasted vegetable tacos', time: 30 },
    { id: 'beef', day: 'Sun', date: 'Aug 9', name: 'Ginger beef lettuce bowls', time: 30 },
  ];
  const meals = allMeals.map((meal, index) => index < preferences.dinners ? meal : {
    ...meal,
    id: `leftovers-${meal.day.toLowerCase()}`,
    name: 'Leftovers night',
    time: 10,
  });
  return { weekLabel: 'Aug 3–9', preferences, meals };
}

export async function generateWeeklyPlan(preferences: PlanPreferences): Promise<WeeklyPlan> {
  await new Promise((resolve) => window.setTimeout(resolve, 700));
  return makeWeeklyPlan(preferences);
}
