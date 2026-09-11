import { z } from 'zod';

/** Schema validation at the server boundary (CLAUDE.md §7, §17). */

const email = z.string().trim().min(1, 'Enter your email.').email('Enter a valid email address.');

// Supabase's own minimum is 6; 8 is the floor we ask for at signup.
const password = z.string().min(8, 'Use at least 8 characters.').max(72, 'That password is too long.');

const memberName = z.string().trim().min(1, 'Enter a name.').max(40, 'Keep it under 40 characters.');

export const signUpSchema = z.object({
  email,
  password,
  householdName: z.string().trim().min(1, 'Enter a household name.').max(60, 'Keep it under 60 characters.'),
  memberNames: z.tuple([memberName, memberName]),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email,
  // Login checks credentials, not password strength — no min length here.
  password: z.string().min(1, 'Enter your password.'),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({ email });
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const updatePasswordSchema = z.object({ password });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
