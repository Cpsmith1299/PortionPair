import type { Metadata } from 'next';
import { SignInForm } from '@/features/auth/SignInForm';

export const metadata: Metadata = {
  title: 'Log in — PortionPair',
};

export default function LoginPage() {
  return <SignInForm />;
}
