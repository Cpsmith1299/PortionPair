import { z } from 'zod';
import { CALORIE_RANGE, PROTEIN_RANGE, type MemberNutritionTargetInput } from '@/domain/households/nutrition-targets';

/** Schema validation at the server boundary (CLAUDE.md §7, §17) — mirrors the migration's `check` constraints. */
export const nutritionTargetsInputSchema: z.ZodType<MemberNutritionTargetInput[]> = z
  .array(
    z.object({
      memberId: z.string().uuid(),
      calories: z.number().int().min(CALORIE_RANGE.min).max(CALORIE_RANGE.max),
      proteinG: z.number().min(PROTEIN_RANGE.min).max(PROTEIN_RANGE.max),
    }),
  )
  .min(1);
