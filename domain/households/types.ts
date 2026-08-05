/**
 * Household identity. Two members maximum for the MVP (see CLAUDE.md §4).
 *
 * `profileColor` names a locked design-token slot (`--color-profile-charlie` /
 * `--color-profile-sam`), not a person. The tokens keep the names they were
 * approved under in Design System v0.2.2; a member using the `charlie` slot need
 * not be named Charlie.
 */

export const PROFILE_COLORS = ['charlie', 'sam'] as const;
export type ProfileColor = (typeof PROFILE_COLORS)[number];

export interface HouseholdMember {
  id: string;
  name: string;
  /** Ascending; controls tab and portion order. */
  displayOrder: number;
  profileColor: ProfileColor;
}

export interface Household {
  id: string;
  name: string;
  members: HouseholdMember[];
}

export function sortedMembers(household: Household): HouseholdMember[] {
  return [...household.members].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function findMember(household: Household, memberId: string): HouseholdMember | undefined {
  return household.members.find((member) => member.id === memberId);
}
