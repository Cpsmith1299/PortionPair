import { sortedMembers } from '@/domain/households/types';
import type { Planner, PlannerInput } from '@/domain/meal-plans/planner';
import { DAYS_IN_WEEK, type MemberPortion, type PlannedMeal, type WeeklyPlan } from '@/domain/meal-plans/types';
import { buildWeekDays, formatWeekLabel, startOfWeek, toIsoDate } from '@/domain/meal-plans/week';
import { DEMO_CATALOG, LEFTOVERS_MEAL, type CatalogMeal } from './demo-catalog';

/**
 * Local, deterministic planner for slice one.
 *
 * Same input always yields the same plan — no randomness, no clock reads, no
 * browser globals. It exists so the flow is reviewable before the real
 * AI-proposal + nutrition-engine pipeline lands (CLAUDE.md §8); it deliberately
 * does not filter the catalog by diet or avoided foods, because real
 * allergy and dietary enforcement belongs to the verified recipe domain in
 * Milestone 3 and must not be faked here.
 */
export class DeterministicPlanner implements Planner {
  constructor(private readonly catalog: CatalogMeal[] = DEMO_CATALOG) {}

  async generateWeeklyPlan(input: PlannerInput): Promise<WeeklyPlan> {
    const { preferences, household, weekStart } = input;
    const monday = startOfWeek(weekStart);
    const days = buildWeekDays(monday);
    const members = sortedMembers(household);

    const meals: PlannedMeal[] = days.map((day) => {
      const source = this.catalog[day.dayIndex % this.catalog.length]!;
      const isCooked = day.dayIndex < preferences.dinners;

      // Days beyond the chosen dinner count become leftovers rather than
      // disappearing — the week always shows seven days (CLAUDE.md §3).
      if (!isCooked) {
        return {
          id: `leftovers-${day.isoDate}`,
          ...day,
          name: LEFTOVERS_MEAL.name,
          time: LEFTOVERS_MEAL.time,
          kind: 'leftovers',
          portions: [],
        };
      }

      return {
        id: `${source.id}-${day.isoDate}`,
        ...day,
        name: source.name,
        time: source.time,
        kind: 'cooked',
        imageKey: source.imageKey,
        imageAlt: source.imageAlt,
        tags: source.tags,
        costPerServing: source.costPerServing,
        portions: toMemberPortions(source, members),
      };
    });

    if (meals.length !== DAYS_IN_WEEK) {
      throw new Error(`Expected ${DAYS_IN_WEEK} days, built ${meals.length}.`);
    }

    return {
      weekStart: toIsoDate(monday),
      weekLabel: formatWeekLabel(monday),
      preferences,
      household,
      meals,
    };
  }
}

function toMemberPortions(
  source: CatalogMeal,
  members: ReturnType<typeof sortedMembers>,
): MemberPortion[] {
  const figures = source.portionsByMemberOrder;
  if (!figures) return [];

  return members.flatMap((member, index) => {
    const figure = figures[index];
    return figure ? [{ memberId: member.id, ...figure }] : [];
  });
}

export const deterministicPlanner = new DeterministicPlanner();
