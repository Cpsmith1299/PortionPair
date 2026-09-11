import { describe, expect, it } from 'vitest';
import {
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from '@/features/auth/schema';

const VALID_SIGN_UP = {
  email: 'charlie@example.com',
  password: 'correct-horse',
  householdName: 'The Smiths',
  memberNames: ['Charlie', 'Sam'] as [string, string],
};

describe('signUpSchema', () => {
  it('accepts a complete signup', () => {
    expect(signUpSchema.safeParse(VALID_SIGN_UP).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signUpSchema.safeParse({ ...VALID_SIGN_UP, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a password under 8 characters', () => {
    const result = signUpSchema.safeParse({ ...VALID_SIGN_UP, password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects a blank household name', () => {
    const result = signUpSchema.safeParse({ ...VALID_SIGN_UP, householdName: '   ' });
    expect(result.success).toBe(false);
  });

  it('requires both member names', () => {
    const result = signUpSchema.safeParse({ ...VALID_SIGN_UP, memberNames: ['Charlie', ''] });
    expect(result.success).toBe(false);
  });
});

describe('signInSchema', () => {
  it('accepts any non-empty password (login checks credentials, not strength)', () => {
    expect(signInSchema.safeParse({ email: 'charlie@example.com', password: 'x' }).success).toBe(true);
  });

  it('rejects an empty password', () => {
    expect(signInSchema.safeParse({ email: 'charlie@example.com', password: '' }).success).toBe(false);
  });
});

describe('requestPasswordResetSchema', () => {
  it('requires a valid email', () => {
    expect(requestPasswordResetSchema.safeParse({ email: 'charlie@example.com' }).success).toBe(true);
    expect(requestPasswordResetSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('updatePasswordSchema', () => {
  it('enforces the same minimum length as signup', () => {
    expect(updatePasswordSchema.safeParse({ password: 'correct-horse' }).success).toBe(true);
    expect(updatePasswordSchema.safeParse({ password: 'short' }).success).toBe(false);
  });
});
