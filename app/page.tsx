import { redirect } from 'next/navigation';

/**
 * The marketing site (Home, How It Works, Pricing) is not part of slice one, so
 * the root goes straight to the flow that is built.
 */
export default function HomePage() {
  redirect('/onboarding');
}
