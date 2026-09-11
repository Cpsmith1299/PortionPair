import { signOutAction } from './actions';
import './sign-out-button.css';

/**
 * Rendered from `app/week/page.tsx`, outside the locked `AppNavigation`
 * component (CLAUDE.md §10's approved nav has no sign-out affordance, and
 * Profile — its natural home — is intentionally disabled until that screen
 * exists). A plain server-rendered form: no client JS needed for one button.
 */
export function SignOutButton() {
  return (
    <form action={signOutAction} className="sign-out-form">
      <button type="submit" className="sign-out-button">
        Sign out
      </button>
    </form>
  );
}
