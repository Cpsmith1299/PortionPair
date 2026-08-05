import type { Household } from '@/domain/households/types';

/**
 * The representative household from CLAUDE.md §12, used consistently across
 * demos and fixtures. Replaced by the persisted household in Milestone 2.
 *
 * Neither portion is framed as better or worse than the other.
 */
export const DEMO_HOUSEHOLD: Household = {
  id: 'demo-household',
  name: 'Our kitchen',
  members: [
    { id: 'charlie', name: 'Charlie', displayOrder: 0, profileColor: 'charlie' },
    { id: 'sam', name: 'Sam', displayOrder: 1, profileColor: 'sam' },
  ],
};
